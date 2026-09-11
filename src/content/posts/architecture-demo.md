---
title: 单体的订单库存支付服务微服务化历程
published: 2025-04-08
updated: 2026-09-11
description: 面向只写过 Spring Boot 单体的开发者：先跑通订单、库存和支付，再一步步理解远程调用、Nacos、Dubbo、网关和限流，最后亲手复现超时与事务问题。
category: 开发实践
tags:
  - Java
  - Spring Cloud Alibaba
  - Dubbo
  - Nacos
  - 微服务
  - MySQL
draft: false
---

> 2026 年 9 月 11 日翻新：已更新配套代码、依赖说明和配置，并使用 Docker、Nacos、Dubbo 与真实 MySQL 8 验证。具体版本在文末列出，使用固定的兼容组合复现实验。

## 先从我们熟悉的 Spring Boot 开始

前面的[订单实验](/posts/order-demo/)和[分库分表实验](/posts/sharding-demo/)里，用户发一个请求，Controller 接住，Service 处理业务，最后操作数据库。这个开发方式我们已经很熟悉了。

现在有一个需求：把库存单独拆出去。

我最初容易想成“把 InventoryService 放到另一个项目，再给两个项目加上 Cloud 依赖”。真正动手才发现，还有几个问题没回答：

- 库存代码去了另一个进程，原来的方法调用怎么办？
- 订单服务怎么知道库存服务的地址？
- 库存已经扣了，订单这边却报超时，还能不能直接重试？
- 以前一个事务就能回滚，拆开后还管用吗？

这篇就沿着这些问题往下做。你只需要会写 Spring Boot 的 Controller、Service，会配置数据源，知道数据库事务的提交和回滚。遇到 Cloud 里的新名词，我们用到时再解释。

**前半篇的目标很小：亲眼看到订单进程调用库存进程，并完成一笔支付。** 跑通以后，再加统一入口、动态配置和限流，最后处理故障。

配套工程叫 `architecture-demo`。正文按照学习顺序讲解，工程里已经包含完整实现；代码块会注明对应文件和省略范围，不需要用节选覆盖整个文件。

## 一、先把已有的单体跑起来

### 1.1 这个单体已经能做什么

业务只有一种商品 `SKU-A`，初始库存 100 件，每件 1000 分，也就是 10 元。

用户可以买、付款、取消。付款在 Demo 里表示向支付表写一条记账记录，不涉及真实扣款。

~~~text
一次下单请求
    ↓
OrderController：接收 requestId、用户、商品、数量
    ↓
Orders：创建订单，安排库存预占
    ↓
InventoryModule：修改库存

这些 Java 对象都在同一个 Spring Boot 进程里。
Orders、InventoryModule、PaymentModule 连接同一个数据库。
~~~

代码里的 `Orders` 就承担我们平时 `OrderService` 的职责；`InventoryModule` 和 `PaymentModule` 对应库存、支付业务类。“Module”只是类名的一部分。

库存分成三份：

| 字段 | 中文含义 | 买两件后 | 付完款后 |
| --- | --- | --- | --- |
| `available` | 还能卖的数量 | 98 | 98 |
| `locked` | 已给订单留住、还没付款的数量 | 2 | 0 |
| `sold` | 已经卖出的数量 | 0 | 2 |

这里把“先给订单留住两件货”叫作**预占库存**。它可以防止用户付款前，这两件货又卖给别人。付款前取消，就把预占的两件归还。

### 1.2 先认识这几个文件

打开 Demo 后，第一遍只看这些：

~~~text
architecture-demo/
├── pom.xml                   管理模块和依赖版本，不启动应用
├── compose.yaml
└── monolith-service/
    ├── pom.xml               单体自己的依赖和打包配置
    ├── Dockerfile            把单体 jar 做成镜像
    └── src/main/
        ├── resources/application.yml
        └── java/com/jayczee/architecturedemo/monolith/
            ├── MonolithApplication.java   启动 Spring Boot
            ├── OrderController.java       下单、付款、取消的 HTTP 接口
            ├── AdminController.java       实验查看、重置入口
            ├── Orders.java                下单、支付、取消业务
            ├── InventoryModule.java       库存操作
            ├── PaymentModule.java         支付记账
            └── MonolithDatabase.java      单体的建表与数据查看
~~~

单体用到的基础依赖是：

| 依赖 | 在这个项目里干什么 |
| --- | --- |
| `spring-boot-starter-web` | 启动内嵌 Web 服务器，让 Controller 接收 HTTP 请求 |
| `spring-boot-starter-jdbc` | 提供数据库连接池、JdbcTemplate 和事务相关支持 |
| `mysql-connector-j` | 让 Java 连接 MySQL |
| `jackson-databind` | 在 Java 对象与 JSON 之间转换，Web Starter 也会带入它 |

这些基础依赖放在 `demo-support/pom.xml`，`monolith-service/pom.xml` 引用这个公共库后，Maven 会一起带入它们。公共库还提供连接池、本地事务和实验接口的辅助代码，**没有订单、库存、支付的业务实现，也没有 Cloud 依赖**。

根 `pom.xml` 负责统一版本和组织构建，`monolith-service` 才是能启动的应用模块。它自己的 jar 包含全部三块单体业务，仍然只运行一个业务进程。

### 1.3 只启动 MySQL 和单体

下面所有终端命令都在 **Demo 根目录 `architecture-demo`** 执行。需要 JDK 17 或更高版本、Maven、Python 3、OpenSSL，以及已运行的 Docker 和 Compose v2。

先打包并准备 Demo 数据库密码：

~~~bash
mvn -B -ntp -pl monolith-service -am package

mkdir -p secrets
chmod 700 secrets
if [ ! -s secrets/mysql_password ]; then
    (umask 077; openssl rand -hex 24 > secrets/mysql_password)
fi

docker compose up -d --wait mysql
docker compose up -d --build --wait monolith
~~~

`docker compose` 按 `compose.yaml` 启动指定容器；`-d` 表示后台运行，`--wait` 等待健康检查通过，`--build` 先构建应用镜像。

Maven 命令中的 `-pl monolith-service` 表示本次选择单体模块，`-am` 表示它用到的公共模块也一起构建。得到的可执行文件是 `monolith-service/target/monolith-service-1.0.0.jar`；此时没有打包其他业务服务。

密码只在首次生成，已有文件会保留。它通过文件挂进容器，不写进代码，`secrets/` 也被 Git 忽略。MySQL 是 Demo 专用实例，程序会自动建库建表。

验证单体是否起来：

~~~bash
curl -sS http://127.0.0.1:18182/health
~~~

应该看到：

~~~json
{"role":"monolith","ready":true}
~~~

**此时只需要一个业务容器和一个 MySQL 容器，Nacos 还没启动。**

如果 Docker 装在服务器上，命令也在那台服务器执行；这里的 `127.0.0.1` 指执行 curl 的机器。想从自己的电脑访问服务器容器，需要先做 SSH 端口转发。

### 1.4 真正下一单，再付一次款

先清空这个单体的教学数据，让后面的数字一致。`/reset` 会删除这个应用的订单和支付记录，并把库存恢复为 100，别用它处理需要保留的数据。

~~~bash
curl -sS -X POST http://127.0.0.1:18182/reset

curl -i http://127.0.0.1:18182/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"mono-1","userId":7,"sku":"SKU-A","quantity":2}'
~~~

