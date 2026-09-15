---
title: 从 Docker Compose 到 Kubernetes：把订单微服务部署起来
published: 2025-04-22
updated: 2026-09-14
description: 只用过 Docker，为什么还要学 Kubernetes？从手动管理容器的问题讲起，弄懂集群、Pod、Deployment 和 Service，再动手部署、扩容、更新订单微服务。
category: 开发实践
tags:
  - Docker
  - Kubernetes
  - Java
  - 微服务
draft: false
---

> 2026 年 9 月 14 日更新：补充 kind 实验环境、完整部署文件和配套源码。实验固定版本，不依赖某个镜像的 latest 标签。这里的 kind 指 Kubernetes IN Docker，是用 Docker 创建本地 Kubernetes 集群的工具。

上一篇把[订单、库存、支付拆成了独立服务](/posts/architecture-demo/)。每个服务一个 jar、一个镜像，用 Compose 启动，已经能下单付款。

这篇先不写配置。先弄清楚：Docker 已经能跑应用了，Kubernetes 到底多管了什么？

先把整篇文章的路线说清楚。你可以把它看成一次“把 `docker run` 交给一个管理系统”的练习：

~~~text
1. 用 Docker 跑 hello，确认程序和镜像没有问题
2. 用 kind 创建一套本地 Kubernetes，作为实验场
3. 告诉 Kubernetes：hello 要运行两个实例
4. 给两个实例一个固定的访问名字
5. 删除一个实例，看它自动补回来
6. 发布 v2，观察新旧版本如何替换和回滚
7. 最后把订单、库存、支付、网关四个真实 jar 放进去
~~~

每一步只解决一个问题。文中的 YAML 不是程序代码，也不是要安装的新软件，它只是写给 Kubernetes 的“运行说明书”。`kubectl apply -f 文件.yaml` 的意思是：把这份说明书交给 Kubernetes，请它按说明运行。

## 先记住这四个词

第一次接触 K8s，不需要先背完整术语表。本文只反复用到四个对象：

| 词 | 先把它理解成 | 它解决什么问题 |
| --- | --- | --- |
| Pod | 一个应用实例 | Kubernetes 实际运行容器的地方 |
| Deployment | 实例管理员 | 记住要运行几个实例、使用哪个版本，并在数量不对时补回 |
| Service | 固定的访问门牌 | 让调用方不用记每个 Pod 会变化的 IP |
| ConfigMap | 普通配置文件 | 给容器传入地址、开关、文字等非敏感配置 |

它们的关系可以先只看这一张图：

~~~text
Deployment（我要两个 hello 实例）
        ↓ 创建并管理
Pod A（hello 容器）   Pod B（hello 容器）
        ↑ Service（固定名字 hello，把请求转给可用 Pod）
~~~

后面看到 `replicas`，想到“实例数量”；看到 `image`，想到“用哪个镜像”；看到 `selector`，想到“Service 或 Deployment 按什么标签找到 Pod”。先有这张地图，再看配置会容易很多。

## 一、Docker 已经能跑了，为什么还要 Kubernetes

### 1.1 启动一个容器，只是第一步

先看库存服务。打包 jar，构建镜像，再用 Docker 启动容器，它就能处理请求。

这里的**镜像是打包好的程序和运行环境，容器是用镜像启动出来的运行实例**。同一个库存镜像，可以启动两个互相独立的容器。

服务上线后，还会遇到这些事：

| 发生了什么 | 接下来要有人做什么 |
| --- | --- |
| 一个库存进程退出了 | 把它重新启动 |
| 两个实例中有一个被删了 | 再创建一个，补回两个 |
| 一台服务器坏了 | 在其他可用服务器上启动替代实例 |
| 要发布 v2 | 启动新版本，确认能接请求，再逐步停旧版本 |
| 实例换了，IP 也变了 | 更新请求去向，别继续访问旧地址 |

Compose 的 `restart` 策略可以处理容器退出，`docker compose up --scale` 也能增加实例，不是这些事情只有 Kubernetes 能做。但普通 Compose 主要管理一台机器上的容器，不会自动把坏机器上的应用搬到另一台机器。发布、健康检查、流量切换等环节，也需要结合其他工具安排。

服务少、一台机器够用、能接受短暂停机，继续用 Compose 完全可以。这里学习 Kubernetes，是为了理解应用多起来以后，怎样把这些运行管理工作交给一个系统持续处理。

### 1.2 Kubernetes 管的是“应用应该怎样运行”

**Kubernetes 是管理容器化应用运行的系统，简称 K8s。** 中间省略了 8 个字母，并不是另一个软件。

比如我希望库存服务这样运行：

> 使用库存 v1 镜像，保持两个实例；只有能接请求的实例才接流量。

把这个要求交给 Kubernetes 后，它会持续检查现实是不是符合要求：

~~~text
我要求两个实例 → 现在没有 → 创建两个
我仍要求两个   → 少了一个 → 补一个
我改为三个     → 现在两个 → 再加一个
我改用 v2      → 现在是 v1 → 按更新规则逐步替换
~~~

这就是后面反复提到的**期望状态**：配置写的是“我要什么结果”，Kubernetes 负责持续向这个结果调整。不是执行完启动命令就不管了。

它也不是无条件自愈。镜像写错了，它拉不到；机器内存不够，它放不下；程序一启动就报错，它反复重启也修不好代码。跨机器补实例还得有其他可用节点、足够资源和可访问的数据。Kubernetes 负责执行与报告状态，不能凭空创造这些条件。

### 1.3 它和 Java、Docker、Nacos 是什么关系

原来的链路仍然是：

~~~text
Java 代码 → jar → 容器镜像 → 运行中的容器
~~~

