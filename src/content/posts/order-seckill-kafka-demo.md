---
title: 给秒杀系统接上 Kafka：从第一条消息到可靠落单
published: 2025-03-23
updated: 2026-09-21
description: 从一条下单消息的去向讲起，逐个弄懂 Kafka 的生产者、broker、topic、分区和消费组，再用 Docker 与 Java 实际收发消息，处理重复消费和失败恢复。
category: 开发实践
tags:
  - Java
  - Kafka
  - Spring Boot
  - 秒杀
draft: false
---

> 2026 年 9 月 16 日更新：使用 Kafka 4.1.2 重做实验，补充 Docker 配置、Java 源码和故障恢复记录。

> 2026 年 9 月 21 日更新：展开基础概念与配置说明，Demo 源码已发布到 [GitHub](https://github.com/Jayczee/order-seckill-kafka-demo)。

[上一篇秒杀实验](/posts/order-seckill-demo/)把请求拆成了“先受理，再落单”。这次换成独立的消息中间件 Kafka，完整走一遍发送、消费、重启和失败恢复。

即使没有看过上一篇，也可以从这里开始。只需要知道：用户点一次下单，Java 程序要创建一笔订单，最终保存到 MySQL。

这篇分三段读：**第一到四节，弄懂消息在哪里、怎么读；第五到八节，把 Java 下单接上去；第九节以后，处理失败和部署问题。** 前半段先发一句普通文字，不涉及真实订单。

## 一、Kafka 到底插在什么位置

### 1.1 先看没有 Kafka 时，一次请求怎么结束

假设你写了一个 `POST /orders` 接口。用户点击下单，Controller 调用 Service，Service 写数据库，成功后返回订单号：

~~~text
用户请求 → Java 执行下单 → MySQL 写入成功 → 返回结果
~~~

用户要等这条链路执行完才能拿到结果。这是普通的同步处理，步骤少、好理解。

如果同一时间请求很多，后面的处理跟不上，接口就会等待。现在想换一种交互：先告诉用户“申请已受理”，把下单任务保存起来，由后台继续处理，用户稍后查询结果。

这里就需要一个地方保存任务。**Kafka 是一个独立运行的服务，可以接收、保存消息，让其他程序稍后读取。** 用它传递后台任务，是消息队列的一种用法。我们说的 MQ 就是 Message Queue，消息队列。

接入后的简化流程是：

~~~text
入口程序 → 把下单任务发给 Kafka → 先返回受理结果
后台程序 → 从 Kafka 读任务 → 执行下单 → 保存正式订单
~~~

用户等待的内容也变了：前一种返回“订单已经创建”，后一种先返回“任务已经受理”。如果页面仍把“已受理”显示成“购买成功”，即使后台实现正确，用户也会被误导。

### 1.2 消息到底长什么样

消息可以是一句文字，也可以是一段 JSON。比如下面是下单任务的简化示意：

~~~json
{
  "requestId": "req-001",
  "activityId": "sale-001",
  "userId": "user-1"
}
~~~

它表达的是：“请求 req-001，希望为 user-1 创建 sale-001 活动的订单。”

**这段 JSON 只是数据，不会自己执行。** Kafka 保存它；读取它的 Java 程序负责解析字段，再调用下单方法、写 MySQL。Kafka 不需要懂“库存”“付款”是什么意思。

因此应用引入 Kafka 后，业务代码仍然要写，数据库仍然要用。改变的是任务怎样从入口传给后台。

### 1.3 生产者：谁把消息发出去

**生产者（producer）就是发送消息的程序。** 在订单项目中，是入口后的某段 Java 代码把任务交给 Kafka。

它不是一种额外的数据库，也不要求单独部署一台“生产者服务器”。同一个 Spring Boot 应用可以既提供 HTTP 接口，又包含发送消息的代码。

稍后第一轮实验用命令行发送文字，那条命令行程序也算生产者。生产者描述的是它在消息流程里的角色。

### 1.4 broker：消息实际保存在哪里

**broker 是运行 Kafka 服务的节点。** 本次用 Docker 启动 Kafka，这个容器里的 Kafka 服务就是一个 broker。

生产者通过网络把消息发给 broker，broker 按配置保存到磁盘。生产者退出后，消息不必跟着消失；只要数据仍被保留，后面的程序就能再读。

一套 Kafka 环境可以由多个节点共同工作，称为集群。本实验先只用一个节点；一个 broker 可以同时保存很多类消息，不是每个订单都创建一个 broker。

### 1.5 消费者：谁真正执行下单

**消费者（consumer）是从 Kafka 读取消息并处理的程序。** 它读到前面的 JSON，才执行“为 user-1 创建订单”。

消费者通常持续运行，主动向 Kafka 拉取消息。不是 Kafka 收到 JSON 后就自动调用你项目里的某个 HTTP 接口；必须编写并启动消费代码。

把三个角色放在一起：

~~~text
生产者：发送“请创建订单”的消息
    ↓ 网络传输
broker：Kafka 服务，保存消息
    ↓ 消费者来读取
消费者：解析消息，执行下单，写入 MySQL
~~~

生产者与消费者可以在同一个 Java 项目，也可以分别部署。本 Demo 为了方便运行，把它们放在同一个 jar 中；它们仍通过 Kafka 传消息，并没有直接互相调用下单方法。

**此时只要能回答一件事：订单是谁创建的？是消费者里的 Java 代码，Kafka 负责保存和传递任务。**

Kafka 的作用是把发送任务和执行任务拆开，让暂时没来得及处理的消息有地方保存。它不会让 MySQL 突然变快，更不会自动替业务保证“不超卖”。

## 二、先把 Kafka 服务启动起来

源码仓库：[Jayczee/order-seckill-kafka-demo](https://github.com/Jayczee/order-seckill-kafka-demo)，也可以[下载源码 ZIP](/downloads/order-seckill-kafka-demo.zip)。这是独立项目，沿用上一篇的订单、库存模型，不需要启动原来的 Demo。

使用 Git 获取源码：

~~~bash
git clone https://github.com/Jayczee/order-seckill-kafka-demo.git
cd order-seckill-kafka-demo
~~~

本机需要 Docker Compose v2；后面构建 Java 项目需要 JDK 17 或更高、Maven，辅助脚本使用 Python 3、OpenSSL。建议至少有 4 GiB 空闲内存。以下命令都在解压后的 `order-seckill-kafka-demo` 目录执行。

可以把目录放在 NAS 上，通过 SSH 进入目录运行 Docker 命令。先在本地构建 jar 再传过去也行，NAS 不必额外安装 Maven。

### 2.1 broker 收发消息，controller 管什么

如果只有一个节点，很容易觉得“不就是存消息吗”。换成多台节点，还需要协调这些事情：哪台节点加入了，消息应该由哪些节点保存，其中一台故障了，由谁接替它的职责。

**controller 是 Kafka 中负责集群管理的角色。** 这些管理信息叫**元数据**。可以先区分两类内容：

| 信息 | 例子 | 谁主要负责 |
| --- | --- | --- |
| 业务消息 | user-1 申请下单 | broker 保存，业务消费者处理 |
| 集群元数据 | 哪些节点可用、消息存储如何分配 | controller 管理 |

controller 不是订单消费者，不会执行扣库存。它处理的是 Kafka 自己怎样正常运转。

### 2.2 ZooKeeper：旧版 Kafka 依赖的外部协调服务

旧教程经常要求先装 ZooKeeper，再装 Kafka。**ZooKeeper 是独立的协调软件**，旧版 Kafka 借助它保存管理信息、跟踪节点状态，并协助选出负责管理的 controller。

于是维护 Kafka 的同时，还得维护一套 ZooKeeper。它们各自有进程、配置和故障处理。

要注意，**订单消息不因此存进 ZooKeeper**。旧方案下，订单消息也由 Kafka broker 保存。

### 2.3 KRaft：让 Kafka 自己维护管理信息

**KRaft 是 Kafka 内置的集群管理模式**。它通过基于 Raft 的机制，让 controller 节点共同维护一致的元数据，不再依赖 ZooKeeper。

先不用研究 Raft 算法细节，理解它解决的问题即可：多个管理节点需要对“当前的集群管理信息是什么”达成一致，不能各说各话。

在有三个 controller 的部署中，会选出一个负责人，管理信息的更新需要多数成员确认；负责人故障后，可以重新选举。这个共同参与管理的成员集合称为 **controller quorum**。如果多数成员都不可用，就不能继续安全地提交新的管理决策。

两种方式的关系是：

~~~text
旧方式：Kafka broker 收发消息，管理工作还依赖外部 ZooKeeper
新方式：Kafka broker 收发消息，Kafka controller 通过 KRaft 维护管理信息
~~~

**Kafka 4.0 起已经移除了 ZooKeeper 模式。** 本篇使用 4.1.2，因此选择 KRaft，不需要在它旁边再装 ZooKeeper。

### 2.4 对应到我们的 Docker 配置

本例只用一个 Kafka 容器，同时承担 broker 和 controller 两种角色。下载包的 `compose.yaml` 已有完整配置，第一次先读懂以下几项；地址配置在第十一节结合 NAS 访问问题再展开。

| 配置 | 放在本例中怎样理解 |
| --- | --- |
| `image: apache/kafka:4.1.2` | 使用固定版本的官方 Kafka 镜像 |
| `KAFKA_NODE_ID: 1` | 给这个 Kafka 节点编号 1 |
| `KAFKA_PROCESS_ROLES: broker,controller` | 同一个进程既收发消息，也管理集群 |
| `KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093` | 管理成员只有节点 1，通过 kafka:9093 联系它 |
| `CLUSTER_ID` | 标识这套集群，不是登录密码 |
| `kafka-data:/var/lib/kafka/data` | 用 Docker 数据卷保存 Kafka 数据，容器重建时可以继续使用 |

因为只有一个节点，没有其他节点接替它，**这套部署适合学习，不具备节点容灾能力**。生产多节点配置的区别放在第十一节，不需要为了发第一条消息先租三台服务器。

### 2.5 启动后，确认现在处于哪一步

~~~bash
bash scripts/init-secrets.sh
docker compose up -d mysql kafka
docker compose ps
~~~

密码脚本只在本地生成后面 MySQL 和管理接口需要的凭证，不会向 Kafka 自动添加认证。`secrets/` 已被 Git 忽略，下载包也不包含密码。

等 MySQL、Kafka 的状态都变成 `healthy`。有问题先看：

~~~bash
docker compose logs --tail=60 kafka
~~~

到这里，只准备好了 Kafka 服务和后面要用的 MySQL。还没有发送消息，也没有 Java 下单服务。`healthy` 表示服务通过了启动检查，不表示订单业务已经跑通。

## 三、先发一句话，再把它读出来

### 3.1 消息放在哪：topic

Kafka 可以同时保存订单任务和短信任务。如果混在一起，读取订单的程序还得不断辨别“这条是不是给我的”。因此先按用途分类。

**topic（主题）是一类消息的名字。** 生产者明确发送到哪个 topic，消费者明确订阅哪个 topic。

~~~text
订单生产者 → topic：orders → 订单消费者
短信生产者 → topic：sms    → 短信消费者
~~~

`orders`、`sms` 是自己起的名字，不是 Kafka 内置的两种功能。同一个 broker 可以保存多个 topic，一个 topic 里也会不断追加很多条消息。

这次先只创建一个练手 topic：`hello-kafka`。

~~~bash
docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka:9092 \
  --create --if-not-exists --topic hello-kafka \
  --partitions 1 --replication-factor 1
~~~

`exec -T kafka` 表示在 Kafka 容器里执行命令。镜像已经带了这些命令行工具，不用在 NAS 上另装一套 Kafka。

`--bootstrap-server` 是客户端最先连接的 Kafka 地址。这里命令在 Docker 网络内执行，`kafka` 是 Compose 中 Kafka 服务的名称，`9092` 是它的内部客户端端口。

创建时还有两个必须区分的参数：

- `--partitions 1`：先用一条有序消息记录保存这个 topic。这条记录叫**分区**，后面会试着拆成三条。
- `--replication-factor 1`：这条记录只保存一份。如果需要节点故障后仍有另一份可用，就需要在其他 broker 上保存副本。

**分区是把消息分开存，副本是把同一份消息多保存几份。** 当前两个值都是 1，先不用考虑并行分配。

### 3.2 命令行也可以当生产者

~~~bash
printf 'first message\n' | docker compose exec -T kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka:9092 --topic hello-kafka
~~~

`printf` 输出一行文字，`|` 把文字交给右侧的生产者程序，它再发给 Kafka。命令结束，不代表消费者已经读取，更不会自动创建订单。

### 3.3 再启动一个消费者，读取刚才的文字

再启动消费者读取一条：

~~~bash
docker compose exec -T kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka:9092 --topic hello-kafka \
  --from-beginning --max-messages 1 \
  --property print.partition=true --property print.offset=true
~~~

`--from-beginning` 表示从最早仍保留的消息开始，`--max-messages 1` 表示读到一条就退出。两个 `--property` 参数只是让输出多显示消息所在分区和位置。

新建且没有写入其他内容的 topic，应该看到类似输出：

~~~text
Partition:0  Offset:0  first message
~~~

逐项看这一行：

| 输出 | 含义 |
| --- | --- |
| `Partition:0` | 来自编号 0 的分区；目前也只有这一个分区 |
| `Offset:0` | 这条消息在该分区中的位置是 0 |
| `first message` | 真正发送的消息正文 |

看到这行，才完成了第一次收发验证：**发送程序已经退出，消息仍在 Kafka，后来启动的消费者还能读取它。**

### 3.4 offset：消息的位置，与消费者的读取进度

Kafka 不是“取走一条就删除一条”的列表。消息被读取后，仍按配置保留在日志中，直到日志清理。

**offset 是消息在某个分区里的位置编号。** 在这个普通示例中，第一条是 0，再追加一条就是 1。它不是订单号，也不是已处理订单数。

比如分区里现在保存了三条消息：

~~~text
offset 0：first message
offset 1：second message
offset 2：third message
~~~

消息的位置属于日志；“我处理到哪里”则属于消费者。两者要分开看：

| 消费者完成了什么 | 应记住的下一次读取位置 |
| --- | --- |
| 还没有处理任何消息 | 0 |
| 处理完 offset 0 | 1 |
| 处理完 offset 0、1 | 2 |

**提交 offset，就是向 Kafka 记录自己的消费进度。** 不是把消息从 Kafka 删掉，也不是向 MySQL 提交订单事务。消费者退出再启动，可以根据已记录的位置继续读。

如果订单已写入数据库，但还没来得及记录消费进度就退出，重启后可能再次读取同一条消息。这就是后面要处理“重复消费”的原因，不需要等发生故障才第一次认识 offset。

现在重复执行上一小节的读取命令。这些临时命令没有指定固定的业务消费组，会各自从头读取，仍能看到 `first message`。读取不删除消息，所以这不是重复发送了一条。

## 四、把 partition 和消费组放进一个具体例子

### 4.1 partition：为什么要把一个 topic 拆开

刚才的 `hello-kafka` 只有一个分区，消息按位置顺序追加。如果想让多个普通消费组成员分工处理，就可以把 topic 拆成多个分区。

**partition 是 topic 内的一份有序日志。** 这里的“日志”指不断追加的消息记录，不是 Java 打印的报错日志。

例如订单 topic 有三个分区。下面的 A、B、C 表示不同订单任务，分区里保存的是不同消息，不是三份备份：

~~~text
seckill.orders.v1
  分区 0：offset 0 = 订单 A，offset 1 = 订单 D
  分区 1：offset 0 = 订单 B，offset 1 = 订单 E
  分区 2：offset 0 = 订单 C，offset 1 = 订单 F
~~~

所以只说“offset 0”不能定位一条消息，还要说清 topic 和分区。分区 0 的 offset 0 与分区 1 的 offset 0 完全可以是两笔不同订单。

不同分区可以并行处理。消费者可能先完成 B，再完成 A，Kafka 不提供跨分区的全局处理顺序。单个 broker 也能保存这三个分区，**三个分区不意味着必须部署三个 Kafka 节点**。

### 4.2 group：哪些消费者是在分工做同一件事

现在启动两个订单消费者 A、B。Kafka 怎么知道它们是在一起下单，还是应该各自处理一遍？通过**消费组名称，也就是 group-id**。

两个消费者都使用 `order-writer-v1`，表示共同完成这组订单处理工作。在本例的普通消费组模型中，一个分区同一时刻分配给组内一个消费者。

三个分区、两个消费者，一种可能的分配是：

~~~text
消费者 A ← 分区 0、分区 1
消费者 B ← 分区 2
~~~

在正常分配下，分区 0 的新消息交给 A，B 不需要再做一遍。出故障后仍可能重复处理，所以“组内分工”不等于业务绝不会重复。

如果只有一个分区，开两个同组消费者也不能同时分担这一条分区，另一个会空闲。三个分区、四个同组消费者，也至少有一个分不到分区。

**消费进度也是按“消费组 + topic + 分区”分别保存的。** 组中的 A 退出，B 接过它的分区后，可以从这组已经提交的位置继续处理。

### 4.3 不同 group：同一条消息可以用于不同业务

假设另一个程序只统计抢购人数，也想读取同一批消息，可以使用不同的组名 `order-statistics-v1`。

~~~text
同一个订单 topic
  → order-writer-v1：A、B 分工，负责创建订单
  → order-statistics-v1：C 读取这批消息，负责统计
~~~

两组独立维护读取进度。订单组读完了，不会让统计组失去读取机会，因为消息没有被订单组“取走删除”。在保留期内，同一批消息可以供多个业务使用。

反过来，如果两个落单实例误用了不同组名，它们会各处理一遍，增加重复下单的风险。**想分担一份工作，用同组；想分别处理一遍，用不同组。**

所以本例的两个实例使用同一个 `group-id`。后面处理死信的程序使用另一个组，但订阅的是另一个 topic。

### 4.4 rebalance：实例退出后，谁接过它的工作

沿用刚才的分配，A 处理分区 0、1，B 处理分区 2。如果 A 退出，不能让分区 0、1 永久没人处理。Kafka 会调整组内分区分配，让仍然运行的成员接手。

这个调整过程叫 **rebalance（重新分配）**。新消费者加入、已有消费者退出等情况都可能触发，期间处理可能短暂停顿。

稍后故意退出一个 Java 实例时，日志里出现分区撤销、重新分配，通常就是这个过程。它是消费组的正常机制，不一定表示数据损坏。

### 4.5 key：一条消息怎样选择分区

发送一条消息时，除了正文，还可以带一个 **key**。它是生产者附带的分区依据，不是登录密码，也不是 Kafka 自动检查的数据库唯一键。

本例用请求 ID 当 key。稍后 Java 发送方法的三个参数依次是 topic、key、正文：

~~~java
kafka.send("seckill.orders.v1", event.requestId(), payload);
~~~

在分区数等条件不变、使用默认分区策略时，相同 key 通常进入同一分区；不同请求 ID 可以分散到多个分区。

如果所有人都抢同一个 SKU，却把 SKU 当 key，这场活动的消息就会集中到一个分区。建了十个分区也不代表这一个热点能并行消费。

本例只发送“创建订单”任务，不要求整个活动全局有序；正式库存一致性仍由 MySQL 事务保证。增加分区可能改变 key 的分配结果，需要保序的业务不能随意扩分区。

至此可以把这几个词放回实际流程：**生产者选 topic、携带 key 发送；broker 把消息保存到某个分区并赋予 offset；消费组的成员分工读取，处理后记录本组的进度。**

## 五、Java 项目怎样接入

后面会反复用到这几个文件。Java 源码都在 `src/main/java/com/jayczee/kafkaorder/` 下，配置在 `src/main/resources/application.properties`。

| 文件 | 阅读时关注什么 |
| --- | --- |
| [OrderService.java](https://github.com/Jayczee/order-seckill-kafka-demo/blob/main/src/main/java/com/jayczee/kafkaorder/OrderService.java) | 受理申请、写入正式订单、付款与取消 |
| [OutboxPublisher.java](https://github.com/Jayczee/order-seckill-kafka-demo/blob/main/src/main/java/com/jayczee/kafkaorder/OutboxPublisher.java) | 从数据库找待办，发送到 Kafka |
| [OrderConsumer.java](https://github.com/Jayczee/order-seckill-kafka-demo/blob/main/src/main/java/com/jayczee/kafkaorder/OrderConsumer.java) | 收到消息，调用落单方法，再提交消费进度 |
| [KafkaConfig.java](https://github.com/Jayczee/order-seckill-kafka-demo/blob/main/src/main/java/com/jayczee/kafkaorder/KafkaConfig.java) | 消费失败时怎样重试、转移失败消息 |

### 5.1 增加的依赖做什么

`pom.xml` 中增加：

~~~xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
~~~

Spring Kafka 是 Java 应用访问 Kafka 的工具。先记住两个会在代码中用到的入口：

| 写法 | 用来做什么 | 类比熟悉的 Spring 代码 |
| --- | --- | --- |
| `KafkaTemplate` | 在 Java 中发送消息 | 像通过 `JdbcTemplate` 执行 SQL 一样，通过它调用 Kafka |
| `@KafkaListener` | 指定一个方法来处理读到的消息 | 类似用注解声明入口，但触发它的是消息，而不是 HTTP 请求 |

Spring Kafka 还负责在后台持续拉取消息、调用处理方法。这部分运行机制叫**监听容器**，是 Java 应用内部的对象，和 Docker 容器不是一回事。

引入这个依赖不会顺便启动 Kafka 服务，前面 Docker 中的 broker 仍然要运行。

项目使用 Spring Boot 3.5.16 管理依赖，对应 Spring Kafka 3.3.16、Kafka Java client 3.9.2。broker 是 4.1.2，客户端和服务端不要求版本号一模一样；本次组合通过实际通信和故障实验验证。

### 5.2 Java 对象怎样变成可以发送的消息

网络上传输的是字节，不能把一个 Java 对象原封不动交给另一个进程。**序列化就是把数据转成字节，反序列化则是把字节还原成程序能使用的数据。** 本例分两步做：

~~~text
发送：OrderEvent 对象 → JSON 字符串 → 字节 → Kafka
接收：Kafka → 字节 → JSON 字符串 → OrderEvent 对象
~~~

对象与 JSON 之间的转换由 Jackson 的 `ObjectMapper` 完成；字符串与字节之间的转换交给 Kafka 的 `StringSerializer` 和 `StringDeserializer`。消息的 key 也是字符串，所以 key 和正文都配置为字符串转换器。

对应 `application.properties` 中的这一段：

~~~properties
spring.kafka.bootstrap-servers=${KAFKA_BOOTSTRAP_SERVERS:localhost:19092}
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.apache.kafka.common.serialization.StringDeserializer
~~~

第一行的 `${KAFKA_BOOTSTRAP_SERVERS:localhost:19092}` 是 Spring 的配置占位符：优先取环境变量，未设置时才用冒号后面的默认值。本例 Java 运行在 Docker 内，Compose 已把这个环境变量设置为 `kafka:9092`，所以它不会误连容器自己的 localhost。

### 5.3 消费者怎样记住进度

现在再看另一组配置。这些参数与消息怎样编码无关，控制的是“谁来处理、从哪里继续”：

~~~properties
spring.kafka.consumer.group-id=order-writer-v1
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.listener.ack-mode=manual_immediate
~~~

`group-id` 把两个订单实例归到同一组，让它们分担订单分区。

`enable-auto-commit=false` 关闭客户端自动定时提交进度；`manual_immediate` 则让业务代码在消费线程调用确认方法时提交。两项配合，才能明确安排“先把订单写进 MySQL，再记住消费进度”。第七节会看到这两行代码的先后顺序。

`earliest` 只在这个消费组没有可用的已提交位置时，从最早仍保留的消息开始。**不是每次重启都从头消费**。如果已经有进度，恢复时仍使用已提交的位置。

### 5.4 启动 Java，再发一条 hello

先把订单使用的 topic 建好：

~~~bash
bash scripts/topics.sh
~~~

脚本创建以下三个 topic；已有的 `hello-kafka` 会跳过，不会删除先前的消息。

| topic | 分区数 | 用途 |
| --- | --- | --- |
| `hello-kafka` | 1 | 练习发送普通文字 |
| `seckill.orders.v1` | 3 | 正常的创建订单任务 |
| `seckill.orders.v1.DLT` | 3 | 存放处理失败的消息，第九节再实际制造一次失败 |

项目关闭了自动创建 topic。省略这一步，Java 监听器会因找不到订单 topic 而启动失败。

接着构建并启动应用：

~~~bash
mvn -B -ntp package
docker compose up -d --build app1 app2 gateway
~~~

`app1`、`app2` 是同一个 jar 的两个运行实例，各有一个订单消费者，使用同一个消费组。`gateway` 是 Nginx，提供统一的 HTTP 入口 `18380`；它不是 Kafka 的组成部分。

等应用启动完成后再执行；刚启动时出现连接失败或 502，可以先用 `docker compose logs --tail=60 app1 app2` 查看是否还在启动。

~~~bash
curl http://127.0.0.1:18380/health
python3 scripts/lab.py hello
~~~

脚本读取本机管理令牌，调用 Java 接口。接口中的发送代码是：

~~~java
var metadata = kafka.send("hello-kafka", "hello-user", "hello from Java")
        .get(12, TimeUnit.SECONDS)
        .getRecordMetadata();
~~~

这里的 `kafka` 是注入的 `KafkaTemplate<String, String>`。`send()` 的三个参数分别是 topic、key、正文；返回的对象代表一个尚未必完成的发送任务，`.get(12, TimeUnit.SECONDS)` 最多等待 12 秒获取结果。

结果会包含 `topic`、`partition`、`offset`，说明 broker 已确认这次发送。不能刚调用 `send()` 就打印“发送成功”；超时或异常也需要处理。

想亲眼看见 Java 发出的文字，可以再用第三节的命令行消费者读取，去掉 `--max-messages 1`。它会先显示之前的 `first message`，随后显示 `hello from Java`，最后按 Ctrl+C 退出。此时我们只是换了发送工具，Kafka 中消息的保存和读取方式没有变。

`/health` 只检查 Java 和 MySQL，不会证明订单消息已经跑通。发送 hello、观察消费组、下一笔真实订单才是后面的验证。

## 六、接上订单：数据库写成功了，消息还没发怎么办

### 6.1 先说明这次架构的取舍

刚才发一句 hello，只需要验证 Kafka 收到了。真实下单还要先检查并占用库存，问题就多了一步：

~~~text
MySQL 为 req-001 占用一件库存，并记下申请
    ↓ 此时 Java 进程突然退出
发送 req-001 到 Kafka，通知后台创建订单
~~~

如果第二步还没执行，库存被占了，后台却一直收不到任务。把顺序倒过来也不够：先发消息，消费者可能开始下单，而入口的库存事务随后失败。

**一次 MySQL 事务不能把 Kafka 发送自动包进去。** 这里的数据库事务，只保证事务内的数据库修改一起成功或一起回滚。

本例的做法是先在 MySQL 中保存“稍后必须发送的任务”。它不需要 Redis，也不保留 Redis Stream。

这意味着入口仍要访问数据库，不再具有上一篇纯 Redis 预占的短路径。我们用这个版本学习可靠消息边界，而不是宣称“换上 Kafka 后秒杀性能更高”。

整个订单链路如下。注意图里的三个确认点不是同一件事：

![受理、Kafka 发送确认与正式订单提交的关系](/assets/images/order-seckill-kafka-demo/flow.svg)

### 6.2 outbox 不是另一种消息中间件

**outbox 就是一张普通 MySQL 表，记录“哪些消息还没发出去”。** 不需要为它再安装一个服务。可以把它看成应用自己的待发送清单。

申请下单时，在一个数据库事务里完成三件事：

~~~text
扣减可用库存、增加占用库存
创建 QUEUED 状态的受理记录
插入一条 outbox 待发送任务
一起提交
~~~

`QUEUED` 是项目定义的申请状态，意思是“已经受理，等待创建正式订单”，不是 Kafka 内置状态。源码的 `OrderService.accept()` 使用 `TransactionTemplate.execute()` 包住这三次写入：要么一起成功，要么一起回滚。

回到 req-001：只要受理事务成功，数据库中就一定有对应的 outbox 待办。进程此时退出，重启后仍能找到它并发送，不依赖原进程的内存。

这叫 **事务性 outbox 模式**。它没有把 Kafka 放进 MySQL 事务，而是先把“稍后必须发送”这件事可靠地记录下来。

入口返回 HTTP 202、`QUEUED`，表示 MySQL 已经受理。它不表示 Kafka 已经收到消息，也不表示正式订单已经创建。

### 6.3 库存不要扣两次

本版在受理时已经把库存从 `available` 挪到 `locked`，消费者只创建正式订单，不再扣一遍库存。

因此库存口径也要改清楚：

~~~text
available + locked + sold = total
locked = 排队中的资格 + 等待人工处理的资格 + 待付款订单
~~~

`available` 是还可以卖的数量，`locked` 是已被申请占用但尚未卖出的数量，`sold` 是已付款数量。比如总库存 100，受理一笔申请后就是 `99 + 1 + 0 = 100`；创建正式订单时，这三个数不再改变。

受理事务按活动加行锁，检查活动时间、剩余库存和待处理数量，再创建请求。`requests` 和 `orders` 都有 `(activity_id, user_id)` 唯一约束，同一用户重试只返回原申请。

这个直观写法会争抢同一活动的库存行，不是高吞吐入口的最终形态。`maxPending` 表示允许多少笔申请停留在排队或人工检查状态；达到上限就拒绝新申请，防止 Kafka 停机或消费者跟不上时无限受理。

### 6.4 后台怎样发送 outbox

`OutboxPublisher` 是应用里的一个 Spring 组件，通过 `@Scheduled(fixedDelay = 100)` 在上次执行结束 100 毫秒后再次检查待办，不是 Kafka 主动来扫描 MySQL。

两个 Java 实例都运行这个任务，所以还要避免正常情况下同时领到同一条待办。**租约**就是“某个实例在接下来一段时间内负责这条任务”的记录。本例把负责人和到期时间写进 outbox，然后按这个顺序处理：

~~~text
短事务领取一条待办，设置 30 秒租约
  → 退出数据库事务
  → 发送 Kafka，等待确认
  → 确认成功：将待办标记为已发送
  → 失败或结果不确定：保留待办，稍后重试
~~~

领取任务使用 `FOR UPDATE SKIP LOCKED`：锁住选中的待办，碰到已经被另一事务锁住的行就跳过。数据库事务提交后行锁释放，接下来的发送阶段由租约记录表示任务归属，网络等待不会一直占着这个行锁。

进程退出后，租约到期，另一个实例可以再领走。这里发送最多等 12 秒，租约设为 30 秒；即使有租约，异常停顿或崩溃仍可能造成重复发送。

比如 Kafka 已经收到了 req-001，但应用还没把 outbox 标记为已发送就退出，重启后就会再发一遍。下一节要解决的是：**允许任务再来一次，但不能因此给用户再建一笔订单。**

## 七、生产者确认和消费者确认，不是同一回事

### 7.1 生产者的 acks=all

生产者把数据交给网络之后，怎么知道 Kafka 收到了？需要 broker 返回确认。**`acks` 控制发送方要求怎样的确认；它不关心后面有没有生成订单。**

本例只有一个 broker、一份消息副本。配置 `acks=all` 时，等待的也只有这一份的确认，不能因此获得多机容灾。

如果有多个 broker，每个分区可以保存多份副本。其中负责接收该分区写入的一份叫 **leader**，其他跟随复制的叫 **follower**。这个分区的 leader 与前面管理集群元数据的 controller 是不同职责。

当前跟得上复制进度的副本组成 **ISR（in-sync replicas，同步副本集合）**。`acks=all` 要求当前 ISR 中的副本完成确认；`min.insync.replicas` 则规定至少要有多少份同步副本，才允许这种写入成功。副本掉队不会永远算在 ISR 中，因此“all”并不等于所有曾经配置的副本都一定写到了。

先理解这个确认边界，再看本例生产者配置：

~~~properties
spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5
spring.kafka.producer.properties.delivery.timeout.ms=10000
spring.kafka.producer.properties.request.timeout.ms=3000
spring.kafka.producer.properties.max.block.ms=3000
~~~

### 7.2 幂等：再做一次，不能多出一笔订单

**幂等的意思是，同一个业务操作重复执行，结果仍与执行一次相同。** 对 req-001 来说，消费者收到一次或两次，数据库中都只能有一笔对应订单。

这里有两层不同的重复，不能混为一谈：

| 重复发生在哪里 | 本例怎样处理 |
| --- | --- |
| 同一次发送中，Kafka 客户端因网络问题重试 | `enable.idempotence=true` 启用生产者的去重保护 |
| 应用重启后重新发送 outbox，或消费者再次读到已处理的消息 | 用原请求 ID 查业务状态，配合数据库唯一约束，避免再创建订单 |

生产者幂等不替应用识别“这还是昨天那个 req-001”，所以不能因为打开它就删掉业务去重。

`max.in.flight.requests.per.connection=5` 限制单条连接中最多有多少个请求正在等待响应，当前值满足启用生产者幂等的要求。其余三个超时分别是：

| 配置 | 限制什么 |
| --- | --- |
| `delivery.timeout.ms=10000` | 一次发送从排队、尝试到重试的交付时间预算 |
| `request.timeout.ms=3000` | 一次网络请求等待响应的时间 |
| `max.block.ms=3000` | 调用发送时，因等待集群信息或缓冲区空间而阻塞的时间 |

本例为了故障实验较快出结果，取值比较短；生产应结合网络、负载和业务等待预算调整，不能直接照搬为“最佳参数”。

发送超时不代表 broker 一定没写入，确认响应也可能丢失。保留相同业务请求号重试，不要直接取消资格或换一个请求号重新占库存。

### 7.3 消费者什么时候提交 offset

前面生产者用 `KafkaTemplate` 发消息，它由 Spring Boot 根据配置创建并注入。消费者则通过 `@KafkaListener` 声明“订阅这个 topic”。Spring Kafka 在后台拉取消息，再调用这个方法，不是浏览器来请求它。

`OrderConsumer` 的主要流程如下，省略了故障注入和实验计数：

~~~java
@KafkaListener(id = "order-worker", idIsGroup = false,
        topics = "seckill.orders.v1")
public void consume(ConsumerRecord<String, String> record,
                    Acknowledgment acknowledgment) throws Exception {
    OrderEvent event = json.readValue(record.value(), OrderEvent.class);
    orders.materialize(event, instance, record.partition(), record.offset());
    acknowledgment.acknowledge();
}
~~~

`record.value()` 是消息正文，`record.partition()`、`record.offset()` 记录这条消息来自哪里。`id` 是本机监听容器的名字；`idIsGroup=false` 表示不要拿这个名字覆盖前面配置的 `order-writer-v1` 消费组。

`materialize()` 内部完成 MySQL 事务，返回后才调用 `acknowledge()`。本例使用 `MANUAL_IMMEDIATE`，在消费者线程明确提交消费进度。

顺序不能倒过来。如果先提交 offset，再写库，提交后进程退出，重启就可能跳过尚未生成订单的消息。

反过来，MySQL 已提交、offset 尚未提交时退出，重启会再次读到消息。`materialize()` 锁定原请求，发现已经是 `UNPAID` 或其他已处理状态就直接返回，不重复创建订单。

用一条 offset 为 0 的消息来看，正常顺序是：

~~~text
读取 req-001（offset 0）
    → MySQL 创建订单并提交事务
    → acknowledge() 提交下一次位置 1
~~~

如果最后一步之前退出，下一次还可能读到 offset 0，但数据库已经记得 req-001 处理过了。这次不再创建订单，直接完成确认。

这就是本例的保证：**消息可能重复处理，同一申请只创建一笔订单。** Kafka 自身的事务不能自动把外部 MySQL 事务也一起提交；不要把消息系统的保证直接当成业务数据库的保证。

## 八、从创建活动到查询订单，手动走一遍

现在基础收发和订单代码都接好了，实际验证一次。以下 HTTP 命令在运行 Docker 的机器上执行；从电脑访问 NAS 时，要使用对应的 SSH 端口转发。

先创建活动，再模拟 user-1 点一次下单：

~~~bash
python3 scripts/lab.py create first-order --stock 100
curl -X POST http://127.0.0.1:18380/api/activities/first-order/buy \
  -H 'X-Demo-User: user-1'
~~~

创建活动的脚本负责准备实验库存，不经过 Kafka。`buy` 接口才会执行受理事务，返回申请编号和 `QUEUED` 状态。接下来查询后台是否已经完成：

~~~bash
curl http://127.0.0.1:18380/api/orders/first-order \
  -H 'X-Demo-User: user-1'
python3 scripts/lab.py snapshot first-order
~~~

第一次受理是 `QUEUED`，后台处理后变成 `UNPAID`（已创建正式订单，等待付款）。如果仍是 `QUEUED`，稍后重复查询；负载低时很快，第一次查询直接看到 `UNPAID` 也正常。

`snapshot` 读取实验统计。预期库存按“可用 / 占用 / 已售”从 `100 / 0 / 0` 变成 `99 / 1 / 0`，正式订单数为 1，待发送 outbox 数为 0。再次调用相同用户的 `buy`，仍只返回原申请，不多占库存。

模拟付款：

~~~bash
curl -X POST http://127.0.0.1:18380/api/orders/first-order/pay \
  -H 'X-Demo-User: user-1'
~~~

状态变为 `PAID`，库存成为 `99 / 0 / 1`。取消接口是同一路径下的 `/cancel`；超时任务也会关闭未付款订单，付款期限从正式订单创建时开始计算。

付款和取消仍由 MySQL 事务决定谁先成功，不依赖 Kafka 为这两个 HTTP 请求提供顺序。`QUEUED` 和 `MANUAL_REVIEW` 暂不允许直接取消，否则还得处理在途消费和资格撤销的竞争。

也可以打开 `http://127.0.0.1:18380` 的实验页面。用户输入框和 `X-Demo-User` 只模拟身份，不能作为正式系统的登录方案；支付按钮同样不连接真实支付平台。

## 九、消费失败，不能一直堵住后面的消息

### 9.1 先重试，再进死信 topic

网络或数据库短暂异常可以重试；缺失字段、错误数据一直重试，往往不会自己恢复。

假设同一分区里 req-001 后面还有 req-002。如果一直卡在 req-001，后面的请求也迟迟不能处理。本例允许失败任务有限重试，仍然失败就先单独保存，留待检查。

**DLT 是 dead-letter topic，即单独存放失败消息的 topic，常叫死信主题。** 它仍是普通 Kafka topic，只是应用约定用它存失败消息。前面创建的 `seckill.orders.v1.DLT` 就用于这个目的。

对于本例实验注入的可重试异常，处理过程是：

~~~text
首次处理失败 → 等 1 秒 → 重试失败 → 等 1 秒 → 再重试失败
    → 将失败消息发送到 seckill.orders.v1.DLT
    → 确认发送成功后，推进原分区的消费进度
    → 继续处理后面的任务
~~~

Kafka broker 不会替应用自动完成这一套重试。这里由 Spring Kafka 的 `DefaultErrorHandler` 接住消费方法抛出的异常，再用 `DeadLetterPublishingRecoverer` 把重试后仍失败的消息发出去：

~~~java
var recoverer = new DeadLetterPublishingRecoverer(kafka,
        (record, exception) -> new TopicPartition(
                record.topic() + ".DLT", record.partition()));
recoverer.setFailIfSendResultIsError(true);
recoverer.setWaitForSendResultTimeout(Duration.ofSeconds(15));
var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000, 2));
handler.setCommitRecovered(true);
~~~

完整代码在 `KafkaConfig` 中，用 `@Bean` 注册这个错误处理器，由 Boot 配置的监听容器使用。不是在普通方法里创建一个对象就会自动生效。

`FixedBackOff(1000, 2)` 表示两次额外重试、间隔 1000 毫秒；加上首次处理，共尝试三次。框架对部分致命异常会跳过重试，不能把所有异常都理解成固定尝试三次。

`setFailIfSendResultIsError(true)` 要求检查转发结果，最多等待 15 秒；`setCommitRecovered(true)` 配合前面的手动确认模式，在成功处理完失败转移后提交原消息进度。

DLT 保持三个分区，因为这里将失败消息发到与原消息相同编号的分区。若只建了一个 DLT 分区，原分区 1、2 的消息就不能按这段配置发送过去。

只有确认失败消息已成功送到 DLT，才推进原消息的消费进度。DLT 发送失败则继续保留恢复机会，不能“转死信时又把消息丢了”。

### 9.2 原 topic 不积压了，不代表订单成功

项目还运行着一个专门读取 DLT 的消费者。它把失败事件写入 MySQL 的 `failed_message` 表，对应申请变成 `MANUAL_REVIEW`（等待人工检查），占用库存仍保留。

这时原 topic 的消费进度可以继续前进，后面的消息不必无限等待这条坏消息。但这笔订单没有自动成功，需要人工查看原因、修复后重放。

实验可以这样做，使用新的活动名称。`fault ... --name poison --enabled` 是 Demo 的故障开关，故意让这场活动的订单消费持续报错，方便观察失败流程：

~~~bash
python3 scripts/lab.py create poison-order --stock 1
python3 scripts/lab.py fault poison-order --name poison --enabled
curl -X POST http://127.0.0.1:18380/api/activities/poison-order/buy \
  -H 'X-Demo-User: user-1'
python3 scripts/lab.py snapshot poison-order
~~~

等几秒后再次执行 `snapshot`，应看到 `MANUAL_REVIEW`、一条失败记录、正式订单数为 0。接着关闭故障开关，再把原任务送回正常处理流程。这个重新投递的动作叫**重放**：

~~~bash
python3 scripts/lab.py fault poison-order --name poison
python3 scripts/lab.py replay poison-order
python3 scripts/lab.py snapshot poison-order
~~~

重放为原申请新增一条 outbox 记录，仍使用原请求 ID；处理后应该只有一笔订单。不是把整个消费组的 offset 调回去、让所有用户全部重来。

这里 `fault` 命令不带 `--enabled` 就是关闭故障。如果仍开着故障就重放，任务会再次失败，不会因为换了一次投递就自己修好。

重试和重放也可能改变业务完成顺序。如果前后两条业务必须严格按顺序执行，不能照搬“失败一条送 DLT，继续处理后面”的策略。

## 十、怎么看 Kafka 是否真的在削峰

Kafka 中有消息待处理时，常见观察指标是 **lag（消费进度落后的距离）**。先用一个分区举例：

~~~text
Kafka 已保存 offset 0～9：日志末端的下一位置是 10
消费组已处理并提交到下一位置 4：表示进度记录到了 offset 3 之后
lag = 10 - 4 = 6
~~~

在这个简单例子里，还有 offset 4～9 六条消息没有体现在已提交进度中。也可能业务已经处理了其中一部分，只是尚未提交进度，所以 **lag 不是精确的“还差几笔订单没创建”**。

查看本例订单组：

~~~bash
docker compose exec -T kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka:9092 \
  --describe --group order-writer-v1
~~~

输出按分区展示，每列含义如下：

| 列名 | 看什么 |
| --- | --- |
| `PARTITION` | 分区编号，本例订单 topic 是 0、1、2 |
| `CURRENT-OFFSET` | 消费组提交的下一读取位置，上例是 4 |
| `LOG-END-OFFSET` | 日志末端的下一位置，上例是 10 |
| `LAG` | 两者相差多少，上例是 6 |
| `CONSUMER-ID` | 当前哪个消费者被分配到这个分区 |

刚创建的组还没有进度时，部分值可能显示为 `-`。先完成第八节的实际下单，再看输出更容易理解。

但只看 lag 还不够。本 Demo 有两个等待位置：

~~~text
outboxPending：MySQL 已受理，还没确认发到 Kafka
Kafka lag：已经进入 Kafka，消费组还没推进到那里
~~~

此外还有 `MANUAL_REVIEW`：原 topic 可能已经不积压，但业务失败了。

### 10.1 暂停消费，让积压变得可见

~~~bash
python3 scripts/queue-lab.py
~~~

脚本暂停订单消费者，受理 60 个请求，等 outbox 发送完再观察；随后恢复消费，等正式订单全部完成。

暂停不等于退出消费组。本例调用监听容器的 pause，暂时停止向业务交付新的订单消息，但仍保持与 Kafka 的联系，告诉它“这个消费者还活着”。这种定期报告存活的机制叫心跳。这样分区仍留在原消费者手中，不会因为整个实例退出而立刻被另一实例接过去处理。

这能说明：生产者和消费者不必同速，消息可以先留在 Kafka，恢复后再消化。**这不是吞吐压测**，没有用人为暂停的时间计算“优化了多少倍”。

2026-09-16 在 NAS 上运行的结果：

| 时点 | 待发送 outbox | Kafka 三个分区的 lag | 正式订单 |
| --- | --- | --- | --- |
| 消费暂停、消息全部发送后 | 0 | 22 / 19 / 19，共 60 | 0 |
| 恢复并处理完 | 0 | 0 / 0 / 0 | 60 |

两个消费者分别处理了 41 条和 19 条，不是平均分成 30 / 30：一个实例分到两个分区，另一个分到一个，消息 key 的分布也不保证均分。这里还能看见为什么不能把“两个消费者”直接当成“两倍吞吐”。

消费者太多、每个消费者又并发打数据库，仍然会把数据库打满。分区数量决定并行处理的空间，不自动限制写库 QPS。需要严格限制时，应额外控制消费并发和速率；Kafka 也不能替本 Demo 的数据库受理入口挡住所有高并发请求。

### 10.2 再做几次真正的中断

~~~bash
python3 scripts/verify.py
~~~

这个脚本不只是调用接口，会退出本项目中的 Java 进程，以及停止并恢复本项目 Kafka。不要在生产环境运行，也不要与其他实验同时执行。

验证结果保存为 `target/verification.json`，积压实验保存为 `target/queue-lab.json`。2026-09-16 使用当前源码重新构建 jar，在 NAS 的独立 Docker 项目中实际通过：

| 实验 | 实际核对结果 |
| --- | --- |
| 300 个用户抢 100 件 | 100 笔订单，库存不为负，两个消费者使用三个分区 |
| 50 人付款、50 人取消 | 可用 50、占用 0、已售 50 |
| 同一用户并发申请 60 次 | 同一个请求号，只创建一笔订单 |
| 同一订单并发付款、取消 | 只有一个终态，库存不重复变化 |
| 暂停发送、待处理上限 5 | 20 次申请中 5 个受理、15 个拒绝 |
| Kafka 确认后、outbox 标记前退出 | 租约到期重新发送，最终仍是一笔订单 |
| MySQL 提交后、offset 提交前退出 | 发生再次消费，正式订单仍只有一笔 |
| 持续消费失败 | 转入 DLT 与人工检查，修复重放后只有一笔订单 |
| 未付款超时 | 自动取消并归还库存 |
| 停止 Kafka 后继续申请 | 受理记录留在 MySQL，恢复 Kafka 后补发并生成订单 |

下载包中的 `evidence/verification-2026-09-16.json`、`queue-lab-2026-09-16.json` 保存原始状态和消费组输出，`environment-2026-09-16.json` 保存版本与资源限制。这些测试验证的是处理边界，不是断电不丢数据或多机容灾。

### 10.3 出问题先查哪一段

| 现象 | 先看什么 |
| --- | --- |
| Java 连得上端口，却反复连接失败 | broker 返回的 advertised 地址是否从 Java 所在网络可达 |
| 应用启动提示 topic 不存在 | 是否先执行 topics.sh，topic 名称有没有拼错 |
| outboxPending 不断增加 | 发送异常、Kafka 状态、消息路由到的地址、待办是否仍有租约 |
| outbox 已发送，Kafka lag 增加 | 消费者是否暂停、分区分配、数据库耗时、重试日志 |
| 开了两个消费者，只有一个有消息 | topic 分区数量、是否同一 group、key 是否全相同 |
| lag 已归零，订单却没生成 | DLT、MANUAL_REVIEW、错误处理是否提前推进进度 |
| 重启后又处理了同一条消息 | 数据库提交后 offset 是否来得及提交；业务幂等是否正确 |
| 出现 rebalance 或 CommitFailedException | 实例是否重启，处理一批消息是否超过 max.poll.interval.ms |

消费者调用 `poll()` 向 Kafka 拉取一批消息；用 `@KafkaListener` 时，这个调用由监听容器执行。本例一次最多取 10 条，`max.poll.interval.ms=300000` 要求两次 poll 的间隔不能超过 5 分钟。处理和重试耗时都要算在里面，长时间处理一批消息不再 poll，可能被移出消费组，即使线程还活着。

不要为了“看起来没有积压”就随便把消费组 offset 改到最新位置，那相当于跳过还没完成的工作。

## 十一、NAS 上能跑，和生产部署差在哪里

### 11.1 单节点为什么用副本 1

Kafka topic 的复制因子表示每个分区保存多少份副本。我们的 NAS 上只启动一个 broker，只能先用副本 1；内部的消费进度 topic 也必须相应配置，不能保留需要多节点的默认值却只起一台机器。

本例设置了这些单节点参数：

~~~yaml
KAFKA_DEFAULT_REPLICATION_FACTOR: 1
KAFKA_MIN_INSYNC_REPLICAS: 1
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
~~~

事务状态参数为将来使用事务的客户端准备；本例发送订单消息没有启用 Kafka 事务。

单副本下，`acks=all` 也只有这一个副本的确认。进程重启后能从原卷恢复，不等于磁盘损坏、节点丢失后仍不丢消息。

常见生产起点是多个 broker、分区副本 3、`min.insync.replicas=2`、生产者 `acks=all`。例如三份副本中有一份掉队并退出 ISR，剩下两份仍可确认写入；如果 ISR 只剩一份，就拒绝这种写入，不能把单份保存当成满足了可靠性要求。

controller 通常独立部署为 3 个或其他合理的奇数节点，并分布到不同机器或可用区，避免一次故障全部失效。这与“每个消息分区存三份”是两回事：前者保障集群管理，后者保护业务消息。

这不是把 YAML 里的 1 全改成 3 就完成了。三份容器都放同一台 NAS，NAS 停机仍然一起不可用；broker、controller、磁盘、网络和监控都要一起规划。

本篇为固定的单节点实验使用静态 KRaft quorum。新建生产集群的动态 quorum、扩缩容和升级方式，应按选定 Kafka 版本的运维文档实施，不把教学 Compose 当生产模板。

### 11.2 最容易踩的坑：连得上端口，却收发不了消息

Kafka 客户端不是一直只使用你填写的入口地址。它先连接 bootstrap 地址，询问 topic 的分区在哪些 broker 上，再按返回的地址连接负责这些分区的 broker。

因此要分清两项配置：

| 配置 | 它回答的问题 |
| --- | --- |
| `listeners` | Kafka 进程实际在哪些端口接收连接？ |
| `advertised.listeners` | Kafka 告诉客户端：后续应使用什么地址连接我？ |

后者中的 advertised 可以理解为“对客户端公布的”。如果公布了客户端无法访问的地址，第一步能连接，后面仍会失败。

对应本例 Compose 中的环境变量：

~~~yaml
KAFKA_LISTENERS: INTERNAL://:9092,CONTROLLER://:9093,EXTERNAL://:19092
KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka:9092,EXTERNAL://${KAFKA_EXTERNAL_HOST:-localhost}:19092
~~~

`INTERNAL`、`EXTERNAL` 是给这两条客户端连接通道起的名字，分别用于 Docker 内、Docker 外；`CONTROLLER` 用于管理节点通信。它们不是三个 topic，也不代表启动了三个 Kafka 节点。

本例有两条业务监听地址：

| 客户端在哪 | bootstrap 地址 | broker 返回的地址 |
| --- | --- | --- |
| 同一个 Compose 网络内 | `kafka:9092` | `kafka:9092` |
| NAS 本机，或经 SSH 隧道的电脑 | `localhost:19092` | `localhost:19092` |

`CONTROLLER://kafka:9093` 是管理用途，不是 Java 客户端的入口。

如果用电脑直连 NAS 局域网地址，不能继续让 EXTERNAL 返回 `localhost`——在电脑看来，localhost 是电脑自己。

完整 Compose 支持在 NAS 项目目录的 `.env` 中设置：

~~~dotenv
KAFKA_BIND_IP=192.168.1.229
KAFKA_EXTERNAL_HOST=192.168.1.229
~~~

**这里的 IP 只是格式示例，请换成自己的 NAS 内网地址。** `BIND_IP` 决定宿主机绑定哪个接口，`EXTERNAL_HOST` 决定告诉外部客户端连接谁。改完后重新创建 Kafka 容器，保留数据卷；电脑上的 Java 使用 `NAS内网地址:19092`。

更保守的做法是保持默认回环监听，通过 SSH 转发电脑的 19092 到 NAS 的 `127.0.0.1:19092`。此时返回 localhost 正好对应电脑上的隧道端口。单 broker 这样可以，多 broker 需要逐个处理客户端可达地址，不能只转发一个 bootstrap 端口。

### 11.3 PLAINTEXT 只限受控实验

目前消息连接没有认证也没有加密，默认只开放回环端口。不要因为配置能用，就把 19092 映射到公网。

正式环境还要补上三件不同的事：TLS 加密传输，避免途中被直接读出内容；SASL 认证确认连接者是谁；ACL 权限规则限制这个身份能读写哪些 topic、使用哪些 group。它们不在本例的配置范围内，不能把现在的明文连接当成已完成了这些保护。

数据库密码和管理令牌也不能放进文章截图、Git 或源码包。

### 11.4 日志保留不是“等消费者处理完再删”

为了限制临时实验占用，日志保留约一天，并设置分区级字节限制。时间或容量达到清理条件时，Kafka 可以删除旧日志，不会无限等待落后的消费组；字节配置也不是整个 Kafka 数据卷的硬上限。

如果停了几天，消息已经超出保留窗口，不能只凭 outbox 的“已发送”就认为业务完成。还得查 MySQL 中长期 `QUEUED` 的申请，与消费进度、DLT 对照，再受控补发。

本例没有实现这种跨保留窗口的自动修复。上线要根据最长允许停机时间、恢复速度和存储预算设置保留策略，并监控最老消息等待时间。

## 十二、到这里，应该能分清三个“成功”

~~~text
MySQL 受理事务提交：申请和待发送任务有了
Kafka 发送确认：broker 接受了消息
订单事务提交：正式订单生成了
~~~

它们发生在不同位置，没有一个“万能成功回调”能替另外两步兜底。

所以这次接 Kafka 的重点不是多引入一个依赖，而是把每个确认点、失败后的重做位置讲清楚。消息可以重复，进程可以退出，但同一个申请不能凭空变成两笔订单。

实验结束后执行：

~~~bash
docker compose down
~~~

保留数据卷和本地凭证，之后可以重新启动复查。确认不要实验数据时才执行 `docker compose down -v`，不要只删密码却继续复用旧 MySQL 数据卷。

相关文档：[Kafka Docker 镜像](https://kafka.apache.org/41/getting-started/docker/)、[Kafka 配置](https://kafka.apache.org/41/configuration/)、[Spring Kafka 异常处理](https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html)。