`-i` 会显示 HTTP 状态码。响应应为 **200**，订单里的 `status` 是 **RESERVED**，中文就是“库存已经留好了”。

`requestId` 是这次业务请求的编号。相同请求重发时继续用 `mono-1`，表示“还是刚才那笔单”，后面防止重复扣库存会用到它。

接着付款并查看数据：

~~~bash
curl -sS http://127.0.0.1:18182/pay \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"mono-1"}'

curl -sS http://127.0.0.1:18182/snapshot
~~~

`/snapshot` 是 Demo 自己写的查看接口，返回这个应用数据库里的教学数据。关注四处就够了：

~~~text
orders 中 mono-1 的 status：PAID
stock 中 available / locked / sold：98 / 0 / 2
reservations 中 mono-1 的 state：CONFIRMED
payments：只有一条 mono-1 的记录，金额 2000 分
~~~

再创建一笔订单，试试付款前取消：

~~~bash
curl -sS http://127.0.0.1:18182/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"mono-cancel","userId":7,"sku":"SKU-A","quantity":2}'

curl -sS http://127.0.0.1:18182/cancel \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"mono-cancel"}'
~~~

新订单变成 `CANCELLED`，库存回到 98 / 0 / 2，之前那笔已付款订单不受影响。

### 1.5 原来的本地事务为什么好用

打开单体模块中的 `Orders.java`，`place` 方法通过 `database.transaction(...)` 包住下单操作。`MonolithDatabase` 继承公共库 `demo-support` 中的 `support/Database.java`，后者内部用 `TransactionTemplate` 执行这个事务。

它和常见的 `@Transactional` 都可以表达“这组数据库操作一起提交，失败一起回滚”，只是本例把事务范围显式写在代码里。

单体下单方法中的两句核心代码是：

~~~java
inventory.apply("reserve", requestId, sku, quantity);
status(requestId, "RESERVED");
~~~

含义是：先预占库存，再把订单标记为已经预占。它们和创建订单一起处在外层事务中。

`InventoryModule.java` 内部真正扣库存的 SQL 是：

~~~java
int changed = database.jdbc.update("""
        update stock set available=available-?, locked=locked+?
        where sku=? and available>=?
        """, quantity, quantity, sku, quantity);
if (changed == 0) throw new BusinessConflict("insufficient stock");
~~~

同一条 SQL 同时检查库存和扣减，库存不足就不更新。这样避免先查到“有库存”，等真正修改时却已经被别人买走。

单体付款分支的业务代码是：

~~~java
payment.charge(requestId, ((Number) row.get("amount_fen")).longValue());
inventory.apply("confirm", requestId, (String) row.get("sku"), ((Number) row.get("quantity")).intValue());
~~~

`charge` 写支付记录，`confirm` 把待付款库存转为已售，随后更新订单状态。三类操作共用一个数据源和事务管理器，因此能够一起回滚。

**先记住这个前提：这些操作共用当前应用中的同一个数据库事务。** 接下来把库存搬到另一个进程，这个前提就改变了。

还可以亲手验证一次回滚。下面让下一笔订单在写完库存之后抛异常：

~~~bash
curl -sS http://127.0.0.1:18182/fault \
  -H 'Content-Type: application/json' -d '{"mode":"rollback"}'
curl -i http://127.0.0.1:18182/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"mono-rollback","userId":7,"sku":"SKU-A","quantity":2}'
curl -sS http://127.0.0.1:18182/snapshot
~~~

下单接口返回 503；如果按前面的顺序运行，库存仍是 98 / 0 / 2，数据库中没有 mono-rollback 这笔订单。刚才执行过的库存更新随事务一起回滚了。

## 二、到底把什么拆开了

假设库存模块开始接入多个销售渠道，规则经常改；订单查询逻辑却比较稳定。

在单体里，修改库存后需要发布整个应用。库存任务如果把这个 JVM 拖垮，历史订单查询也一起受影响。我希望库存能单独部署、单独重启，订单查询继续工作。

这次就按业务职责分成三个进程：

| 进程 | 保存什么 | 不再直接修改什么 |
| --- | --- | --- |
| 订单 orders | 订单数据 | 库存表、支付表 |
| 库存 inventory | 库存、预占记录 | 订单表 |
| 支付 payment | 模拟支付记录 | 订单表、库存表 |

这里的“服务”有两层意思，容易混淆：

- 以前说 `InventoryService`，通常是在说一个 Java 类，Spring 把它创建成当前应用中的对象。
- 拆分后说“库存服务”，是在说一个**可以单独启动和停止的应用进程**，里面仍然有普通的 Java 业务类。

![同进程调用与拆成独立应用后的区别](/assets/images/architecture-demo/architecture-boundary.svg)

工程也跟着拆开。打开根目录，会看到下面这些 Maven 模块：

~~~text
architecture-demo/
├── pom.xml                 packaging=pom，统一组织构建
├── demo-contracts/         普通 jar：双方共用的 RPC 接口
├── demo-support/           普通 jar：JDBC、事务、参数校验、实验辅助
├── monolith-service/       可执行 jar：保留迁移前的完整单体
├── order-service/          可执行 jar：订单应用
├── inventory-service/      可执行 jar：库存应用
├── payment-service/        可执行 jar：支付应用
└── gateway-service/        可执行 jar：后面加入的 HTTP 网关
~~~

“Maven 模块”先理解成一个有自己 `pom.xml` 的子项目。根工程的 `<modules>` 列出它们，统一执行构建；每个应用仍有自己的启动类、配置文件和 Dockerfile。

| 应用模块 | 构建后的可执行文件（各自 target 目录下） | 连接的库 |
| --- | --- | --- |
| monolith-service | monolith-service-1.0.0.jar | amdemo_monolith |
| order-service | order-service-1.0.0.jar | amdemo_orders |
| inventory-service | inventory-service-1.0.0.jar | amdemo_inventory |
| payment-service | payment-service-1.0.0.jar | amdemo_payment |
| gateway-service | gateway-service-1.0.0.jar | 不连接业务数据库 |

三个业务微服务都依赖 `demo-contracts` 和 `demo-support`，但**互相不依赖对方的应用模块**。订单包里没有库存 SQL 和支付实现；订单要操作它们，只能调用约定的远程接口。单体保留自己的库存、支付类，用来对照迁移前后的事务边界。

两个公共 jar 不需要单独启动。Spring Boot 打包时会把所需公共库放进应用 jar 的 `BOOT-INF/lib/`，部署时只需拿这个应用的可执行 jar。网关不依赖 `demo-support`，避免把其中的 Spring MVC、数据库依赖带入 WebFlux 网关。

**同一个代码仓库可以放多个独立应用。这里是五份不同的应用 jar，运行时各有自己的 JVM；不是用一个启动参数让同一份 jar 扮演不同服务。**

### 2.1 原来的依赖注入还能怎么办

在普通单体中，你可能这样写：

~~~java
@Autowired
private InventoryService inventoryService;
~~~

这是常见单体写法的示意。Spring 会在**当前应用的容器**里找一个对象注入。执行 `inventoryService.reserve(...)` 时，处理请求的线程直接进入那个对象的方法。

库存应用去了另一个 JVM，订单这边就不能靠 `@Autowired` 获得那边的对象。需要把参数通过网络发过去，让对方执行，再把结果发回来。

