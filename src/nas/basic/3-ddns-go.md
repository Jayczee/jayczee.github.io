---
title: DDNS-GO 动态DNS
order: 3
category:
  - NAS
tag:
  - docker
  - ddns-go
---

## 📌 DDNS-GO的作用

此处引用官方README。  
中文 | [English](https://github.com/jeessy2/ddns-go/blob/master/README_EN.md)

自动获得你的公网 IPv4 或 IPv6 地址，并解析到对应的域名服务。

- 支持Mac、Windows、Linux系统，支持ARM、x86架构
- 支持的域名服务商：`阿里云`、`腾讯云`、`Dnspod`、`Cloudflare`、`华为云`、`Callback`、`百度云`、`Porkbun`、`GoDaddy`、`Namecheap`、`NameSilo`、`Dynadot`
- 支持接口/网卡/[命令](https://github.com/jeessy2/ddns-go/wiki/通过命令获取IP参考)获取IP
- 支持以服务的方式运行
- 默认间隔5分钟同步一次
- 支持同时配置多个DNS服务商
- 支持多个域名同时解析
- 支持多级域名
- 网页中配置，简单又方便，默认勾选`禁止从公网访问`
- 网页中方便快速查看最近50条日志
- 支持Webhook通知
- 支持TTL
- 支持部分DNS服务商[传递自定义参数](https://github.com/jeessy2/ddns-go/wiki/传递自定义参数)，实现地域解析/多IP等功能

## ⚙️ 前提

拥有一个域名，无需备案即可。

---

## 🚀 部署DDNS-GO容器

在[Portainer 容器管理](./2-portainer.md)中，已完成Portainer的安装，接下来将使用已部署的Portainer容器完成ddns-go服务的安装。

首先，在[Docker Hub](https://hub.docker.com)中搜索`ddns-go`，找到官方镜像（通常是下载量最高的那个，但有时第三方修改过的镜像也不错）。这里直接提供地址：[jeessy/ddns-go](https://hub.docker.com/r/jeessy/ddns-go)。

推荐优先查看Hub页面中作者自己写的文档，里面有详细的安装步骤与说明。虽然本文档提供了汇总和一些额外的说明，但优先参考官方文档更为妥当。

官方文档只给出了`docker run`的安装命令，此处额外提供`docker compose`的安装方式，并使用之前安装的Portainer进行管理。（若坚持使用`docker run`，可以直接在NAS上运行。）

### 🐳 Docker run 安装

使用以下`docker run`命令：

```bash
docker run -d --name ddns-go --restart=always --net=host -v /opt/ddns-go:/root jeessy/ddns-go
```

这里挂载的`-v /opt/ddns-go:/root`是ddns-go的配置文件，它将配置文件映射到`/opt/ddns-go`下，配置文件可自行修改。

---

### 📦 Docker compose 安装

访问Portainer管理面板，点击左侧的**Stacks**：

![Portainer Stack List](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-1.png)

点击右上角的**Add Stack**，来到**Create Stack**界面：

![Portainer Create Stack](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-2.png)

为当前正在创建的Stack定义一个名称，例如`ddns-go`，注意首字母小写的规则。

下方的**Build method**选择默认的**Web editor**，然后在编辑器内填写以下内容：

```docker compose
services:
  ddns-go:
    image: jeessy/ddns-go
    container_name: ddns-go
    restart: always
    network_mode: host
    volumes:
      - /opt/ddns-go:/root
```

最后，保持其他选项为默认设置，点击下方的**Deploy the stack**进行容器部署。

---

## ⚙️ 配置DDNS-GO

容器安装完成后，访问 `http://你的nasip:9876`，进入ddns-go的配置页面。

![DDNS-GO配置页](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-3.png)

选择域名服务商，通常是域名购买的地方，此处以阿里云为例。访问阿里云控制面板，点击右上角的个人头像，选择**Access Key**。

![点击Access Key](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-4.png)

在目标页面中，创建一对**Access Key**和**Access Secret**。阿里云一般会推荐创建RAM用户的AccessKey，二者皆可。获取到AccessKey和Secret后，将其填入上述表单中，TTL选择自动或10分钟（阿里云免费DNS解析一般是十分钟，若购买了付费版，则可以选择对应时间）。

最后，根据公网IP使用情况，在IPv4项或IPv6项中的**Domains**中添加解析记录，获取IP方式选择通过接口获取即可。如果同时拥有公网IPv4和公网IPv6，那么两个DDNS可以同时启用。

解析记录根据实际情况添加，例如想要通过`portainer.domain.com`（`domain.com`为购买的实际域名）访问已部署的Portainer，则可以在输入框中输入`portainer.domain.com`，这样就可以通过`portainer.domain.com:9000`（Portainer端口）直接访问。上游DNS服务器将直接把`portainer.domain.com`解析为公网IP。

不过，添加一条解析记录通常比较麻烦，因此一般直接添加一条`*.domain.com`，这样可以将任何域名下的二级域名解析到NAS上。同时配合NGINX反向代理，将不同的二级域名代理到不同服务上。[相关链接：Nginx反向代理](./5-nginx.md)。

最后设置完后，左下角先点击**保存**，然后点击右上角的**日志**进行查看，检查是否成功添加DNS解析记录。