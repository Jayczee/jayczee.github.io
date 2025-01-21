---
title: Docker 镜像加速/代理
isOriginal: true
category:
    - NAS
tag:
    - docker
    - proxy
---

在国内，Docker Hub 镜像源的情况不容乐观，无论是清华大学镜像源，还是阿里镜像加速，统统都已经失效。国内现在已经不允许开设 Docker 镜像加速服务，唯一的办法仍然是走代理。🌐

Docker 拉取镜像是由 Docker daemon 进行的，因此简单的环境变量设置如：

```bash
export http_proxy="http://proxy_address:port"
```

已经无法满足需求，需要直接对 Docker 进行配置。

## 🛠️ Docker 代理配置

### 1. 配置环境变量

首先，创建或编辑 `/etc/systemd/system/docker.service.d/http-proxy.conf` 文件：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo vim /etc/systemd/system/docker.service.d/http-proxy.conf
```

在文件中输入如下内容：

```bash
[Service]
Environment="HTTP_PROXY=http://proxy_address:port"
Environment="HTTPS_PROXY=http://proxy_address:port"
Environment="NO_PROXY=localhost,127.0.0.1,.example.com"
```

这里分别设置了 `HTTP_PROXY`、`HTTPS_PROXY` 和 `NO_PROXY` 等参数。

### 2. 重新加载 systemctl 环境变量

执行以下命令以重新加载配置：

```bash
sudo systemctl daemon-reload
```

### 3. 重启 Docker 服务

最后，重启 Docker 服务以应用新的代理设置：

```bash
sudo systemctl restart docker
```

完成上述步骤后，重新拉取 Docker 镜像即可。🚀