Kubernetes 接手的是最后一段：在哪运行、运行几个、如何替换、怎样提供访问入口。**不需要先往 Java 项目引入一个 Kubernetes 依赖。** 本篇也不修改下单、扣库存和支付逻辑。

- Docker 仍用来构建镜像。Kubernetes 不负责把源码编译成镜像。
- Dubbo 仍负责业务服务之间的 RPC 调用。Kubernetes 不会帮你调用 Java 方法。
- Nacos 仍按上一篇的配置提供注册发现和配置管理。应用搬了位置，不代表这些依赖自动消失。

单体应用一样可以部署到 Kubernetes；微服务也不一定要用它。这是部署管理方式的变化，不是又一次拆业务。

下面先用一个小 HTTP 服务练习。只返回版本号和实例名，扩容、替换之后发生了什么，一眼能看到。把这个过程走通，再搬订单项目，避免第一次就同时排查数据库、注册中心和容器启动问题。

## 二、先用 Docker 跑一个能看见变化的服务

[下载配套源码和部署文件](/downloads/architecture-k8s-demo.zip)。解压后进入 `architecture-demo`，后面的命令都从这里执行。压缩包不带 jar、数据库密码和集群访问凭证，需要自己构建。

`k8s/hello/server.py` 是一个没有第三方依赖的 Python HTTP 服务，返回这样的内容：

~~~json
{"version":"v1","pod":"某个容器名","message":"hello from Docker","ready":true}
~~~

`version` 用来观察发布，`pod` 取自容器内的主机名，用来区分实例；这个字段在 Docker 下也会返回。`message` 是可配置的文本，`ready` 表示是否准备好接请求。这里只关心部署，不要求先学 Python。

Dockerfile 如下，仍是熟悉的“基础镜像、复制代码、启动进程”：

~~~dockerfile
FROM python:3.11-slim-bookworm
ARG APP_VERSION=v1
ENV APP_VERSION=${APP_VERSION}
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY server.py .
USER 10001:10001
EXPOSE 8080
CMD ["python", "server.py"]
~~~

`APP_VERSION` 在构建时传入，之后构建 v2 时只改它。先确认 Docker 已经启动，再构建并运行：

~~~bash
docker info
docker build --build-arg APP_VERSION=v1 -t architecture-hello:v1 k8s/hello
docker run --rm -d --name architecture-hello-local \
  -p 127.0.0.1:18088:8080 architecture-hello:v1
curl -sS http://127.0.0.1:18088/
docker stop architecture-hello-local
~~~

看到返回的 `version` 为 `v1`，就说明镜像能正常运行。最后一条命令停止这个临时容器，`--rm` 会将它删除，但镜像还在，下一步继续用。

`EXPOSE 8080` 不会自动开放宿主机端口，真正做映射的是 `-p`。同样，后面 YAML 里的 `containerPort` 也不是宿主机端口映射。

## 三、给 Kubernetes 准备一个实验环境

### 3.1 集群、节点，是哪些东西

刚才 Docker 在你的电脑上启动了容器。如果换成 Kubernetes 管理，得先有一套正在运行的 Kubernetes 环境，这就是**集群**。

集群里纳入管理的机器叫**节点（Node）**，可以是物理机，也可以是虚拟机。负责管理的部分叫**控制平面（control plane）**：接收“我要两个实例”的要求，安排运行位置，检查是否需要补建。节点上的程序再负责真正启动和管理容器。

通常生产环境会有多台机器。本篇不需要租几台服务器，用 **kind（Kubernetes IN Docker）** 就可以在现有 Docker 中搭一个本地 Kubernetes 实验集群。

kind 不是 Kubernetes 本身，也不是新的容器运行时。它更像一个“搭建实验环境的工具”：调用你已经安装的 Docker，创建一个或多个 Docker 容器，把这些容器当作 Kubernetes 节点，再在节点里启动 Kubernetes。实验结束后可以直接删除整个集群，适合学习、开发和自动化测试，不适合拿来模拟真正的多机器生产高可用。

~~~text
你的电脑或实验服务器
└── Docker
    └── kind 创建的节点容器
        ├── Kubernetes 管理组件
        └── 后面要部署的应用实例
~~~

因此，本篇的“单节点集群”不是多机高可用环境。电脑关了，这个实验也会一起停。

### 3.2 各个工具负责哪一步

主要看源码中新增的 `k8s/`：

~~~text
architecture-demo/
├── order-service/、inventory-service/、payment-service/、gateway-service/
└── k8s/
    ├── kind.yaml           实验集群
    ├── namespace.yaml      实验使用的命名空间
    ├── hello/              第一个小服务、Dockerfile、部署文件
    ├── infra/compose.yaml  集群外的专用 MySQL 和 Nacos
    ├── apps/               四个业务应用的部署文件
    └── scripts/            构建、初始化、部署和验证脚本
~~~

需要 Docker、kind、kubectl、Python 3、OpenSSL；后半篇构建 Java 项目还要 JDK 17 和 Maven。建议给 Docker 留出至少 4 核、6 GiB 可用内存，磁盘预留 10 GiB。只跑小服务可以少一些。

三个工具不要混淆：

| 工具 | 这次用来干什么 |
| --- | --- |
| Docker | 构建镜像，以及运行 kind 的节点容器 |
| kind | 用 Docker 容器搭一个本地 Kubernetes 集群 |
| kubectl | Kubernetes 的命令行客户端，用它提交部署要求、查看应用状态 |

本例固定 kind **v0.33.0**、节点镜像 **Kubernetes v1.35.8**，节点镜像在脚本里锁定 SHA-256。kubectl 使用同版本，或官方支持的相邻一个次版本，不要拿差好几个版本的客户端直接照抄。

