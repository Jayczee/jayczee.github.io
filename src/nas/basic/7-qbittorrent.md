---
title: Qbittorrent BT下载
order: 7
isOriginal: true
category:
    - NAS
tag:
    - qbittorrent
    - docker
---

**qBittorrent** 是一个开源的 BitTorrent 客户端，旨在提供一个用户友好的界面和丰富的功能。它支持多种操作系统，包括 **Windows**、**macOS** 和 **Linux**。qBittorrent 不仅可以下载种子文件，还支持磁力链接，并内置搜索功能，方便用户查找和下载内容。✨

将以下 **docker compose** 配置文件复制进 **Stack**，点击 **Deploy the stack** 进行部署。

```yaml
volumes:
  qbittorrent_data: 
  
services:
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=0
      - PGID=0
      - TZ=Asia/Shanghai
      - WEBUI_PORT=53000
    volumes:
      - qbittorrent_data:/config
      - /mnt:/mnt
    ports:
      - 53000:53000
      - 53001:6881
      - 53001:6881/udp
    restart: unless-stopped
```

### 📌 配置说明

- **services**: 定义服务，这里只有一个 `qbittorrent` 服务。
  - **image**: 使用 `lscr.io/linuxserver/qbittorrent:latest` 镜像，这是一个维护良好的 qBittorrent 镜像。
  - **container_name**: 设置容器名称为 `qbittorrent`，便于管理。
  - **environment**: 设置环境变量：
    - `PUID` 和 `PGID`: 设置为 `0`，表示使用 root 用户（可根据需要修改为非特权用户）。
    - `TZ`: 设置时区为 `Asia/Shanghai`。
    - `WEBUI_PORT`: 设置 Web 界面的端口为 `53000`。
  - **volumes**: 挂载存储卷：
    - `qbittorrent_data:/config`: 将持久化存储卷挂载到容器的 `/config` 目录。
    - `/mnt:/mnt`: 将宿主机的 `/mnt` 目录挂载到容器内，方便下载文件的访问。
  - **ports**: 映射端口：
    - `53000:53000`: 映射 Web UI 端口。
    - `53001:6881` & `53001:6881/udp`: 映射 BitTorrent 的传输端口。
  - **restart**: 设置重启策略为 `unless-stopped`，即除非手动停止，否则容器会自动重启。

> **注意**: 此处新建了一个 volume `qbittorrent_data` 来映射容器内的 `/config` 文件夹，这种情况下，`/config` 文件夹并没有映射到宿主机的某个具体路径，而是交由 Docker 管理，这样可以避免破坏该文件。此外，若删除容器后重新部署，若先前创建的 `qbittorrent_data` 仍在，则可以继承先前容器的数据。🔄

### 🌐 可选配置

部署完容器后，使用 **nginx** 将 qBittorrent 服务进行反向代理，以下是 nginx 反向代理配置：

```nginx
server{
    listen 12120 ssl;
    server_name qbit.domain.com;

    ssl_certificate /etc/letsencrypt/live/jayczee.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jayczee.top/privkey.pem;

    location / {
      proxy_pass              http://localhost:53000/;
      proxy_http_version      1.1;
      proxy_set_header        X-Forwarded-Host        $http_host;
      http2_push_preload on; # Enable http2 push
    }
}
```

此处 nginx 监听 **12120** 端口。可以让所有 nginx 的反向代理配置都监听同一端口，通过监听不同的 servername，即不同的二级域名来代理到不同的服务。🔑

> **为什么不是 80 端口或 443 端口？** 使用家庭宽带时，通常运营商会封禁家庭宽带的 80 和 443 端口，无法使用，因此需要使用其他端口。推荐使用 1000 及以上的端口号，以避免与其他服务冲突。

### 🌐 BT传输端口

浏览器访问 [https://qbit.domain.com:12120](https://qbit.domain.com:12120) 或 [http://localhost:53000](http://localhost:53000)（若没有进行 nginx 配置），即可访问 qBittorrent WebUI。如图所示：

![qBittorrent管理界面](/assets/images/nas/qbittorrent/qbit-1.png)

打开左上角工具 → 选项，弹出的设置对话框中选择连接，确保用于传入连接的端口是在 docker compose 配置中宿主机映射的 BitTorrent 的传输端口，如图所示：

![qBittorrent配置窗口](/assets/images/nas/qbittorrent/qbit-2.png)

之后qBittorrent客户端将使用该端口与其他用户进行通信。

### 🎉 完成部署

至此，qBittorrent 的部署工作基本完成。后续将依靠它来下载影音资源到 NAS 服务器中。📥

### 📚 相关文章

- [qBittorrent 分类管理](/nas/qbit-category.md)