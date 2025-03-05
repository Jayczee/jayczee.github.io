---
title: Movie-pilot 自动化媒体整理
order: 10
isOriginal: true
category:
    - NAS
tag:
    - movie-pilot
    - docker
---

已安装的 qbittorrent 服务与 jellyfin 服务已经能提供最基本的影音需求，但在使用 jellyfin 查看媒体文件夹中的影片时，可能会出现以下问题：

1. 📽️ 影音文件以源文件名而不是影片名显示
2. 🖼️ 缺少海报，演员信息
3. 📂 所有影音资源挤在一个下载文件夹中，包含了一些非影音资源文件，显得非常杂乱
4. 🎬 影音文件缺少字幕
5. 🔄 媒体库刷新不及时，经常需要手动刷新
6. 📝 媒体文件需要手动命名，手动设置元数据等等

此时，需要一款帮助解决此类问题的媒体整体工具，即 **Movie pilot**（原 Nas tool 作者开发，为 Nas tool 上位替代版本）。

相关链接：
- [Movie pilot 官方 Wiki](https://wiki.movie-pilot.org/)
- [Movie pilot Github](https://github.com/jxxghp/MoviePilot)

## 🚀 安装步骤

详细的安装参数建议参考 [Movie pilot 官方 Wiki](https://wiki.movie-pilot.org/)，此处仅简述安装步骤。

### 🔑 获取 IYUU Token

为了防止该项目遭到滥用，作者设置了认证环节，用户在使用之前需要使用 PT 站点或者 IYUU 进行认证 ([查看详情](https://wiki.movie-pilot.org/configuration))。此处提供 IYUU 认证步骤示例，较为简单。参考官方文档，如果准备使用其他站点的认证可以跳过该步骤。如果不进行认证，将无法使用 Moviepilot 的大部分功能。

访问 [IYUU 爱语飞飞](https://iyuu.cn/)，点击页面中间的开始使用：

![IYUU官方网站](/assets/images/nas/moviepilot/moviepilot-1.png)

点击之后页面中央会出现二维码，使用微信扫码，关注 IYUU 公众号，获得 IYUU Token 的推送：

![IYUU微信号推送](/assets/images/nas/moviepilot/moviepilot-2.png)

### 🛠️ 服务部署

docker compose 文件如下：

```yaml
version: '3.3'

services:

    moviepilot:
        stdin_open: true
        tty: true
        container_name: moviepilot-v2
        hostname: moviepilot-v2
        networks:
            - moviepilot
        ports:
            - target: 53010
              published: 53010
              protocol: tcp
        volumes:
            - '/mnt:/mnt'
            - '/moviepilot-v2/config:/config'
            - '/moviepilot-v2/core:/moviepilot/.cache/ms-playwright'
            - '/var/run/docker.sock:/var/run/docker.sock:ro'
        environment:
            - 'NGINX_PORT=53010'
            - 'PORT=3001'
            - 'PUID=0'
            - 'PGID=0'
            - 'UMASK=000'
            - 'TZ=Asia/Shanghai'
            - 'SUPERUSER=jayczee'
            - 'AUTH_SITE=iyuu'
            - 'IYUU_SIGN=你的IYUU TOKEN'
            - 'PROXY_HOST=http://192.168.10.229:50171'
        restart: always
        image: jxxghp/moviepilot-v2:latest

networks:
  moviepilot:
    name: moviepilot
```

此处使用的是 moviepilot-v2 版本，特别设置了 `SUPERUSER=jayczee`，管理员用户名设为 jayczee，同时设置了代理地址 (参考 [V2rayN & V2rayA](./9-v2rayn.md))，方便镜像从 GitHub 上更快速抓取项目。

::: tip
moviepilot 容器启动后，需要等待一段时间。容器会从 GitHub 上抓取前后端代码进行编译，速度比较慢，可以从 Portainer 中查看容器 log 了解进度。即便 log 中已经显示了 web 服务的地址且能够访问，但在实际登录管理员账号时会提示 502 或 404 等错误。这实际上是由于容器中的后端服务尚未完全部署完毕。当时踩了这个坑很久，一度对自己产生怀疑。
:::

::: warning
moviepilot 内置了一个 nginx 来反向代理其中的 web 服务，修改上述的 NGINX_PORT 属性时，需要同步修改 ports 中的 target 与 published 端口。
:::

安装完后界面大致如下（不包含影音资源）：

![MoviePilot](/assets/images/nas/moviepilot/moviepilot-3.png)

## ⚙️ 配置 Moviepilot

### 📥 下载器配置

以之前部署的 Qbittorrent 为例，Moviepilot 左侧导航栏设定 -> 系统 -> 下载器，点击 + 号，选择 Qbittorrent，点击新跳出的选项卡：

![点击新建的选项卡](/assets/images/nas/moviepilot/moviepilot-4.png)

输入下载器对应的地址、用户名以及密码，可以选择勾选自动分类管理 (参考 [Qbittorrent 自动分类](/nas/qbit-category.md)) 等选项。

![设置下载器相关参数](/assets/images/nas/moviepilot/moviepilot-5.png)

::: tip
下载器的地址，如果 Moviepilot 没有使用 host 模式（默认配置是这样，使用 host 会占用比较多的端口），则需要进入 Portainer 查看网关（即宿主机）的内网 IP 地址，然后通过宿主机连接对应的下载器的地址。

![查看Moviepilot网关地址](/assets/images/nas/moviepilot/moviepilot-6.png)

此处可以看到 Moviepilot 的网关的地址为 172.20.0.1，即通过该 IP 可以连通宿主机，若假设 Qbittorrent WebUI 在宿主机上的端口为 53000，则 Moviepilot 可以通过 172.20.0.1:53000 访问到 Qbittorrent。

所以此处填写 http://172.20.0.1:53000
:::

设置完后点击保存。

### 📂 媒体目录配置

需要设置媒体文件整体前（刚刚下载好，无元数据，杂乱的文件）的目录和整理后的目录（已重命名且刮削元数据的任务）。点击左侧导航栏设定 -> 系统 -> 存储 & 目录 -> 目录，点击现金目录，填写如下：

![目录填写](/assets/images/nas/moviepilot/moviepilot-7.png)

如同先前在 jellyfin 中设置的媒体类型一项，电影选择“电影”即可，而电视剧、综艺以及动漫等有多季多期特征的资源选择“电视剧”，媒体类别选择“全部”，当然，如果想细分，可以选择对应的媒体类别。

下载/源存储选择`本地`，目录输入先前 Qbittorrent 配置的下载目录。

自动整理选择`目录监控`，每当 qbittorrent 下载新的媒体文件时都能自动进行整理。

监控模式选择`性能模式`。

目录输入一个自定义的文件整理后的目录。

整理方式选择硬链接 (相关文档: [软硬链接的区别](/win_linux/link.md))，覆盖模式选择保留最新文件。

::: tip
我个人的目录结构如下：
- 电影下载保存地址： `/mnt/data_hdd1/download_movie`
- 整理后地址：`/mnt/data_hdd1/movie`

-综艺下载保存地址： `/mnt/data_hdd1/download_tv`
- 整理后地址：`/mnt/data_hdd1/tv`

- 动漫下载保存地址： `/mnt/data_hdd1/download_cartoon`
- 整理后地址：`/mnt/data_hdd1/cartoon`
:::

![整理前效果](/assets/images/nas/moviepilot/moviepilot-8.png)

![整理后效果](/assets/images/nas/moviepilot/moviepilot-9.png)

由于采用的是硬链接的方式，所以占用空间不会变大。填写完配置信息后点击保存。

### 📺 媒体服务器配置

首先访问 Jellyfin，点击控制台 -> API 秘钥，创建一个 API 秘钥。

![Jellyfin创建API秘钥](/assets/images/nas/moviepilot/moviepilot-10.png)

Moviepilot 点击左边侧边栏设定 -> 系统 -> 媒体服务器，点击加号。

![媒体服务器配置](/assets/images/nas/moviepilot/moviepilot-11.png)

先前在 nginx 中配置了 jellyfin 外网访问地址，所以此处两个地址都填外网访问地址即可。API 秘钥填写 Jellyfin 中生成的秘钥。

至此，Moviepilot 配置完成，可以自动帮忙整理下载好的媒体文件。🎉

---

## 🔗 相关资源

- [Movie pilot 官方 Wiki](https://wiki.movie-pilot.org/)
- [Movie pilot Github](https://github.com/jxxghp/MoviePilot)
- [IYUU 爱语飞飞](https://iyuu.cn/)