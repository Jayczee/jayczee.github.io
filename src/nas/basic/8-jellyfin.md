---
title: Jellyfin 媒体服务器
order: 8
isOriginal: true
category:
    - NAS
tag:
    - jellyfin
    - docker
---

Jellyfin是一款**免费的影音服务器**，支持通过Web直接播放，同时提供**Android App客户端**、**iOS App客户端**以及**安卓TV客户端**，方便用户管理自己的影音资源并在任何设备上进行观看，功能非常强大。

![Web客户端海报墙](/assets/images/nas/jellyfin/j-1.png)

## 🛠️ Jellyfin安装Docker Compose配置 

以下是Jellyfin的Docker Compose安装配置示例：

```yaml
version: '3.8'
volumes:
  jellyfin_config:
  jellyfin_cache:
services:
 jellyfin:
   image: nyanmisaka/jellyfin:latest
   container_name: jellyfin
   hostname: jellyfin
   restart: always
   environment:
     - TZ=Asia/Shanghai
     - NVIDIA_DRIVER_CAPABILITIES=all
     - NVIDIA_VISIBLE_DEVICES=all
   network_mode: host
   volumes:
     - jellyfin_config:/config
     - jellyfin_cache:/cache
     - /mnt/data_hdd:/data_hdd # 该映射是影音文件存储位置，可根据实际情况调整
     - /mnt/nas1_smb:/nas1_smb # 该映射是影音文件存储位置，可根据实际情况调整
     - /dev:/dev
   runtime: nvidia
   deploy:
     resources:
       reservations:
         devices:
           - capabilities: 
             - gpu
```

::: tip

Jellyfin的Docker镜像有许多修改版本，此处选择了`nyanmisaka/jellyfin`，该镜像支持Web串流H265格式的影片。

:::

创建了两个volume，分别为`jellyfin_config`和`jellyfin_cache`，用于存储Jellyfin自身的配置文件。

该Docker Compose文件有几个特别之处：

```yaml
- NVIDIA_DRIVER_CAPABILITIES=all
- NVIDIA_VISIBLE_DEVICES=all
```

与最后的

```yaml
deploy:
     resources:
       reservations:
         devices:
           - capabilities: 
             - gpu
```

使该镜像能够调用宿主机上的NVIDIA显卡（例如，搭载NVIDIA GTX 1060显卡的笔记本电脑），从而更好地完成编码与解码工作。若NAS没有搭载N卡，则可以移除上述内容，镜像仍然能够使用CPU的核显进行编解码工作。若NAS不自带任何显卡，则不推荐在该NAS上部署Jellyfin，以免影响后续的影音观看体验。

推荐在客户端上安装**Infuse**等支持多种影片格式的播放器，结合之前的[**Samba文件共享服务**](/nas/basic/6-samba.md)，让客户端能够访问到NAS中存储的影片进行直接播放。注意：如影片质量较高（例如4K高码率），建议在内网下进行播放，以确保流畅度，因为此时客户端播放器相当于直接下载服务器源文件，无法调整画质，观看体验会受到服务器性能的影响。

关于Jellyfin编码与解码的详细内容，请参考[**Jellyfin编码与解码**](/nas/jellyfin-encode-decode.md)。

成功部署镜像后，访问`https://NASIP:8096`即可访问Jellyfin服务。初次访问需要设置语言、管理员账号密码等信息。元数据刮削等设置可保持默认即可，该部分功能将在[**Moviepilot**](/nas/basic/10-movie-pilot.md)中实现。

:::tip

安装完后可以先不进行下列设置，直接跳转到[**Moviepilot**](/nas/basic/10-movie-pilot.md)进行部署与配置，然后再回来进行媒体库相关的配置。

:::

## 📂 添加媒体库

1. 点击左上角 -> 控制台 -> 媒体库 -> 点击添加媒体库：

   ![Jellyfin 添加媒体库](/assets/images/nas/jellyfin/j-2.png)

2. 选择内容类型。若类型为`电影`，则该文件夹中保存的即为电影类型的资源。对于电视剧、综艺、动漫等多季（Season）、多集（Ep）的媒体资源，在创建媒体库时统一选择`电视剧`类型。

   ![Jellyfin 媒体库类型](/assets/images/nas/jellyfin/j-3.png)

3. 添加媒体库文件夹。选择对应类型的媒体资源存放的文件夹（此处选择的文件夹是容器内的位置，需确保容器外影音资源的存储位置已成功映射到容器内）。每个媒体库可添加多个文件夹。

其他设置保持默认即可，无需关心Jellyfin本身的刮削功能，因其效果不佳。保存后可点击扫描媒体库立即刷新媒体资源。

## ⚙️ 设置硬件转码 

1. 点击左上角 -> 控制台 -> 播放 -> 转码：

根据显卡类型选择对应转码方式，N卡选择Nvidia NVENC，Intel核显选择QSV，AMD核显选择V4L2，其他的ARM CPU（如树莓派等）可选择V4L2。下方的转码勾选可以自行搜索支持的转码类型进行勾选。选择完后滚动到最下方选择保存。

![Jellyfin 转码配置](/assets/images/nas/jellyfin/j-4.png)

通过以上步骤，Jellyfin的设置将更加完整，确保最佳的影音体验！🌟

## Nginx配置

```bash
server {
    listen 1212 ssl http2; ## 外网访问端口
    server_name jellyfin.domain.com; ## 自定义jellyfin二级域名

    client_max_body_size 20M;

    set $jellyfin 127.0.0.1;

    ssl_certificate /etc/letsencrypt/live/domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem; ## 配置证书地址

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "0";
    add_header X-Content-Type-Options "nosniff";

    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Resource-Policy "same-origin" always;

    add_header Permissions-Policy "accelerometer=(), ambient-light-sensor=(), battery=(), bluetooth=(), camera=(), clipboard-read=(), display-capture=(), document-domain=(), encrypted-media=(), gamepad=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), interest-cohort=(), keyboard-map=(), local-fonts=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), serial=(), sync-xhr=(), usb=(), xr-spatial-tracking=()" always;

    add_header Origin-Agent-Cluster "?1" always;

    location = / {
        return 302 https://$host:1212/web/; ## 别忘了修改外网访问端口
    }

    location / {
        # Proxy main Jellyfin traffic
        proxy_pass http://$jellyfin:8096;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
        proxy_buffering off;
    }

    location = /web/ {
        proxy_pass http://$jellyfin:8096/web/index.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
    }

    location /socket {
        proxy_pass http://$jellyfin:8096;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
    }
}
```