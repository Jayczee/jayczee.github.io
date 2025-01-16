---
title: V2ray & v2rayA代理
order: 9
isOriginal: true
category:
    - NAS
tag:
    - v2ray
    - v2raya
    - 代理
    - docker
---

V2Ray是一款**强大的网络代理工具**，旨在帮助用户实现**科学上网**，突破网络限制。它支持多种传输协议和加密方式，具有高度的灵活性和可扩展性，非常适合用于搭建个人代理服务器。而**V2rayA**则是一款可以通过Web访问的V2Ray管理面板。

## 🛠️ 安装 V2Ray 

首先，需要在NAS宿主机上安装V2Ray，V2rayA仅仅是一款管理工具，并不包含核心的V2Ray。

### 🔗 相关链接 
- [Github V2ray Releases](https://github.com/v2fly/v2ray-core/releases)
- [V2rayA Document](https://v2raya.org/docs/prologue/installation/docker/) 


根据NAS的CPU架构选择对应的版本进行下载，可以通过网页下载并传输到指定目录，或使用`wget`命令获取。以`5.24.0 linux amd64`版本为例：

```bash
wget https://github.com/v2fly/v2ray-core/releases/download/v5.24.0/v2ray-linux-64.zip # 下载文件到当前目录

sudo mkdir -p /usr/local/v2ray-core/ # 创建文件夹

sudo unzip v2ray-linux-64.zip -d /usr/local/v2ray-core/ # 解压文件到指定目录
```

运行以下命令检查是否安装成功：

```bash
/usr/local/v2ray-core/v2ray
```

如果安装成功，将会出现V2Ray操作命令提示。

## 🖥️ 安装 V2rayA 

接下来，安装V2rayA，Docker Compose文件如下：

```yaml
version: '3.8'

services:
  v2raya:
    image: mzz2017/v2raya
    container_name: v2raya
    ports:
      - "2017:2017"
      - "50170-50172:50170-50172"
    environment:
      - /usr/local/v2ray-core/v2ray=/usr/local/bin/v2ray
      - V2RAYA_LOG_FILE=/tmp/v2raya.log
    volumes:
      - /etc/v2raya:/etc/v2raya
    restart: always
```

在此配置中，管理面板端口为`2017`，而`50170-50172`是自定义选择的代理端口范围，可以映射3个（或更多）端口用于开放不同协议的代理端口（如http、https以及socks5）。

确保刚刚安装的V2Ray (`/usr/local/v2ray-core/v2ray`) 映射到V2rayA目录下 (`/usr/local/bin/v2ray`)。

### 🎉 部署完成后 

访问`http://NASIP:2017`，选择**subscription**，点击**导入**，输入机场的订阅地址：

![配置订阅地址](/assets/images/nas/v2ray/v-1.png)

在V2rayA从订阅地址下载完节点信息后，界面如下：

![节点信息](/assets/images/nas/v2ray/v-2.png)

在操作列中，点击选择想要使用的节点（可多选），选择完成后，左上角点击**启动**，即可启动代理。

![选择节点并启动代理](/assets/images/nas/v2ray/v-3.png)

右侧的**Proxy**按钮可以设置负载均衡策略，其中`ProbeUrl`用于检测节点时延，保持不变即可，目前类型仅支持最小时延优先。

![负载均衡策略设置](/assets/images/nas/v2ray/v-4.png)

右上角的设置按钮中可以进行代理规则相关的设置。刚刚在Docker Compose中映射的端口为`50170-50172`，但默认代理端口并非这三个端口，需要进行修改。点击**设置** -> **地址与端口**，修改各种代理协议的端口为所需的端口。

![设置界面](/assets/images/nas/v2ray/v-5.png)

![地址与端口界面](/assets/images/nas/v2ray/v-6.png)

### ⚙️ 代理规则设置 

此处规则代理，**系统代理**选择**关闭**，因为仅选择性使用代理。在需要代理时，将代理地址设置为本机的对应代理端口，不需要服务代理所有的系统请求。