这种“让另一个进程替我执行一个方法”的方式，叫 **RPC，远程过程调用**。

我们用 **Dubbo** 来完成它。你写的调用仍然像 Java 方法调用，但 Dubbo 会在背后完成发送参数、接收结果等网络工作。

接着还有一个问题：Dubbo 向哪个地址发？

我们用 **Nacos** 保存服务地址。库存启动时向 Nacos 登记“我在这个地址提供服务”，订单从 Nacos 获取可用地址。登记叫**服务注册**，查找叫**服务发现**。

先学会这两个组件，就能理解第一次远程调用了。

### 2.2 Spring Cloud Alibaba 又放在哪里

Spring Boot 继续负责启动每一个应用。

Spring Cloud 提供微服务开发中常用的整合方式；Spring Cloud Alibaba 提供接入 Nacos、Sentinel 等组件的 Starter。它们是一组依赖与配置支持，你仍然在写 Spring Boot 应用。

本篇用到的 Dubbo 则有自己的 Starter，用来接入 RPC。Nacos 要作为一个独立服务启动；Dubbo 的消费端、提供端代码分别运行在业务应用里，不需要再启动一个“Dubbo 中转服务器”。

## 三、先让订单成功调用一次远程方法

这一节先调用一个只返回字符串的 `ping()`，把网络连通和业务处理分开理解。

### 3.1 工程里新增哪些代码

~~~text
demo-contracts/.../api/
├── InventoryRpc.java        约定库存可以被远程调用哪些方法
└── PaymentRpc.java          约定支付可以被远程调用哪些方法
inventory-service/.../inventory/
├── InventoryApplication.java 库存启动类，开启 Dubbo 扫描
├── InventoryProvider.java    发布库存远程接口
└── InventoryModule.java      真正执行库存业务
payment-service/.../payment/
├── PaymentApplication.java   支付启动类，开启 Dubbo 扫描
└── PaymentProvider.java      发布支付远程接口
order-service/.../orders/
├── OrdersApplication.java    订单启动类，开启 Dubbo 扫描
├── OrderController.java      接收 HTTP 请求
└── RemoteGateway.java        调用库存、支付远程接口
~~~

上图的 `...` 都表示 `src/main/java/com/jayczee/architecturedemo`。先看 `demo-contracts` 模块里的 `api/InventoryRpc.java`，省略 package 后的完整定义是：

~~~java
public interface InventoryRpc {
    String ping();
    String apply(String operation, String requestId, String sku, int quantity);
}
~~~

接口就像双方约定的方法清单：方法名是什么、要传几个参数、返回什么类型。订单和库存两边都需要有同一个接口定义。

因此把它放进独立的普通 jar，在订单、库存、支付各自的 `pom.xml` 中引用：

~~~xml
<dependency>
    <groupId>com.jayczee</groupId>
    <artifactId>demo-contracts</artifactId>
    <version>1.0.0</version>
</dependency>
~~~

这里共用的是方法约定，`InventoryModule` 的实现仍只属于库存应用。接口有变化时，需要同时考虑调用方和提供方是否兼容；把共享接口任意改掉，并不能保证已部署的旧订单应用还能调用新库存应用。

`ping()` 暂时用于验证连通；`apply(...)` 后面才用来操作库存。

### 3.2 库存应用：提供一个方法给别人调用

打开库存模块的 `InventoryProvider.java`。发布远程服务的注解是：

~~~java
@DubboService(version = "1.0.0", group = "architecture-demo")
~~~

`@DubboService` 的意思是：把这个类实现的接口发布成远程服务，让其他应用能调用。

这里把**实现并执行方法的应用**叫作提供者，所以这个类取名为 `InventoryProvider`。

类中的 `ping()` 实现只有一句：

~~~java
@Override
public String ping() {
    return "inventory";
}
~~~

这个类只存在于库存应用的源码和 jar 中。订单应用引用的是接口库，不会把这个提供者打进自己的包里，所以也不需要通过 profile 开关来排除它。

### 3.3 订单应用：拿到一个远程调用代理

打开订单模块的 `orders/RemoteGateway.java`，可以看到：

~~~java
@DubboReference(
    version = "1.0.0",
    group = "architecture-demo",
    timeout = 800,
    retries = 0,
    check = false,
    lazy = true
)
private InventoryRpc inventory;
~~~

`@DubboReference` 会让 Dubbo 创建一个实现 `InventoryRpc` 的**代理对象**，放到这个字段里。

代理对象存在订单进程中。当你调用 `inventory.ping()`，它会通过网络请求库存进程，真正执行的是对方的 `InventoryProvider.ping()`。订单在这里是消费端，也就是发起调用的一方。

![一次 Dubbo 调用实际经过哪些位置](/assets/images/architecture-demo/first-rpc.svg)

第一次先理解前三项：

| 配置 | 白话解释 |
| --- | --- |
| `version`、`group` | 用来匹配约定的接口版本和分组，两边应一致 |
| `timeout = 800` | 订单应用最多等这次调用 800 毫秒 |
| `retries = 0` | 超时或失败后，框架不自动再调用一次 |

`check=false`、`lazy=true` 用来放宽启动阶段的检查和连接时机，不能让一个不可用的下游突然能调用。后面我们用实际请求验证连接。

`RemoteGateway` 这个类名也容易误导：**它是我们写在订单应用里的一个普通 Java 类，负责集中调用库存和支付。** 第七节还会出现 Spring Cloud Gateway，那才是单独部署的 HTTP 网关。

### 3.4 需要加什么依赖

订单、库存、支付三个应用都需要 Dubbo，分别在各自 `pom.xml` 的 `<dependencies>` 中加入以下依赖。根 pom 只统一版本，不把所有组件强行带给每个应用：

~~~xml
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-spring-boot-starter</artifactId>
    <version>3.3.0</version>
</dependency>
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-registry-nacos</artifactId>
    <version>3.3.0</version>
</dependency>
~~~

第一个把 Dubbo 接进 Spring Boot，第二个让 Dubbo 使用 Nacos 登记和查找服务。

三个微服务的启动类都加了 `@EnableDubbo`。以库存的 `InventoryApplication.java` 为例，省略数据库 Bean 和实验辅助配置后，关键结构是：