安装参考 [kind quick start](https://kind.sigs.k8s.io/docs/user/quick-start/) 和 [kubectl 安装说明](https://kubernetes.io/docs/tasks/tools/)。二进制要选操作系统和 CPU 架构，Apple Silicon 不要选 Linux amd64。本文没有要求在电脑上安装一套生产集群。

安装后检查工具版本：

~~~bash
kind version
kubectl version --client
~~~

### 3.3 创建集群，再确认连的是它

这一步只准备运行环境，还没有部署 hello：

~~~bash
bash k8s/scripts/create-cluster.sh
export KUBECONFIG="$PWD/target/kubeconfig"
kubectl --context kind-architecture-lab get nodes
~~~

`get nodes` 是查看节点。应看到一个名为 `architecture-lab-control-plane`、状态为 `Ready` 的节点，表示实验环境已准备好。

脚本使用的 `kind.yaml` 描述的是“怎样创建实验集群”，不是应用的部署配置：

~~~yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
networking:
  apiServerAddress: "127.0.0.1"
~~~

`nodes` 下只有一项，所以只创建一个节点；`control-plane` 表示它承担管理工作。`apiServerAddress` 把管理接口绑定在本机回环地址，不直接开放公网访问。

节点内真正运行应用容器的是 **containerd**，可以先把它理解为负责启动、停止容器的程序。宿主机 Docker 运行 kind 节点，节点里的 containerd 再运行应用容器，两者不是同一个镜像存储。后面需要装入镜像，原因就在这里。

`target/kubeconfig` 保存集群地址和访问凭证。每开一个终端，都在项目根目录重新执行上面的 `export KUBECONFIG=...`。它不能提交到 Git，也不要发给别人。

一个 kubectl 客户端可以连接不同环境。**context 是连接设置的名称**，本例固定用 `kind-architecture-lab`，避免误操作其他集群。

**namespace（命名空间）是集群内给资源分组的范围**。脚本已经创建 `order-lab`，后面的应用、配置都放进去，便于一起查找。它本身不等于网络隔离。

下面先定义一个少打字的函数：

~~~bash
k() { kubectl --context kind-architecture-lab -n order-lab "$@"; }
k get pods
~~~

`k get pods` 就是查看这组应用实例，现在显示 `No resources found` 是正常的。新终端需要重新设置 `KUBECONFIG` 并定义函数。后文的 `k` 不是额外安装的工具。

## 四、把同一个镜像交给 Kubernetes

### 4.1 本机有镜像，节点不一定有

先把镜像装进 kind 节点：

~~~bash
kind load docker-image --name architecture-lab architecture-hello:v1
~~~

宿主机 Docker 和 kind 节点里的 containerd 使用不同的镜像存储。省略这一步，Kubernetes 会尝试去镜像仓库拉 `architecture-hello:v1`，当然找不到你刚在本机构建的文件。

生产环境通常把镜像推到仓库，由节点拉取。`kind load` 只是本地实验的省事办法。

### 4.2 我想运行两个容器，为什么先讲 Pod

Kubernetes 不直接以一个裸容器作为部署单位，而是把容器放在 **Pod** 里。Pod 可以包含多个紧密协作的容器，它们共享网络等资源；本例每个 Pod 只放一个 hello 容器，先把它理解为一个应用实例就够了。

因此，运行两个 hello 实例，就是创建两个 Pod。不是在一个 Pod 里塞两个相同的 hello 容器，也不是把订单、库存、支付全塞进同一个 Pod。

不过，直接创建两个 Pod 还不够。Pod 被删除后，谁记得“应该有两个”？我们需要另一个对象保存这个要求，它叫 **Deployment**，负责声明应用的镜像、副本数量和更新方式。

~~~text
Deployment：hello 用哪个镜像、要几个实例、怎样更新
    ↓ 管理
ReplicaSet：维持对应版本的副本数量
    ↓ 创建
Pod：一个 hello 实例，里面运行一个容器
~~~

ReplicaSet 是 Deployment 自动管理的中间一层，现在不需要单独写它。以后看到 `get replicasets` 的输出，知道它不是又一个业务服务即可。

### 4.3 先准备应用需要的配置

Docker 下可以用 `-e MESSAGE=...` 传环境变量。这里把非敏感配置单独放在 **ConfigMap** 对象中，再让应用引用它，这样不必为修改一句文本重新构建镜像。

`k8s/hello/config.yaml`：

~~~yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hello-config
  namespace: order-lab
data:
  MESSAGE: "hello from Kubernetes"
~~~

第一次看这种 YAML，可以先读懂外层：

| 字段 | 表示什么 |
| --- | --- |
| `apiVersion` | 这类对象使用哪个 Kubernetes API 版本，不是应用版本 |
| `kind` | 对象类型，这里是保存配置的 ConfigMap |
| `metadata.name` | 对象名称，后面通过 `hello-config` 引用它 |
| `metadata.namespace` | 放在哪个命名空间 |
| `data` | 实际保存的配置项 |

文件名可以叫 `config.yaml`，对象名仍然是 `hello-config`，引用时看的是对象名。文件里的 `kind` 字段也不是前面安装的 kind 工具，两者只是同名。

### 4.4 用 Deployment 写下运行要求

现在把“用 v1 镜像、保持两个实例、读取刚才的配置”写成 YAML。`k8s/hello/deployment.yaml` 中最重要的部分如下，探针和资源设置暂时省略，实际操作使用下载包中的完整文件：

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
  namespace: order-lab
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello
  template:
    metadata:
      labels:
        app: hello
    spec:
      containers:
        - name: hello
          image: architecture-hello:v1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: hello-config
~~~

这里的 `kind` 换成了 `Deployment`，`spec` 中写它的期望状态：

| 配置 | 对应刚才的哪项要求 |
| --- | --- |
| `replicas: 2` | 保持两个 Pod |
| `template` | 每次创建 Pod 都按这个模板来 |
| `containers[].image` | 使用我们刚才构建的 v1 镜像 |
| `containerPort: 8080` | 声明容器里应用监听的端口，不会映射到电脑 |
| `envFrom.configMapRef` | 读取 `hello-config`，将配置注入环境变量 |

`labels` 是贴在对象上的键值标签，例如 `app: hello`。`selector` 是按标签选对象的条件。这里表示“管理带 `app: hello` 标签的 Pod”，所以 selector 与 template 中的 labels 必须对应。标签不是启动参数，也不是 DNS 地址。

`imagePullPolicy: IfNotPresent` 表示节点已有该镜像就使用本地镜像，没有再拉。不要反复覆盖同一个 v1 标签后指望节点自动更新：每次发布使用新标签，正式发布最好锁定镜像摘要。

现在只提交已经看懂的配置和 Deployment，访问入口下一节再加：

~~~bash
k apply -f k8s/hello/config.yaml
k apply -f k8s/hello/deployment.yaml
k rollout status deployment/hello --timeout=120s
k get deployment,replicaset,pod
~~~

`apply -f` 把文件中的配置交给集群，第一次创建对象，后续可用同一命令更新。`rollout status` 等待这次部署就绪，`get` 查看现状。**文件在你电脑上，负责持续维持副本的是集群中的管理组件，不是这个终端。** 关掉终端不会停止已经部署的应用。

应看到一个 Deployment、一个 ReplicaSet 和两个 Pod。Pod 名字类似 `hello-一段哈希-随机后缀`，每个 Pod 的 `READY` 应为 `1/1`，表示它里面唯一的容器已就绪；Deployment 的 `READY` 应为 `2/2`。不要把 Pod 的 `1/1` 误认为整个应用只有一个实例。

### 4.5 配置改了，进程为什么没变

新启动的 hello 会读到 `hello from Kubernetes`。但后续如果修改 ConfigMap，**不会改掉已运行进程的环境变量**。例如修改文件里的 MESSAGE 后，除提交配置外，还需要让 Deployment 替换 Pod：

~~~bash
k apply -f k8s/hello/config.yaml
k rollout restart deployment/hello
k rollout status deployment/hello --timeout=120s
~~~

配置以文件挂载时，更新行为又不同，应用也未必会重新读取。不要把 ConfigMap 理解成自动热更新框架。

## 五、有两个 Pod，访问哪个地址

### 5.1 给它们一个稳定的入口

应用已经运行，但还没有像 `docker run -p` 那样给你的电脑开放端口。先解决另一个问题：集群里的其他应用，该怎样访问这两个实例？

每个 Pod 有自己的 IP，但 Pod 被替换后，IP 可能变化。我们不想让调用方追着这些地址改配置，所以创建一个 **Service**：给一组 Pod 提供稳定的名字和访问入口，再把请求转发到可用的后端。

这里的 Service 是 Kubernetes 的网络对象，不是 Java 的 `@Service`，也不是另外启动了一个 hello 进程。**Deployment 管“实例怎么运行”，Service 管“请求怎么找到实例”。**

~~~text
集群内的调用方 → hello 这个固定入口 → hello Pod A:8080
                                  → hello Pod B:8080
~~~

`k8s/hello/service.yaml`：

~~~yaml
apiVersion: v1
kind: Service
metadata:
  name: hello
  namespace: order-lab
spec:
  selector:
    app: hello
  ports:
    - name: http
      port: 80
      targetPort: 8080
~~~

这个 Service 通过标签找到 hello 的 Pod。调用方访问 Service 的 80 端口，流量再去 Pod 的 8080。

提交并查看它：

~~~bash
k apply -f k8s/hello/service.yaml
k get service hello
~~~

默认类型是 `ClusterIP`，即集群内部入口。输出里的 `CLUSTER-IP` 不是公网 IP，`80/TCP` 也不表示你的电脑已经开放了 80 端口。

同 namespace 的应用可以访问 `http://hello/`；跨 namespace 可以用 `hello.order-lab.svc.cluster.local`。这个域名由集群 DNS 解析，不是公网域名。

Deployment 和 Service **不是根据同名自动关联**，关联看的是 selector 和 Pod labels。名字一样、标签写错，照样没有后端。

### 5.2 先在电脑上看一眼

现在想在电脑上 curl，又暂时不配置正式的外部入口，可以用 `port-forward` 建立一条“电脑端口到集群内应用”的临时通道。开一个终端，保持运行：

~~~bash
k port-forward service/hello 18088:80 --address=127.0.0.1
~~~

另一个终端执行：

~~~bash
curl -sS http://127.0.0.1:18088/
~~~

`port-forward` 是临时调试通道。即使目标写的是 Service，它也会选择其中一个 Pod 建立转发，**不能靠反复 curl 这个端口证明 Service 做了负载均衡**。所选 Pod 被替换后，转发还可能断开，需要重新启动命令。

### 5.3 从集群里访问，才是在验证 Service

借一个 hello Pod 当客户端：

~~~bash
POD=$(k get pod -l app=hello -o jsonpath='{.items[0].metadata.name}')
k exec "$POD" -- python -c '
import json, urllib.request
for attempt in range(10):
    with urllib.request.urlopen("http://hello/") as response:
        print(json.load(response)["pod"])
'
~~~

应该有机会看到两个不同的 Pod 名。请求不会保证严格轮流分配，连接复用也会影响观察。这个例子每次重新建立 HTTP 连接。

`exec` 是进入已有 Pod 的容器执行命令，和 `docker exec` 很像；前面的 `--` 用来分隔 kubectl 参数和容器中的命令。

## 六、删掉一个 Pod，会怎样

现在验证开头的承诺：“要求两个实例，少了就补。”我们删除其中一个 Pod，不改 Deployment 里的目标数量：

~~~bash
POD=$(k get pod -l app=hello -o jsonpath='{.items[0].metadata.name}')
k delete pod "$POD"
k get pods -l app=hello -w
~~~

会出现一个新名字的 Pod。Deployment 对应的 ReplicaSet 发现副本少了一个，重新创建 Pod，最终恢复为两个。

按 Ctrl+C 退出观察，不会停止应用。

这和“容器里的进程退出，kubelet 重启这个容器”不是同一件事：前者 Pod 的 UID 变了，后者可能仍是原 Pod，只是 `RESTARTS` 增加。

也不要删 Deployment 来验证自愈。删 Pod 是破坏某个实例；删 Deployment 是告诉 Kubernetes 你不再需要这项工作负载。

扩容则直接修改目标数量：

~~~bash
k scale deployment/hello --replicas=3
k rollout status deployment/hello --timeout=120s
k get pods -l app=hello
k scale deployment/hello --replicas=2
~~~

这里的扩容是手动的，不是 CPU 高了自动扩。自动扩缩容是 HPA 的工作，通常还需要 Metrics Server，本篇暂不安装。

另外，命令行改成 3 不会修改磁盘上的 YAML。文件还写着 2，下次 apply 又会回到 2。需要长期保留的设置，记得改文件。

## 七、进程活着，不等于可以接请求

假设 Java 进程已经启动，但还在初始化，马上转发请求过去就可能报错。也可能进程没退出，却已经卡住了。Kubernetes 不懂业务代码，需要应用提供检查方式，才能区分这些情况。

**探针就是 Kubernetes 定期对容器做的检查。** 本例让它请求应用的 HTTP 接口：`/ready` 判断能否接请求，`/health` 判断进程是否健康。接口由应用实现，不是写上 YAML 就自动生成。

完整 Deployment 有三种探针，它们对应的动作不同：

| 探针 | 失败后主要发生什么 |
| --- | --- |
| startupProbe | 启动阶段连续失败超过阈值，重启容器；成功前不执行另两类探针 |
| readinessProbe | Pod 变为未就绪，通常不再作为 Service 的正常流量后端；不因此重启 |
| livenessProbe | 连续失败超过阈值，重启容器 |

hello 的 readiness 配置：

~~~yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 2
  failureThreshold: 1
~~~

程序发现 `/tmp/not-ready` 文件存在，就让 `/ready` 返回 503，但 `/health` 继续返回 200。可以只让一个实例退出接流，而不结束进程：

~~~bash
POD=$(k get pod -l app=hello -o jsonpath='{.items[0].metadata.name}')
k exec "$POD" -- touch /tmp/not-ready
k get pods -l app=hello
k get endpointslices -l kubernetes.io/service-name=hello -o yaml
~~~

稍等探针生效，其中一个 Pod 的 READY 变为 `0/1`。EndpointSlice 记录 Service 后端的地址和就绪状态，此时应看到一个端点 `ready: false`。它不一定从列表中消失。

再从集群里请求 `http://hello/`，就绪后端应只剩另一个实例。恢复：

~~~bash
k exec "$POD" -- rm /tmp/not-ready
~~~

修改路由需要传播时间，既有连接也不一定立刻断开，所以不要把 readiness 当作瞬时切断所有请求的开关。

**liveness 不宜检查所有下游是否正常。** 数据库短暂不可用，如果所有应用都因为 liveness 失败反复重启，反而更难恢复。业务服务通常把“自己是否活着”和“是否能接这类请求”分开判断。

## 八、更新镜像和回滚

原来发布可能是“停掉旧容器，再启动新容器”，中间会有空档。这次希望先启动一部分新实例，确认就绪，再逐步替换旧实例，这叫**滚动更新**。应用仍然需要兼容新旧版本短暂共存。

构建一个 v2，不修改 v1：

~~~bash
docker build --build-arg APP_VERSION=v2 -t architecture-hello:v2 k8s/hello
kind load docker-image --name architecture-lab architecture-hello:v2
k set image deployment/hello hello=architecture-hello:v2
k rollout status deployment/hello --timeout=120s
~~~

`hello=...` 左边是容器名，不是 Service 名。Deployment 的 Pod 模板改变后，会创建新 ReplicaSet，逐步替换旧 Pod。

完整文件里的更新策略是：

~~~yaml
minReadySeconds: 3
progressDeadlineSeconds: 120
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
~~~

目标两个副本，更新时允许额外创建一个新 Pod；尽量不减少已有可用副本。新 Pod 连续就绪至少三秒，才计入可用副本。

因此要给发布留出额外资源。机器刚好只能放下两个实例，设置了“不允许减少旧实例、先启动一个新实例”，发布就可能一直卡在 Pending。

从集群内重新请求 hello，应读到 v2。发布记录可以这样看：

~~~bash
k rollout history deployment/hello
~~~

故意使用不存在的版本：

~~~bash
k set image deployment/hello hello=architecture-hello:missing
k get pods -l app=hello
k rollout status deployment/hello --timeout=120s
~~~

新 Pod 会出现 `ErrImagePull` 或 `ImagePullBackOff`；这份策略下，旧的可用 v2 Pod 应继续保留。`rollout status` 超时退出，不等于 Kubernetes 自动回滚。

主动回滚：

~~~bash
k rollout undo deployment/hello
k rollout status deployment/hello --timeout=120s
~~~

这次回到的是紧邻失败发布之前的 **v2**，不是最早的 v1。回滚恢复的是 Pod 模板，也不会撤销已经执行的数据库变更。

探针、滚动策略可以降低中断风险，但不是零错误承诺。真正发布业务还要考虑请求排空、SIGTERM、注册中心摘除、连接复用和接口兼容。

## 九、再把订单微服务搬进来

### 9.1 这次搬什么，不搬什么

hello 已经跑通，换成 Java 应用时，部署单位没有变化：一个服务对应自己的 Deployment，每个 Pod 运行该服务镜像里的 jar。不是在一个 Pod 中启动四个 jar。

从上一篇的 Compose 配置迁过来，可以按用途对照，而不是逐行翻译 YAML：

| Compose 里做的事 | 本次 Kubernetes 中放在哪里 |
| --- | --- |
| `build` 构建镜像 | 仍在部署前用 Maven、Docker 构建，再装入节点 |
| `image`、应用启动参数 | Deployment 的容器配置 |
| `environment` | 普通配置放 ConfigMap，Deployment 引用 |
| 数据库密码文件 | Secret，再作为只读文件挂到容器 |
| 运行几个实例 | Deployment 的 `replicas` |
| 应用间的固定访问名称 | 按实际调用方式使用 Service 或原有 Nacos 注册发现 |
| `ports` 供电脑调试 | 本篇使用临时的 `port-forward`，不是等价端口映射 |

Secret 是 Kubernetes 保存密码等敏感数据的对象；用途和 ConfigMap 不同，但也需要正确设置访问权限，不能因为叫 Secret 就当成保险箱。

进入集群的是网关、订单、库存、支付四个应用，仍然使用上一篇的独立 jar。新建一套专用 MySQL、Nacos，继续由 Compose 运行，但接到 kind 的 Docker 网络。

原来的 Compose 项目和数据库不动。两套环境虽然使用相同的示例库名，连接的是不同 MySQL 实例。

到这里再看完整实验拓扑，MySQL、Nacos 在集群外，业务 Pod 在集群内：

![kind、Pod、Service 与集群外数据库的关系](/assets/images/docker-to-kubernetes/topology.svg)

保留 Nacos 的原因是业务代码原本就依赖它：

~~~text
访问业务接口
    → gateway
    → Nacos 中登记的 orders HTTP 地址
    → orders 用 Dubbo 调用 inventory / payment
    → 各自的 MySQL 示例库
~~~

Kubernetes Service 能提供稳定的网络入口，但不会替你实现 Java RPC，也不会让现有 `@DubboReference` 自动改用它。本次订单到库存的业务调用仍按 Nacos 返回的提供者地址直连；不是先经过 inventory 的 Kubernetes HTTP Service。

后者主要用于调试。Nacos 的配置中心功能也继续保留，别把“有了 Service”理解成“可以删掉全部 Nacos 依赖”。

### 9.2 建立专用基础设施，生成密码

先准备数据库和注册中心，再启动依赖它们的应用。这个脚本会新建专用容器、生成密码，并让集群里的应用能通过固定名称访问它们：

~~~bash
bash k8s/scripts/infra.sh
~~~

脚本做四件事：

1. 随机生成 `secrets/k8s_mysql_password`，已有文件不覆盖。
2. 启动专用 MySQL、Nacos，使用独立的具名数据卷，不开放宿主机端口。
3. 把密码文件创建为 `order-lab` 中的 Secret。
4. 建立访问基础设施的 Service，并写入 Nacos 初始配置。

Secret 的创建等价于：

~~~bash
k create secret generic mysql-auth \
  --from-file=mysql_password=secrets/k8s_mysql_password
~~~

实际脚本支持重复执行，所以用了 `--dry-run=client -o json | kubectl apply -f -`。没有把密码常量塞进 YAML，也不会输出密码。

**Secret 不是“放进去就自动加密安全”。** YAML 里的 base64 只是编码。生产集群还要配置访问权限、静态加密或外部密钥管理，不能让所有人都能读取 Secret。

本例的基础设施连接有一个 kind 专用安排：脚本读取两个容器在 `kind` 网络中的 IP，为无 selector 的 mysql、nacos Service 创建 EndpointSlice。Pod 仍然用 `mysql:3306`、`nacos:8848` 访问。

这是让本地实验跨过集群边界的连接办法，不是生产数据库发现方案。容器重建后 IP 可能变化，要重新运行 `infra.sh` 刷新端点；它也会把 Nacos 教学配置恢复默认值。

Nacos 2 客户端除了 8848，还需要 9848。只通控制台端口，客户端仍可能连不上。本文使用无鉴权单机 Nacos，仅限隔离实验网络，不要直接暴露公网。

### 9.3 普通配置和密码分别挂进去

业务程序需要两类输入：数据库地址等普通设置，以及数据库密码。前者继续用 ConfigMap 注入环境变量；后者不写进镜像，而是把 Secret 中的数据以只读文件形式放进容器。

`k8s/apps/config.yaml` 中是非敏感连接设置：

~~~yaml
data:
  ARCH_BIND: "0.0.0.0"
  ARCH_PORT: "8080"
  ARCH_DB_HOST: "mysql"
  ARCH_DB_PORT: "3306"
  ARCH_DB_USER: "root"
  ARCH_DB_PASSWORD_FILE: "/run/app-secrets/mysql_password"
  NACOS_ADDR: "nacos:8848"
  JAVA_TOOL_OPTIONS: "-Xms64m -Xmx256m -XX:ActiveProcessorCount=2"
~~~

这是 ConfigMap 的 data 节选，完整文件包含 apiVersion、kind、metadata。数字也加引号，因为这里存的是字符串。

以订单 Deployment 为例，除了镜像名称，新增的是这两种配置来源：

~~~yaml
envFrom:
  - configMapRef:
      name: app-config
volumeMounts:
  - name: mysql-auth
    mountPath: /run/app-secrets
    readOnly: true
~~~

同一个 Pod 的 `spec.volumes` 对应声明：

~~~yaml
volumes:
  - name: mysql-auth
    secret:
      secretName: mysql-auth
~~~

Secret 的 key 叫 `mysql_password`，所以容器里出现 `/run/app-secrets/mysql_password`。Java 继续通过原有的 `ARCH_DB_PASSWORD_FILE` 读取它，不需要修改业务代码。

这里实际踩了一次挂载目录冲突。最初照搬 Compose，把 Secret 只读挂在 `/run/secrets`；容器始终重启，`logs` 却没有应用输出。`describe pod` 中才看到：

~~~text
Reason: StartError
... /var/run/secrets/kubernetes.io/serviceaccount ...
read-only file system
~~~

Kubernetes 默认会把访问 API 的 ServiceAccount 凭证挂到 `/var/run/secrets/kubernetes.io/serviceaccount`。这个镜像中的 `/var/run` 指向 `/run`，而父目录已经被我们的只读 Secret 覆盖，运行时就无法建立默认挂载点。Java 尚未启动，所以没有 Java 日志。

修复是让业务密码使用独立的 `/run/app-secrets`。此外，这些应用不调用 Kubernetes API，因此在 Pod 的 spec 中设置了 `automountServiceAccountToken: false`，不向它们注入用不到的 API 凭证。这个选项不是所有应用都能照抄，需要访问集群 API 的程序应另行配置权限。

网关不挂这个 Secret，因为它不连接数据库。为了减少教学配置，三个业务应用暂用专用实验 MySQL 的 root 账号；生产环境应拆成最小权限账号。

### 9.4 打包、装入节点、部署

~~~bash
bash k8s/scripts/build-images.sh
bash k8s/scripts/deploy-apps.sh
~~~

第一条先执行 Maven，再为每个应用构建不同镜像，并逐个 `kind load`。例如库存的核心命令是：

~~~bash
docker build -t architecture-inventory:k8s-v1 inventory-service
kind load docker-image --name architecture-lab architecture-inventory:k8s-v1
~~~

第二条按库存、支付、订单、网关的顺序提交 YAML，等待各个 Deployment 就绪。这是教学脚本帮忙排的顺序，**Kubernetes 本身没有照搬 Compose 的 `depends_on`**。把所有 YAML 一起提交，不保证业务按文件顺序启动。

这里还有一个容易误判的地方：原 Demo 的 `/health` 只证明 HTTP 应用起来了，不会检查所有数据库/RPC 链路。因此 Pod 显示 Ready 后，还要测试订单的 `/rpc-health`，不能把绿灯当成完整业务验证。

### 9.5 真正下一单、付一次款

在两个终端分别保持端口转发：

~~~bash
k port-forward service/gateway 18180:8080 --address=127.0.0.1
~~~

~~~bash
k port-forward service/orders 18183:8080 --address=127.0.0.1
~~~

如果本机已经在运行上一篇 Compose 的这两个端口，改用空闲端口，并同步修改下面的 curl。不要为了省事把转发绑定到公网地址。

先检查 Dubbo 真正可调用：

~~~bash
curl -sS http://127.0.0.1:18183/rpc-health
~~~

应返回 inventory、payment 和 `transport: dubbo`。刚启动出现 503，先等注册传播完成；持续失败再看日志。

然后下一单：

~~~bash
curl -sS http://127.0.0.1:18180/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"k8s-1","userId":7,"sku":"SKU-A","quantity":2}'
curl -sS -X POST http://127.0.0.1:18183/drain

curl -sS http://127.0.0.1:18180/api/pay \
  -H 'Content-Type: application/json' -d '{"requestId":"k8s-1"}'
curl -sS -X POST http://127.0.0.1:18183/drain
curl -sS http://127.0.0.1:18180/api/orders/k8s-1
~~~

状态仍然是 `PENDING → RESERVED → PAY_PENDING → PAID`。`/drain` 是上一篇为观察 outbox 设计的手动处理入口，不是 Kubernetes 命令；搬进集群不会自动帮你消费待办。

刚初始化的数据库只做这一笔时，库存应为 98 / 0 / 2，支付一条。可以临时转发 inventory 的 8080 到 18184、payment 的 8080 到 18185，再查看它们的 `/snapshot`。

重建订单应用：

~~~bash
k rollout restart deployment/orders
k rollout status deployment/orders --timeout=180s
curl -sS http://127.0.0.1:18180/api/orders/k8s-1
~~~

待 Nacos 的实例列表更新后，已支付订单仍应能查询到。订单保存在外部 MySQL，不在这个 Pod 的容器文件系统里。

## 十、数据为什么还在，PVC 又是什么

前面的数据没有丢，靠的是 **MySQL 在集群外，并挂了 Docker 具名卷**。不是 Kubernetes 自动把 Pod 内所有文件都备份了。

如果把 MySQL 搬进集群，就需要另行处理持久化：

| 对象 | 先这样理解 |
| --- | --- |
| PVC | 应用提交的存储申请，例如容量、访问模式 |
| PV | 集群中实际提供给应用使用的存储资源 |
| StorageClass | 定义如何提供或动态创建存储 |
| StatefulSet | 管理需要稳定身份、存储关联的应用实例 |

**StatefulSet 不等于数据库高可用，PVC 也不等于备份。** MySQL 主从、复制、备份、恢复还需要数据库自身的方案。

kind 的本地存储尤其不要当成正式存储：卷落在节点容器里，删掉 kind 集群，相关数据可能一起消失。多个 kind 节点也都在同一台机器上，不能证明跨机器容灾。

本篇先不迁数据库。等应用部署流程熟悉，再单独做数据库和存储实验，更容易判断每次数据到底存在哪里。

## 十一、出问题先查什么

我一般先看 Pod 状态，再看事件，最后读应用日志，别一上来就重装整个集群。

~~~bash
k get pods -o wide
k describe pod <Pod名称>
k logs <Pod名称> --tail=100
k logs <Pod名称> --previous --tail=100
k get events --sort-by=.metadata.creationTimestamp
~~~

`--previous` 读的是同一个 Pod 中上一次退出的容器日志；Pod 已被删除时，这条命令不能凭空找回它的日志。

| 现象 | 优先检查 |
| --- | --- |
| Pending，提示 Insufficient memory/cpu | 节点资源是否足够，requests 是否过大，更新是否需要额外副本 |
| ImagePullBackOff | 镜像名、标签、仓库权限；本例是否执行 kind load |
| CreateContainerConfigError | ConfigMap、Secret 是否存在，namespace 和名称是否对应 |
| CrashLoopBackOff | 容器为什么退出；先看 logs --previous，而不是只调探针 |
| Running 但 0/1 Ready | readiness 路径、端口、应用实际返回值 |
| Service 没有后端 | selector 与 Pod labels，EndpointSlice 的就绪状态 |
| HTTP 正常但 Dubbo 不通 | Nacos 的 8848/9848、注册地址、group/version、提供者是否启动 |

资源配置也要看懂一点：

~~~yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 512Mi
~~~

`100m` 是 0.1 个 CPU 核的请求量；调度器主要按 requests 判断节点是否放得下。CPU limit 会限制 CPU 使用，内存超过限制可能被 OOM 杀掉。`requests` 不是性能保证，`limits` 也不是推荐的 JVM 堆大小。

Java 的 `-Xmx256m` 只限制堆，不包含元空间、线程栈、直接内存等。不要把容器内存 limit 也设成 256Mi，然后疑惑“堆明明没满，怎么被杀了”。

`kubectl top` 需要指标服务；kind 默认没有 Metrics Server，命令不可用不代表集群坏了。

## 十二、还没做的事

现在能部署和更新应用，但实验环境仍有明确边界：

- `port-forward` 只用于调试。正式 HTTP 入口还要配置 Gateway API 或 Ingress 及对应控制器、域名和 TLS；原来的 Spring Cloud Gateway 是应用网关，不会自动变成集群入口控制器。
- 四个业务应用默认各一个副本。hello 的双副本实验不能当成订单微服务已经完成高可用验证。
- Dubbo 的实例注册与摘除、优雅停机、请求排空还要联调。Kubernetes readiness 不会自动让 Nacos 同时摘掉同一实例。
- 库存超时后是否重复扣减、支付重试是否重复记账，仍靠上一篇的幂等与恢复设计。重启 Pod 不会修复业务事务。
- MySQL、Nacos、应用都在同一宿主机。宿主机宕机，整个实验仍会一起停。

先把部署、访问、扩容、更新、回滚、查日志这几件事做熟，再考虑 Helm、自动扩容和监控。不需要第一篇就把所有组件装齐。

## 实验与清理

配套脚本会重置**这套 Kubernetes 实验数据库**中的教学表，并更新、删除实验 Pod。先完成前文部署，并保证 v1、v2 两个 hello 镜像都已加载，再运行：

~~~bash
python3 k8s/scripts/verify.py
~~~

它检查 Pod 重建、Service 访问两个实例、未就绪端点退出接流、v2 更新、错误镜像回滚，以及经过网关和 Dubbo 的真实订单支付。全部通过才写入 `target/k8s-results.json`，留下 `k8s-review` 订单；不与前文手动操作同时执行。

2026-09-14 在 Linux amd64、kind v0.33.0、Kubernetes v1.35.8 上执行通过，原始记录也放进了下载包的 `k8s/verification-2026-09-14.json`：

| 实验 | 实际结果 |
| --- | --- |
| 删除一个 hello Pod | 换了一个 Pod UID，恢复两个就绪副本 |
| 集群内访问 hello Service 30 次 | 响应来自两个不同 Pod |
| 给一个 Pod 设置未就绪标记 | Pod 仍在，Service 就绪端点从 2 降到 1；移除标记后恢复 |
| v2 更新后发布不存在的镜像 | 两个 v2 端点保留，失败后手动回滚到 v2 |
| 网关 → 订单 → Dubbo 库存、支付 | PAID，库存 98 / 0 / 2，支付一条 |
| 重建订单 Pod | Pod UID 改变，原支付订单仍能查询 |

实验结束后先停止各终端的 port-forward。删集群前，先停止挂在 kind 网络上的专用基础设施：

~~~bash
docker compose -f k8s/infra/compose.yaml down
kind delete cluster --name architecture-lab
~~~

这里的 down 没有 `-v`，MySQL、Nacos 的具名卷和本地密码文件保留。下次创建集群后重新运行 infra.sh、部署应用即可。不要删除密码文件后继续复用旧 MySQL 数据卷。

到这里，再看最初那份 YAML：镜像还是那个镜像，变化在于谁负责维持实例、提供访问入口和安排版本替换。先弄清这一层，后面的 Kubernetes 配置就不再只是照着别人抄。
