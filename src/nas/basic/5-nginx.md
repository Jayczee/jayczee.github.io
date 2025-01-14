---
title: Nginx 反向代理
order: 5
category:
    - NAS
tag:
    - nginx
    - docker
---

在 Nginx 中，可以将各个服务使用不同的二级域名反向代理到公网，配合防火墙仅暴露服务器的小部分端口，从而提高安全性。💡 PS：当初年少不懂事，曾将所有端口暴露到公网，包括 [V2rayN 代理](./9-v2rayn.md) 服务，结果被某位法国大兄弟在短短三四个小时内吸干了机场流量。想想自己当初将代理端口无加密暴露到公网，真是个狼人的操作。🐺

## 🚀 通过 Portainer Stacks 安装 Nginx

与 [DDNS-GO](./3-ddns-go.md) 中的做法相同，采用在 Portainer Stacks 中添加 Docker Compose 文件的方式部署 Nginx 容器。以下是 Docker Compose 文件的示例：

```bash
services:
  nginx:
    restart: always
    container_name: nginx
    image: nginx
    volumes:
      - /etc/nginx/conf.d:/etc/nginx/conf.d
      - /etc/nginx/nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/log/nginx:/var/log/nginx
    environment:
      - NGINX_PORT=80
      - TZ=Asia/Shanghai
    privileged: true
    network_mode: host
```

### 📜 文件中参数定义如下：

1. **重启策略**：设置为 `always`，表示如果容器停止，Docker 会自动重启它。
2. **容器名称**：指定容器的名称为 `nginx`。
3. **镜像**：使用官方的 `nginx` 镜像。
4. **挂载卷**：
   - 将主机的 `/etc/nginx/conf.d` 目录挂载到容器的 `/etc/nginx/conf.d`，用于配置文件。
   - 将主机的 `/etc/nginx/nginx.conf` 文件挂载到容器的 `/etc/nginx/nginx.conf`，用于主配置文件。
   - 将主机的 `/etc/letsencrypt` 目录挂载到容器的 `/etc/letsencrypt`，用于 SSL 证书。
   - 将主机的 `/var/log/nginx` 目录挂载到容器的 `/var/log/nginx`，用于日志文件。
5. **环境变量**：
   - `NGINX_PORT` 设置为 80，指定 Nginx 监听的端口。
   - `TZ` 设置为 `Asia/Shanghai`，指定时区。
6. **特权模式**：设置为 `true`，允许容器获得额外的权限。
7. **网络模式**：设置为 `host`，表示容器将使用主机的网络栈，容器和主机共享网络。

与其他镜像不同的是，部署 Nginx 容器时，容器中并没有一个 `/etc/nginx/nginx.conf` 主配置文件（大部分镜像都会存在一个默认配置文件，直接将其映射到宿主机，在其基础上进行修改）。在此情况下，若直接部署 Nginx 镜像，容器会报错配置文件不存在。因此，需要在宿主机上创建一个主配置文件，并将其映射到容器内部。

### 💡 Tips

当宿主机的 A 文件（文件夹）与容器的 B 文件（文件夹）创建映射关系时，可能产生的结果如下：

1. **A存在，B不存在**：Docker 会在容器内创建一个空目录 B，并将宿主机的 A 目录挂载到 B 上。容器内的 B 目录将显示 A 的内容。
2. **A存在，B存在**：Docker 会将宿主机的 A 目录挂载到容器内的 B 目录，容器内的 B 目录内容将与宿主机的 A 目录相同。容器内 B 的原有内容将被隐藏，但不会删除。
3. **A不存在，B不存在**：Docker 会在容器内创建一个空目录 B，因为没有宿主机的 A 进行挂载。
4. **A不存在，B存在**：容器内的 B 目录将保持不变，Docker 不会对其进行任何操作，B 的内容不会与宿主机的 A 进行关联。

### 🔑 总结

挂载时，宿主机的目录优先级高于容器内的目录，宿主机的内容会覆盖容器内的内容。

### 📝 创建配置文件 `/etc/nginx/nginx.conf`

```bash
worker_processes auto;
events {
        worker_connections 768;
        # multi_accept on;
}

http {
        sendfile on;
        tcp_nopush on;
        types_hash_max_size 2048;

        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
        ssl_prefer_server_ciphers on;
        client_max_body_size 8192M;

        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;
}
```

### 📂 创建文件夹 `/etc/nginx/conf.d`

在其中创建 `portainer.conf` 文件，写入如下内容：

```bash
upstream portainer {
    server localhost:9000;
}

server {
    listen       12120 ssl; # 端口
    server_name  portainer.domain.com; # 二级域名改为 portainer

    # 证书
    ssl_certificate /etc/letsencrypt/live/domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;

    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://portainer;
    }
}
```

### 🔍 各部分的解释：

1. **upstream portainer**: 定义了一个名为 `portainer` 的上游服务器，指向 `localhost:9002`，即 Portainer 服务运行的地址。
2. **server { ... }**: 定义了一个 Nginx 服务器块，包含监听的端口和域名等配置。
3. **listen 12120 ssl;**: 指定服务器监听 12120 端口，并启用 SSL。
4. **server_name portainer.domain.com;**: 指定该服务器块的域名为 `portainer.domain.com`。
5. **ssl_certificate 和 ssl_certificate_key**: 指定 SSL 证书和私钥的路径，用于加密 HTTPS 连接。
6. **ssl_session_timeout 5m;**: 设置 SSL 会话的超时时间为 5 分钟。
7. **ssl_protocols 和 ssl_ciphers**: 配置支持的 SSL/TLS 协议和加密套件，以增强安全性。
8. **location / { ... }**: 配置了一个位置块，处理对根路径的请求。
   - **proxy_http_version 1.1;**: 设置代理的 HTTP 版本为 1.1。
   - **proxy_set_header Upgrade $http_upgrade;**: 设置 `Upgrade` 头，以支持 WebSocket。
   - **proxy_set_header Connection "upgrade";**: 设置 `Connection` 头，指示连接升级。
   - **proxy_pass http://portainer;**: 将请求转发到上游定义的 `portainer` 服务器。

总体来说，该配置文件将来自 `portainer.domain.com` 的 HTTPS 请求通过 Nginx 反向代理到本地的 Portainer 服务，并确保连接的安全性。🔒

### 🔄 最后步骤

在服务器上重启 Docker 中的 Nginx：

```bash
docker restart nginx
```

访问 `https://portainer.domain.com:12120`，即可通过域名访问到 Portainer 容器。🌍

### 📋 模板使用

以上的 Portainer 容器反向代理配置文件可以作为一个模板，大部分服务都可以按照该模板进行配置。🛠️ 只有某些服务需要添加一些额外配置，这类服务在官方文档中一般都有说明，查找官方文档即可。