~~~java
@EnableDubbo
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class InventoryApplication {
    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
~~~

它让 Dubbo 扫描当前应用包中的提供者和引用。库存启动类位于 `.inventory` 包，订单位于 `.orders` 包，支付位于 `.payment` 包；各自只创建自己应用中的业务对象。单体的启动类没有 `@EnableDubbo`，也没有 Dubbo 依赖。

这里排除 `DataSourceAutoConfiguration`，是因为 Demo 自己创建连接池和事务管理器，并从密码文件读取凭证；这不是使用 Dubbo 必须加的配置。完整启动类里的数据库 Bean 要保留。

完整 Demo 还同时接入了 Nacos 配置读取。启动时会用到，因此这里把这两个依赖也指出来：

~~~xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
~~~

`config` 负责读取远端配置；`discovery` 在本例中主要服务于后面的 HTTP 网关发现。**Dubbo 的远程接口查找使用前面的 `dubbo-registry-nacos`。** 两条发现路径最终都用 Nacos，但查找的入口不同。

这两个 Alibaba 依赖的版本来自根 pom 的版本管理表，完整写法放在文末，已有 Demo 不需要重复粘贴。

### 3.5 配置里的地址到底指向哪里

先看 `inventory-service/src/main/resources/application.yml` 的 Dubbo 部分（节选）。订单和支付各自的配置文件也声明了注册中心：

~~~yaml
dubbo:
  registry:
    address: nacos://${NACOS_ADDR:127.0.0.1:8848}
    group: ARCH_DEMO
    register-mode: instance
  protocol:
    name: dubbo
    port: ${DUBBO_PORT:20880}
    serialization: fastjson2
    threads: 8
  consumer:
    check: false
    timeout: 800
    retries: 0
~~~

先看最关键的一行：

~~~yaml
address: nacos://${NACOS_ADDR:127.0.0.1:8848}
~~~

`${变量名:默认值}` 是 Spring 配置占位符。这里表示：有 `NACOS_ADDR` 环境变量就用它，没有就用 `127.0.0.1:8848`。Compose 会传入 `NACOS_ADDR=nacos:8848`，因此容器中的最终地址是 `nacos://nacos:8848`。

- 前面的 `nacos://` 表示使用 Nacos 作为注册中心。
- 后面的 `nacos` 是 Compose 中 Nacos 容器的服务名。
- `8848` 是 Nacos 容器内部的端口。

`protocol.port: 20880` 则是业务提供者接收 Dubbo 请求的端口，和 Nacos 端口不同。`fastjson2` 负责把参数、结果编码后传输；`threads: 8` 设置处理 RPC 的工作线程数。这些先保留 Demo 默认值即可。

`register-mode: instance` 使用 Dubbo 的应用级注册方式。注册中心分组 `ARCH_DEMO` 与注解里的业务接口分组 `architecture-demo` 属于不同配置项；复现时保持 Demo 两边的现有值一致，不要只改其中一边。

### 3.6 按顺序启动

先启动 Nacos：

~~~bash
docker compose up -d --wait nacos
python3 scripts/init-config.py
~~~

`init-config.py` 向 Nacos 写入本例需要的配置文件。我们在第六节手动查看、修改它们；现在先让最终版 Demo 具备启动所需配置。

接着启动库存、支付、订单：

~~~bash
mvn -B -ntp -pl order-service,inventory-service,payment-service -am package
docker compose up -d --build --wait inventory payment orders
~~~

这次 Maven 构建了三个不同的应用 jar。Compose 中每个服务的 `build` 指向自己的模块目录，以库存为例（节选）：

~~~yaml
inventory:
  image: architecture-demo-inventory:local
  build: ./inventory-service
~~~

`inventory-service/Dockerfile` 复制并运行的也是库存自己的 jar：

~~~dockerfile
COPY target/inventory-service-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
~~~

这里的 `app.jar` 只是镜像内部的统一文件名。订单、库存、支付是不同镜像，复制进去的文件不同，最终分别启动 `OrdersApplication`、`InventoryApplication`、`PaymentApplication`。

库存的 `application.yml` 固定 `spring.application.name: inventory`，`InventoryDatabase` 固定连接 `amdemo_inventory`；订单和支付也在自己的模块中声明应用名、数据库名。环境变量只用来调整连接地址和端口，不负责选择“这次扮演哪个服务”。

如果不用 Docker，在已经配置好可访问的 MySQL、Nacos、密码文件后，也可以直接执行：

~~~bash
java -jar inventory-service/target/inventory-service-1.0.0.jar
~~~

它就只会启动库存应用。配置数据源用 `ARCH_DB_HOST`、`ARCH_DB_PORT`、`ARCH_DB_USER`、`ARCH_DB_PASSWORD_FILE`；配置 Nacos 用 `NACOS_ADDR`。本篇继续使用 Docker，让这些连接都由 Compose 配好。若在同一宿主机直接运行多个 jar，还需要给各个 Dubbo 提供者设置不同的 `DUBBO_PORT`，例如库存 20881、支付 20882；容器内则各自有独立网络地址。

Compose 的端口映射可以这样理解：

~~~text
电脑上的 18183 → orders 容器的 8080 → 订单 Controller
电脑上的 18184 → inventory 容器的 8080 → 库存调试接口
电脑上的 18185 → payment 容器的 8080 → 支付调试接口

订单到库存的业务调用：
orders 容器 → inventory 容器的 20880 → Dubbo 提供者
~~~

三个容器都有自己的网络地址，内部都使用 8080 也不会抢同一个端口。容器里写 `localhost` 指向它自己，所以订单找 Nacos 要写 `nacos:8848`。

### 3.7 看到这份响应，才算第一次远程调用成功

执行：

~~~bash
curl -i http://127.0.0.1:18183/rpc-health
~~~

应返回 200，JSON 中包含：

~~~json
{"inventory":"inventory","payment":"payment","transport":"dubbo"}
~~~

`/rpc-health` 是我们自己写在订单模块 `OrderController` 里的 HTTP 接口。它调用 `RemoteGateway.probe()`，而 probe 的关键代码是：

~~~java
return Map.of(
    "inventory", inventory.ping(),
    "payment", payment.ping(),
    "transport", "dubbo"
);
~~~

因此这个响应已经证明：curl 访问了订单 Controller，订单通过 Dubbo 分别调用了库存和支付进程，再把两个结果汇总返回。

如果刚启动时返回 503，先过几秒再试；HTTP 已起来时，服务登记和 RPC 连接还可能在准备中。持续失败再看：

~~~bash
docker compose logs --tail=80 orders inventory payment
~~~

优先检查三个应用是否启动、Nacos 地址是否正确、双方接口的 group/version 是否一致。到这里还没有网关，curl 直接访问订单服务。

## 四、把真正的下单和支付接到远程调用上

### 4.1 库存 SQL 留在库存应用里

原来的单体调用是：

~~~java
inventory.apply("reserve", requestId, sku, quantity);
~~~

这里的 inventory 是本进程里的 `InventoryModule` 对象。

拆分后，订单先经过 `RemoteGateway`，通过 `InventoryRpc` 发出调用。库存应用里的 `InventoryProvider.apply(...)` 收到请求，再调用自己进程内的业务模块：

~~~java
inventory.apply(operation, requestId, sku, quantity);
~~~

这句位于 `InventoryProvider.java`，此处的 inventory 又是**库存应用内部的本地业务对象**。

所以完整的路径是：

~~~text
订单应用的 Orders
  → RemoteGateway
    → InventoryRpc 代理
      → 网络
        → 库存应用的 InventoryProvider
          → InventoryModule
            → 库存数据库
~~~

SQL 并没有搬到订单应用里。我们给原来的库存业务增加了一个远程调用入口。

支付应用同理：订单通过 `PaymentRpc.charge(...)` 调到 `PaymentProvider`，再由它调用 `PaymentModule` 写支付记录。

### 4.2 为什么这个 Demo 下单要分两步

继续动手前，有一个 Demo 自己的设计要交代清楚：

**微服务并不要求下单一定异步。这个 Demo 为了演示失败后恢复，先保存订单和一条“待办”，再执行远程库存操作。**

这里的“待办”就是一行数据库记录，大意是：

~~~text
订单 cloud-1：待确认
待办：为 cloud-1 预占两件 SKU-A，尚未完成
~~~

示例提供 `POST /drain`，每调用一次就处理一条待办。你可以暂时把它理解成“执行下一步”按钮。

`/drain` 是本项目的教学接口，名字也由我们自己取，**它不是 Dubbo、Nacos 或 Spring Cloud 的内置 API**。Demo 没有后台自动处理线程，所以只下单、不调用它，订单会一直等待。

### 4.3 先直接访问订单服务

先让三个微服务的数据恢复初始状态：

~~~bash
curl -sS -X POST http://127.0.0.1:18183/reset
curl -sS -X POST http://127.0.0.1:18184/reset
curl -sS -X POST http://127.0.0.1:18185/reset
~~~

下一单：

~~~bash
curl -i http://127.0.0.1:18183/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-1","userId":7,"sku":"SKU-A","quantity":2}'
~~~

这次响应是 **202**，状态 **PENDING**。

202 表示请求已受理，PENDING 表示还在等后面的步骤，不能把它理解为库存已经扣好。此时查看库存，它仍是 100 / 0 / 0：

~~~bash
curl -sS http://127.0.0.1:18184/snapshot
~~~

现在执行待办：

~~~bash
curl -sS -X POST http://127.0.0.1:18183/drain
~~~

应返回 `processed: 1`、`status: RESERVED`。这一次 drain 才真正经 Dubbo 调用库存。再看库存，变成 98 / 2 / 0。

### 4.4 支付与取消也走一遍

提交付款请求，再处理待办：

~~~bash
curl -sS http://127.0.0.1:18183/pay \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-1"}'

curl -sS -X POST http://127.0.0.1:18183/drain
~~~

付款请求先把订单设为 `PAY_PENDING`，意思是“付款流程处理中”。处理完成后变成 `PAID`。

分开查看三个应用的数据：

~~~bash
curl -sS http://127.0.0.1:18183/orders/cloud-1
curl -sS http://127.0.0.1:18184/snapshot
curl -sS http://127.0.0.1:18185/snapshot
~~~

这一笔完成后：

| 在哪里查看 | 应该看到什么 |
| --- | --- |
| 订单服务 | cloud-1 状态 PAID |
| 库存服务 | available=98、locked=0、sold=2 |
| 支付服务 | 一条 cloud-1 的记录，amount_fen=2000 |

想验证取消，就另下一单：

~~~bash
curl -sS http://127.0.0.1:18183/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-cancel","userId":7,"sku":"SKU-A","quantity":2}'
curl -sS -X POST http://127.0.0.1:18183/drain

curl -sS http://127.0.0.1:18183/cancel \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-cancel"}'
curl -sS -X POST http://127.0.0.1:18183/drain
~~~

新订单最终为 `CANCELLED`，库存回到 98 / 0 / 2。已付款的 cloud-1 保留原状。

**到这里，订单、库存、支付已经在三个应用中协作完成业务。** 后面加入的组件是在改善使用和运行方式。

## 五、先验证拆开究竟解决了什么

### 5.1 修改库存，只构建和替换库存应用

假设刚修改了 `inventory-service` 中的库存规则，在根目录执行：

~~~bash
mvn -B -ntp -pl inventory-service -am package
docker compose up -d --no-deps --build --force-recreate --wait inventory
curl -sS http://127.0.0.1:18183/rpc-health
~~~

第一条命令只构建库存及它需要的公共模块。Maven 最后的模块列表里会出现根工程、demo-contracts、demo-support、inventory-service，不会出现订单和支付应用。

第二条命令把新的库存 jar 放进库存镜像，再替换库存容器。`--no-deps` 表示这次不连带启动依赖容器，前提是 MySQL、Nacos 已经运行；`--force-recreate` 保证即使没有改代码，也能在实验中看到容器被替换。订单、支付容器保持原样。最后一条命令用于确认订单已经重新连上库存。

**Maven 打包与 Docker 构建是两步。** 这里的 Dockerfile 只复制现成 jar，不在镜像中编译源码。只执行 `docker compose ... --build` 而忘记先执行 Maven，可能部署的还是旧 jar；只修改源码、不重新打包也不会生效。

可以在部署前后分别执行 `docker compose ps -q orders payment inventory` 对比容器 ID。本轮实测库存 ID 改变，订单、支付 ID 保持不变，库存数据保留，Dubbo 调用恢复。修改一个服务不再要求同时替换所有业务应用。

同一个父工程统一了版本管理，并不表示每次都必须一起发布。不过，如果改的是共享接口且不兼容旧版本，就仍然需要安排调用方与提供方的升级顺序；独立 jar 不会自动解决接口兼容性问题。

### 5.2 库存停机，订单查询是否还能使用

我们最初希望：库存可以单独停机，历史订单查询仍能工作。现在直接验证。

~~~bash
docker compose stop inventory
curl -sS http://127.0.0.1:18183/orders/cloud-1
~~~

订单服务仍能返回 cloud-1 的 PAID 状态，因为这个查询只读订单库，不调用库存接口。

此时下一笔订单：

~~~bash
curl -sS http://127.0.0.1:18183/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-offline","userId":7,"sku":"SKU-A","quantity":2}'
curl -sS -X POST http://127.0.0.1:18183/drain
~~~

订单能保存为 PENDING，但预占暂时无法完成。drain 的结果会保留待办，并增加尝试次数。

这次只执行一次 drain，后面再讲为什么不能无限重试。

恢复库存：

~~~bash
docker compose up -d --no-deps --wait inventory
curl -sS http://127.0.0.1:18183/rpc-health
~~~

等 `/rpc-health` 返回两个提供者的正常结果，再执行：

~~~bash
curl -sS -X POST http://127.0.0.1:18183/drain
curl -sS http://127.0.0.1:18183/orders/cloud-offline
~~~

cloud-offline 应转为 RESERVED。订单应用没有陪着库存一起重启。

这个收益成立有两个原因：应用分成了不同进程；历史查询也确实没有依赖库存。如果查询订单时又同步去查库存，这条依赖仍会让库存故障影响查询。

拆分还让库存具备单独部署、单独增加实例的条件。但本例只有一个库存提供者，没有做多实例性能压测，也不声称拆完就会更快。

## 六、Nacos 的第二份工作：集中放配置

前面用 Nacos 帮忙找到服务地址。现在看它的另一项功能：保存应用配置。

如果你以前把业务开关写在 `application.yml`，每次修改后重新发布应用，这里可以把需要集中管理的配置放到 Nacos。本例先改一个简单字符串，观察整个过程。

### 6.1 打开控制台，找到那一份配置

打开 `http://127.0.0.1:18848/nacos/`，进入配置管理里的配置列表。

选 public 命名空间，找到：

~~~text
Data ID：orders.yaml
Group：ARCH_DEMO
~~~

先这样理解这三个名称：

| 名称 | 在这里表示什么 |
| --- | --- |
| Namespace | 配置属于哪个隔离空间；本例用默认 public |
| Group | 这个空间下用什么分组；本例固定 ARCH_DEMO |
| Data ID | 这一份配置的名字；本例叫 orders.yaml |

它们用来准确定位配置。`orders.yaml` 是 Nacos 中一份配置的名字，不是在本地资源目录里另外生成的文件。

它由刚才的 `scripts/init-config.py` 创建，内容是：

~~~yaml
demo:
  message: nacos-orders-v1
~~~

改成下面这样并发布：

~~~yaml
demo:
  message: hello-from-nacos
~~~

稍等片刻，执行：

~~~bash
curl -sS http://127.0.0.1:18183/config
~~~

应看到：

~~~json
{"message":"hello-from-nacos"}
~~~

这次没有重启订单服务。

### 6.2 应用怎么知道该读哪份配置

读取入口在订单模块的 `order-service/src/main/resources/application.yml`：

~~~yaml
spring:
  config:
    import:
      - "nacos:orders.yaml?group=ARCH_DEMO&refreshEnabled=true"
  cloud:
    nacos:
      config:
        server-addr: ${NACOS_ADDR:127.0.0.1:8848}
        group: ARCH_DEMO
        file-extension: yaml
~~~

这里明确导入 Nacos 中的 `orders.yaml`。库存、支付在自己的 application.yml 中分别导入 `inventory.yaml`、`payment.yaml`。`refreshEnabled=true` 开启这份配置的更新监听。

Nacos 的连接地址留在本地配置或环境变量中。应用要先知道地址，才能读取远端配置；如果把地址也只放到远端，它就不知道从哪里开始连接了。

Demo 的 `/config` 每次请求都从 Spring `Environment` 读取 `demo.message`，所以能看到更新。自己写了一个启动时赋值的普通字段，不会自动得到相同效果。这里也没有实现 Dubbo 注解中 timeout 参数的热更新。

如果控制台改了配置但接口不变，先检查 Namespace、Group、Data ID 是否完全匹配，再检查当前运行的应用 jar 是否包含正确的 `spring.config.import`、Nacos 地址是否可达。

## 七、加一个网关，让前端只记一个入口

现在前端直接访问订单服务的 18183。实际项目可能还有商品、用户等 HTTP 服务，前端不方便记住每个服务地址。

**Spring Cloud Gateway** 是一个单独运行的应用：先接收前端 HTTP 请求，根据路径把请求转发给相应后端。

本例增加后，调用变成：

~~~text
curl → Gateway 的 18180 → orders 的 HTTP 接口 → Dubbo → 库存或支付
~~~

Gateway 处理 HTTP 入口；Dubbo 处理订单应用到库存、支付应用的远程方法调用。

### 7.1 网关模块引入哪些依赖

代码在 `gateway-service/`，它也是独立应用模块。这版 Gateway 使用 WebFlux，和订单应用中的 Spring MVC 属于不同 Web 技术组合。网关只引入自己需要的依赖，也不连接订单数据库。

`gateway-service/pom.xml` 的关键依赖是：

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
~~~

Gateway 负责转发，Nacos Discovery 帮它找到后端 HTTP 实例，LoadBalancer 负责从找到的实例中选择一个。LoadBalancer 就是“负载均衡器”的英文名，即使 Demo 只有一个订单实例，这条 `lb://` 路由仍然需要它。

### 7.2 一条路由配置，逐项看

位置：`gateway-service/src/main/resources/application.yml`，相关配置如下：

~~~yaml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_ADDR:127.0.0.1:8848}
        group: ARCH_DEMO
    gateway:
      routes:
        - id: orders
          uri: lb://orders
          predicates:
            - Path=/api/orders,/api/orders/**,/api/pay,/api/cancel
          filters:
            - StripPrefix=1
~~~

用一个具体请求理解：

~~~text
用户请求 /api/orders/cloud-1
    ↓ Path 匹配这条路由
StripPrefix=1 去掉第一个路径片段 /api
    ↓
通过 lb://orders 找到 orders 的 HTTP 地址
    ↓
转发给订单服务 /orders/cloud-1
~~~

`id` 是这条路由的名字；`predicates` 写匹配条件；`filters` 对匹配的请求做处理。这里没改请求中的订单编号，只去掉了 `/api` 前缀。

业务微服务各自的 `src/main/resources/application.yml` 中也启用了 Nacos Discovery，并登记到 ARCH_DEMO 分组，网关才能找到它的 HTTP 地址。Dubbo 接口的登记不能替代这份 HTTP 实例登记。

### 7.3 启动并访问

~~~bash
mvn -B -ntp -pl gateway-service -am package
docker compose up -d --build --wait gateway

curl -sS http://127.0.0.1:18180/api/orders/cloud-1
~~~

应看到与直接请求 18183 相同的 PAID 订单。从此下单用 `/api/orders`，付款用 `/api/pay`，取消用 `/api/cancel`。

Demo 没把 `/drain`、`/reset` 等调试入口开放到网关，所以处理待办时仍然请求订单服务的 18183。

如果这里失败，而直接访问 18183 正常，问题优先在网关这段：检查路径前缀、Nacos 的 HTTP 服务列表里有没有 orders，以及分组是否一致。

## 八、请求太多怎么办：用 Sentinel 拦下一次预占

假设库存处理能力有限，我们希望繁忙时先拒绝一部分新预占请求，保护正在处理的业务。

这种“限制单位时间允许进入多少请求”的做法叫**限流**。本例使用 Sentinel，在库存操作入口判断请求是否允许继续执行。

Sentinel 的判断代码运行在库存应用里，不需要让每个请求先去某个独立服务器审批。

### 8.1 先给要保护的操作取个名字

`InventoryProvider.java` 中，库存操作被包在这里：

~~~java
try (Entry entry = SphU.entry("inventory." + operation)) {
    String mode = faults.take();
    inventory.apply(operation, requestId, sku, quantity);
    faults.after(mode);
    return "OK";
} catch (BusinessConflict conflict) {
    return "CONFLICT:" + conflict.getMessage();
} catch (BlockException blocked) {
    return "RETRY:sentinel";
}
~~~

先忽略用于故障实验的 faults，两行关键代码是：

~~~text
SphU.entry(...)：检查这个操作能否进入
inventory.apply(...)：允许进入才实际处理库存
~~~

当 operation 是 reserve，名字就是 `inventory.reserve`。Sentinel 把这样的受保护操作叫作**资源**。这个名字是我们在代码中取的，需要和限流规则里的名字一致。

如果限流规则拦截了请求，就进入 `BlockException` 分支，返回 `RETRY:sentinel`，表示稍后可以再试。它与“库存不足”是两种不同结果。

### 8.2 规则从哪里来

只在 `inventory-service/pom.xml` 增加以下依赖，订单和支付应用不需要为了库存限流引入它们：

~~~xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
~~~

前者接入 Sentinel，后者让它读取 Nacos 中的规则。

`inventory-service/src/main/resources/application.yml` 的对应部分是：

~~~yaml
spring:
  cloud:
    sentinel:
      eager: true
      datasource:
        inventory-flow:
          nacos:
            server-addr: ${NACOS_ADDR:127.0.0.1:8848}
            group-id: ARCH_DEMO
            data-id: inventory-flow.json
            data-type: json
            rule-type: flow
~~~

含义是：去 Nacos 的 ARCH_DEMO 分组读取 `inventory-flow.json`，把 JSON 解析成流量控制规则。`inventory-flow` 是这份规则数据源的名字。

### 8.3 把阈值改成零，最容易看到效果

在 Nacos 配置列表中打开 `inventory-flow.json`，把内容改为：

~~~json
[{"resource":"inventory.reserve","grade":1,"count":0}]
~~~

`grade=1` 表示按每秒请求数控制；`count=0` 表示当前先不允许任何新预占进入。这个限制针对当前实例，不是所有实例共享的总额度。

等库存接口 `/metrics` 的 `sentinelRules` 中显示 count 为 0，再下单：

~~~bash
curl -sS http://127.0.0.1:18184/metrics

curl -sS http://127.0.0.1:18180/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-limit","userId":7,"sku":"SKU-A","quantity":2}'
curl -sS -X POST http://127.0.0.1:18183/drain
~~~

预期是：订单仍然 PENDING，库存相比这次请求前没有变化，待办还保留着。

把 Nacos 中的 count 改回 100，等待 `/metrics` 显示规则更新，再执行一次 drain。这次应该完成预占，订单转为 RESERVED。

限流解决了“现在先别让这么多请求进来”。Sentinel 也支持熔断，即下游持续异常时暂时停止调用；本例没有配置这部分规则，也没有部署独立 Dashboard 控制台。刚才的操作是在 Nacos 配置控制台完成的。

## 九、真正容易踩的坑：远程调用和本地方法不一样

正常流程已经跑通，下面再看为什么工程里多了待办表、请求编号和中间状态。

### 9.1 调用超时，不等于库存没扣

先确保上一节的限流规则已恢复为 count=100，并且 `/rpc-health` 正常。

创建一笔新订单：

~~~bash
curl -sS http://127.0.0.1:18183/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-timeout","userId":7,"sku":"SKU-A","quantity":2}'

curl -sS http://127.0.0.1:18184/fault \
  -H 'Content-Type: application/json' \
  -d '{"mode":"after"}'

curl -sS -X POST http://127.0.0.1:18183/drain
~~~

`/fault` 是 Demo 自己的故障开关，`after` 表示：下一次库存操作**先提交事务，再延迟 1.5 秒返回**。

订单的 Dubbo 超时时间是 800 毫秒，所以发生的事情是：

~~~text
库存应用：扣好两件，事务提交
订单应用：等了 800ms，没有收到结果，报超时
库存应用：1.5 秒后才准备返回成功
~~~

此时 drain 返回 `eventStatus=PENDING`、`attempts=1`。查库存，会发现可用已经少了两件，待付款多了两件；查订单，它仍是 PENDING。

你现在知道库存扣了，因为有调试接口可以直接看数据库。真实调用方只拿到一个超时异常，不能仅凭这个异常判断对方有没有执行成功。

### 9.2 所以相同请求必须能够安全重发

订单还需要把流程接着做完，难免要重试。

如果库存每收到一次请求就扣一次，重发 `cloud-timeout` 会再扣两件。我们需要识别：“这一笔已经处理过了。”

这就是**幂等**在当前业务中的含义：同一请求重复执行多次，最终只预占一次库存。

做法落在 `InventoryModule.java`。库存库有一张 `reservation` 表，按请求号保存预占记录：

~~~sql
create table if not exists reservation (
    request_id varchar(80) primary key,
    sku varchar(40) not null,
    quantity int not null,
    state varchar(12) not null
) engine=InnoDB
~~~

`request_id` 是主键，因此同一个请求只能有一行记录。它要和库存扣减一起在事务中处理。

实际代码先创建或找到请求记录，再锁住它：

~~~java
database.jdbc.update("""
        insert into reservation values (?, ?, ?, 'NEW')
        on duplicate key update request_id=request_id
        """, requestId, sku, quantity);
Map<String, Object> row = database.jdbc.queryForMap(
        "select * from reservation where request_id=? for update", requestId);
~~~

`for update` 是数据库行锁，同一个请求的并发处理需要排队进入。读到记录后还会检查 SKU 和数量，避免有人拿同一请求号改成另一笔业务。

预占分支看到记录已经是 HELD 或 CONFIRMED，就直接返回，不再扣：

~~~java
if (state.equals("HELD") || state.equals("CONFIRMED")) return row;
~~~

HELD 表示已经预占，CONFIRMED 表示预占已经在付款后转成已售。

现在重启库存，再重放刚才那一笔：

~~~bash
docker compose restart inventory
curl -sS http://127.0.0.1:18183/rpc-health
~~~

等 RPC 恢复正常：

~~~bash
curl -sS -X POST http://127.0.0.1:18183/drain
curl -sS http://127.0.0.1:18183/orders/cloud-timeout
curl -sS http://127.0.0.1:18184/snapshot
~~~

订单应变成 RESERVED，库存相比第一次超时后不再变化。记录保存在 MySQL 中，重启不会忘记已经处理过的请求。

### 9.3 那张“待办表”到底解决了什么

库存能识别重复请求了，可如果订单应用自己重启，它怎么记住还要继续处理哪笔单？

这就是前面一直在用的待办。代码把表取名为 **outbox**，也常被称为“本地消息表”。它仍是 MySQL 里的普通表，本例没有引入消息队列。

订单服务在**自己的同一个本地事务**里做两件事：

~~~text
1. 保存订单，状态设为 PENDING
2. 保存一条为这笔订单预占库存的待办
~~~

这样订单和待办一起提交、一起回滚，不会保存了订单却忘记后面要干什么。对应 `Orders.java` 的节选是：

~~~java
private void enqueue(String requestId, String kind, String state) {
    status(requestId, state);
    database.jdbc.update(
        "insert into outbox(request_id,kind,status) values (?,?,'PENDING')",
        requestId, kind
    );
}
~~~

处理待办时，成功就把订单推进到下一状态，把待办标为 DONE；未知结果就留下来，以相同 requestId 再处理。

![库存已提交、订单超时后的恢复过程](/assets/images/architecture-demo/timeout-recovery.svg)

**两边各做一件事：订单记住“还有事没做完”，库存记住“这件事我已经做过”。** 两份记录配合，才能在重启后继续处理且不重复扣库存。

本例的 `/drain` 用手动请求触发。实际系统通常由后台任务持续处理这张表，还要管理重试间隔、积压、告警等。本文先保留手动步骤，让每次状态变化看得见。

### 9.4 支付成功了，后面失败怎么办

单体中，模拟支付记账、库存确认、订单状态更新在同一个数据库事务里。拆分后它们分别由不同应用提交。

订单服务里的一个本地事务，无法回滚另一个进程已经提交的支付记录。即使给订单方法加上 `@Transactional`，这个事实也不会改变。

本例处理支付待办时，顺序是：

~~~text
请求支付服务记账
    ↓
请求库存服务把预占转成已售
    ↓
把订单设为 PAID
~~~

如果第一步成功，第二步失败，订单应保留 `PAY_PENDING`，而不是提前告诉用户整笔付款流程完成。

新建一笔订单并完成预占，然后在付款处理之前打开库存故障开关：

~~~bash
curl -sS http://127.0.0.1:18183/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"cloud-pay-fault","userId":7,"sku":"SKU-A","quantity":2}'
curl -sS -X POST http://127.0.0.1:18183/drain

curl -sS http://127.0.0.1:18183/pay \
  -H 'Content-Type: application/json' -d '{"requestId":"cloud-pay-fault"}'
curl -sS http://127.0.0.1:18184/fault \
  -H 'Content-Type: application/json' -d '{"mode":"before"}'
curl -sS -X POST http://127.0.0.1:18183/drain

curl -sS http://127.0.0.1:18183/orders/cloud-pay-fault
curl -sS http://127.0.0.1:18185/snapshot
~~~

`before` 会让下一次库存操作在提交前失败。此时支付表已有 cloud-pay-fault 的一条记账记录，订单仍为 PAY_PENDING。

再次 drain 会重新执行支付和库存确认两步。支付也按相同 requestId 识别重复记账，所以最终应当只有一条支付记录，订单为 PAID。

~~~bash
curl -sS -X POST http://127.0.0.1:18183/drain
curl -sS http://127.0.0.1:18183/orders/cloud-pay-fault
curl -sS http://127.0.0.1:18185/snapshot
~~~

注意检查的是 cloud-pay-fault 这个请求号只有一条记录，前面 cloud-1 的支付记录仍然保留。

这叫“失败后继续完成流程”。涉及真实第三方支付时，还需要渠道查询、退款和对账；本文的数据库记账不能代替完整支付系统。

### 9.5 不要把所有失败都无限重试

本例分开处理两类结果：

| 结果 | 订单如何处理 |
| --- | --- |
| 库存明确不足 | 结束这次预占，订单设为 REJECTED |
| 网络超时、服务暂不可用、限流 | 保留中间状态，允许稍后再次处理 |

连续尝试五次仍未完成，待办会变为 FAILED，需要检查实际业务数据后再决定如何处理。订单不会因为“重试次数用完了”就自动变成成功。

你在终端点五次 drain，就可能用完五次尝试。出现 FAILED 后，继续点 drain 不会自动恢复它；Demo 没有实现失败待办的人工重放界面。学习实验可以在记录结果后重置教学数据重来。

## 十、回到代码时，按这个顺序看

第一遍读完，建议带着已经跑出的结果，再走一遍下面的路径：

~~~text
order-service 中的 OrderController.place
    ↓ 这次 HTTP 请求进入哪里
order-service 中的 Orders.place
    ↓ 对照 monolith-service 中同名类：直接预占与保存待办的区别
order-service 中的 Orders.drain
    ↓ 后续步骤何时执行
RemoteGateway.send
    ↓ 本地代码怎样调用远程接口
InventoryProvider.apply
    ↓ 请求到了库存进程，谁接住它
InventoryModule.apply
    ↓ SQL 在哪里执行，重复请求如何识别
~~~

现在你已经能把每个组件对应到一次具体操作：

| 遇到的需求 | 本例用什么解决 | 如何确认生效 |
| --- | --- | --- |
| 在另一个应用里执行库存方法 | Dubbo | `/rpc-health`，以及实际库存变化 |
| 找到远程应用地址 | Nacos 注册发现 | 服务登记后，调用方通过名称找到它 |
| 修改一份集中保存的配置 | Nacos 配置中心 | `/config` 在不重启时变化 |
| 前端只访问一个 HTTP 入口 | Spring Cloud Gateway | 18180 能查询原来 18183 的订单 |
| 忙时拦住新库存请求 | Sentinel | count=0 时库存不变，恢复规则后完成 |
| 超时或重启后继续处理 | outbox 与请求幂等 | 重放完成订单，库存和支付不重复 |

你可能还在其他教程里看到 Seata 和 RocketMQ。Seata 协调分布式事务，RocketMQ 提供消息投递；这个 Demo 没有部署它们。等能解释清楚上述流程，再比较是否需要引入，会更容易判断它们到底解决哪一步的问题。

## 附：完整启动、版本和验证

### 一次启动所有应用

前文刻意分阶段启动，便于观察。以后需要完整环境，可以直接执行：

~~~bash
mvn -B -ntp package
bash scripts/up.sh
~~~

`up.sh` 会准备密码文件、启动 MySQL 和 Nacos、发布默认教学配置，再启动所有应用。再次运行会恢复 ARCH_DEMO 分组中的默认教学配置。

根目录一次 `mvn package` 会构建所有模块，包括网关。最终有七个容器：

| 容器 | 宿主机端口 | 用途 |
| --- | --- | --- |
| mysql | 不对宿主机映射 | Demo 专用 MySQL |
| monolith | 18182 | 正文先运行的完整单体 |
| orders | 18183 | 订单服务 |
| inventory | 18184 | 库存服务调试入口 |
| payment | 18185 | 支付服务调试入口 |
| gateway | 18180 | 业务 HTTP 统一入口 |
| nacos | 18848、19848 | 控制台及 Nacos 客户端通信 |

Nacos 容器内部使用 8848 和 9848。映射到宿主机时配套改成 18848、19848，避免只映射控制台而漏掉客户端通信端口。

所有映射都绑定宿主机的 `127.0.0.1`。Nacos 采用无鉴权的教学配置，管理接口也没有业务认证，复现时保留本机访问范围。

### 依赖为什么有些不写 version

根 pom 先用 Spring Boot 3.2.9 作为 parent，然后在 `<dependencyManagement>` 中导入两张依赖版本表：

~~~xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2023.0.3.2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
~~~

这样的版本表叫 BOM。它帮我们统一版本，具体用什么组件仍需要在 `<dependencies>` 中声明。

本例的组合是 Boot 3.2.9、Cloud 2023.0.3、Alibaba 2023.0.3.2、Dubbo 3.3.0、Nacos 2.4.2、Sentinel 1.8.8、MySQL 8.0.41。Dubbo 版本显式填写，因为上述 Alibaba BOM 不管理它。

这是经过本例验证的固定组合，不代表各组件最新发行版。升级时需要一起检查兼容关系。

### 自动验证覆盖什么

在运行 Docker 的机器上，从 Demo 根目录执行：

~~~bash
python3 scripts/verify-packaging.py
python3 scripts/verify.py
python3 scripts/verify-cloud.py
python3 scripts/verify-deployment.py
~~~

`verify-packaging.py` 检查五份应用 jar 的启动类和实际内容，确认没有混入其他服务的业务实现，并检查公共库是普通 jar、单体没有 Cloud 依赖。

`verify.py` 和 `verify-cloud.py` 会修改、重置本项目的教学数据和部分配置，并停止或重启业务容器，不要并行执行。它们会测试单体回滚、重复请求、库存竞争、Dubbo 超时与恢复、支付、取消、Nacos 配置更新、网关和 Sentinel 限流。

`verify-deployment.py` 验证只替换库存容器后订单、支付容器 ID 不变，再暂时停止 Nacos，重新创建单体容器并完成一笔下单和支付，最后恢复 Nacos。它会重置单体教学数据，需要在已有完整环境中单独执行。

业务实验结果保存在 `target/experiments/results.json` 与 `cloud-results.json`，打包和部署检查分别保存在 `packaging-results.json`、`deployment-results.json`。其中库存并发实验是 20 笔各买 6 件，初始 100 件，16 笔成功、4 笔拒绝；完整业务流程对账没有发现差异。Maven 当前没有 JUnit 用例，打包成功不能替代这些运行验证。

Demo 共用同一个 MySQL 实例中的不同库与测试账号；同宿主机、数据库实例仍是共享故障点。待办处理也尚未实现生产级后台任务。这些限制不影响观察本篇的调用与恢复过程，但需要在实际落地时继续处理。

最后可以再做一次很小的自测：看到代码中的 `inventory.apply(...)`，能不能先判断这个 inventory 是本地业务对象，还是 Dubbo 代理？确认这一点，再追到方法在哪个进程、哪个数据库事务里执行，微服务这条链路就开始变得清楚了。
