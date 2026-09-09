---
title: Portainer 容器管理
published: 2025-01-10
updated: 2025-03-21
description: 安装 Portainer 管理面板，通过界面查看容器、镜像和存储卷。
category: NAS 与影音
tags:
  - Docker
draft: false
series: 从零搭建 NAS
seriesOrder: 2
---
<img src="/assets/svg/portainer.svg" alt="Portainer Logo" style="width: 200px;"/>

在[上一篇文章 Docker](/posts/1-docker/)中完成安装步骤后，可以开始着手第一个容器Portainer的部署 🚀。

<span id="🤔-为什么要使用-portainer" class="legacy-anchor" aria-hidden="true"></span>

### 🤔 为什么要使用 Portainer？

Portainer简单来说是一款Docker管理面板程序，相同的程序还有很多，例如[Docker UI](https://github.com/gohutool/docker.ui)和[Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)。之所以选择Portainer，只是因为这是第一款使用的管理面板程序，其次它的使用率确实比较高。它可以方便地管理Docker镜像和容器，即便个人对其功能的使用程度仍然很低。虽然`docker pull`、`docker start`以及`docker stop`命令已经非常方便了，但谁能拒绝鼠标点点就能操作的诱惑呢（笑）？当然，新手小白们还是推荐先使用命令熟悉Docker，至少要知道戳戳点点背后的命令究竟是哪一条，才能更深入地理解。

![Portainer UI](/assets/images/nas/portainer/portainer-ui.png)

<span id="📥-下载-portainer" class="legacy-anchor" aria-hidden="true"></span>

### 📥 下载 Portainer

首先访问[Docker Hub](https://hub.docker.com)，在上方搜索栏中搜索portainer-ce，下载的是Portainer的社区CE（Community Edition）版，它还有商业版可供选择 🛠️。

:::tip[提示]
如果没有登录Docker Hub，可能会转到登录页面，没有账号可以注册一个，毕竟后续会经常使用。
:::

![搜索Portainer CE镜像](/assets/images/nas/portainer/portainer-i-step-1.png)

点击图片中的搜索结果后会跳转到portainer-ce的详情页，阅读详情，其中指向了Portainer的官网文档，这里直接把链接po出来: [官方文档](https://docs.portainer.io/start/install-ce/server/docker)。根据自己的Docker安装方式选择具体选项。以下以[Install Portainer CE with Docker on Linux](https://docs.portainer.io/start/install-ce/server/docker/linux)为例。

<span id="🚀-安装-portainer" class="legacy-anchor" aria-hidden="true"></span>

### 🚀 安装 Portainer

首先为Portainer创建一个专属volume：
```bash
docker volume create portainer_data
```
然后在命令行中运行命令安装Portainer:
```bash
docker run -d -p 8000:8000 \
  -p 9443:9443 \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:2.21.5
```
该命令解析如下：
- `docker run`: 启动一个新的容器。
- `-d`: 以后台模式运行容器（分离模式）。
- `-p 8000:8000`: 将主机的8000端口映射到容器的8000端口。
- `-p 9443:9443`: 将主机的9443端口映射到容器的9443端口。此为访问portainer的https端口。
- `-p 9000:9000`: 将主机的9443端口映射到容器的9443端口。此为访问portainer的http端口。
- `--name portainer`: 给容器指定一个名称为“portainer”。
- `--restart=always`: 设置容器在退出时总是重启。
- `-v /var/run/docker.sock:/var/run/docker.sock`: 将主机的Docker套接字挂载到容器内，以便容器能够与Docker引擎进行通信。
- `-v portainer_data:/data`: 创建一个名为“portainer_data”的卷，并将其挂载到容器内的`/data`目录，用于持久化存储数据。
- `portainer/portainer-ce:2.21.5`: 指定要使用的镜像及其版本，这里是Portainer Community Edition的2.21.5版本。

此处需要注意的是，默认映射的9443端口是HTTPS端口，若需要HTTP端口，则需要多映射一个9000端口:
```bash
-p 9000:9000
```
安装完后，访问https://localhost:9443（HTTPS）或http://localhost:9000（HTTP），即可访问Portainer容器 🔑。

首次进入Portainer会被要求设置管理员账号密码，千万不要忘了，后续使用非常频繁。

<span id="📊-portainer-ui-常用项" class="legacy-anchor" aria-hidden="true"></span>

### 📊 Portainer UI 常用项

此处介绍上面Portainer UI图中侧边导航栏几个常用项，前文提及个人使用程度也很浅，所以这里介绍个人的通常用法。
- **Stacks**: 保存Docker Compose文件，用来快速创建/更新容器 📄。
- **Containers**: 管理当前已经创建的容器 🗃️。
- **Images**: 管理已下载的镜像 📥。
- **Network**: 管理已经创建的Docker Network。大部分时候使用的是bridge桥接或直接使用宿主机网络host，个别特殊情况会创建一个network供几个特别的容器进行通信 🔗。
- **Volumes**: 管理已创建的存储空间volume，这个使用得很少，一般都是定期查看删除没在使用的volume，可能还是学艺不精吧hhh 😂。

此时点进Containers，会发现列表中已经存在刚刚创建的portainer-ce容器，但无法对其进行停止等操作，毕竟通过Portainer让它关闭自己肯定也是不愿意的吧（笑）😄。

后续的使用教程将通过部署服务来实践。
