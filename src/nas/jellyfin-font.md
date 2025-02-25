---
title: Jellyfin 字幕显示方框
isOriginal: true
category:
    - NAS
tag:
    - jellyfin
    - 字体乱码
---

昨晚在准备观看一部下载好的电影时，经过一番准备终于开始播放。然而，才看了几分钟片头，第一句台词一出来，字幕竟然都是方框，真是令人扫兴😩。

这种情况之前也遇到过，在另一台NAS上，问题出在缺失中文字体，导致字幕显示错误。为了解决这个问题，需要为Jellyfin安装中文字体。

以下以广受欢迎的 **Noto Sans** 字体为例，这款字体在工作时的客户端页面中也得到了应用。

### 安装步骤

1. **通过 Portainer 进入容器**（也可以使用命令行进入）：

    ```bash
    docker exec -it jellyfin /bin/bash
    ```

2. **更新软件源**：

    ```bash
    apt update
    ```

3. **安装字体**：

    ```bash
    apt install fonts-noto-cjk-extra
    ```

4. **最后重启容器**。

> **提示**：在很多情况下，使用外部的 ASS 字幕会导致显示问题，若更换为 SRT 字幕则可以避免此类困扰。