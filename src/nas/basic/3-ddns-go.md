---
title: DDNS-GO 动态DNS
order: 3
category:
    - docker
    - ddns-go
    - 教程
---

## DDNS-GO的作用
此处引用官方README。
中文 | [English](https://github.com/jeessy2/ddns-go/blob/master/README_EN.md)

自动获得你的公网 IPv4 或 IPv6 地址，并解析到对应的域名服务。

- [特性](#特性)
- [系统中使用](#系统中使用)
- [Docker中使用](#docker中使用)
- [使用IPv6](#使用ipv6)
- [Webhook](#webhook)
- [Callback](#callback)
- [界面](#界面)
- [开发&自行编译](#开发自行编译)

### 特性

- 支持Mac、Windows、Linux系统，支持ARM、x86架构
- 支持的域名服务商 `阿里云` `腾讯云` `Dnspod` `Cloudflare` `华为云` `Callback` `百度云` `Porkbun` `GoDaddy` `Namecheap` `NameSilo` `Dynadot`
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

## 前提
拥有一个域名，没备案的即可。

## 部署DDNS-GO容器
在[Portainer 容器管理](./2-portainer.md)中，我们已经完成了Portainer的安装，接下来我们将使用已经部署portainer容器完成ddns-go服务的安装。

首先在[Docker Hub](https://hub.docker.com)中搜索ddns-go,找到官方image（一般都是下载量最高那个，但是有时候三方修改过的镜像也不错），这里直接po出地址：
[jeessy/ddns-go](https://hub.docker.com/r/jeessy/ddns-go)
这里推荐直接在hub的页面中查看作者自己写的文档，里面有详细的安装步骤与说明，虽然我在写自己的doc，但还是推荐优先看官方文档，doc只做汇总或一些额外的说明。
官方文档只给出了docker run的安装命令，此处额外给出docker compose的安装方式，并且使用之前安装portainer进行管理。（如果你坚持使用docker run，可以直接在nas上运行）。
### Docker run 安装
docker run命令：
```bash
docker run -d --name ddns-go --restart=always --net=host -v /opt/ddns-go:/root jeessy/ddns-go
```
此处挂载的-v /opt/ddns-go:/root 是ddns-go的配置文件，他将配置文件映射到你/opt/ddns-go下，可自行修改。
### Docker compose 安装
访问你的portainer管理面板，点击左边的Stacks，：
![Portainer Stack List](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-1.png)
点击右上角的Add Stack，来到Create Stack界面：
![Portainer Create Stack](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-2.png)

为当前正在创建的Stack定义一个名称，例如ddns-go，注意首字母小写的规则。
下方的Build method选择默认的Web editor，然后在editor内填写下面的内容：
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
最后，保持其他选项为默认设置，点击下方的Deploy the stack进行容器部署。

## 配置DDNS-GO

容器安装完后，访问http://你的nasip:9876，进入ddns-go的配置页面。
![DDNS-GO配置页](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-3.png)

选择你的域名服务商，通常都是你域名购买的地方，此处以阿里云为例。
访问阿里云控制面板，点击右上角个人头像，选择Access Key。 
![点击Access Key](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/ddns-4.png)

在目标页面中，创建一对Access Key和Access Secret。但是阿里云一般会推荐创建RAM用户AccessKey，二者皆可。获取到AccessKey和Secret后将其填入上述表单中，TTL选择自动或10分钟（阿里云免费DNS解析一般是十分钟，若购买了过付费版，则可以选择对应时间）。

最后，根据你的公网IP使用情况，在IPV4项或IPV6项中的Domains中添加自己的解析记录，获取IP方式选择通过接口获取即可。如果同时拥有公网ipv4和公网ipv6，那么俩IPV4和IPV6的DDNS可以同时启用。

解析记录根据你的实际情况添加，比如想要通过portainer.domain.com（domain.com为购买的实际域名）访问已部署的portainer,则可以直接在输入框中输入portainer.domain.com,这样就可以通过portainer.domain.com:9000（portainer端口）直接访问。你的上游DNS服务器将直接把portainer.domain.com解析为你的公网IP。但是一般这样一个服务添加一条解析记录非常麻烦，所以一般我们直接添加一条*.domain.com，这样可以将任何域名下的二级域名解析到NAS上，同时配合NGINX反向代理，将不同的二级域名代理到不同服务上[相关链接：Nginx反向代理](./5-nginx.md)。

最后设置完后，左下角先点击保存，然后点击右上角日志进行查看，检查是否成功添加DNS解析记录。

