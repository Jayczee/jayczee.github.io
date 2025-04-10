---
title: Jellyfin 编码与解码 | N 卡驱动安装
isOriginal: true
category:
    - NAS
tag:
    - jellyfin
    - 编码与解码
---

## 🎥 什么是编码与解码？

### 📡 编码

编码是将原始音视频数据转换为特定格式的过程，以便于存储和传输。这个过程通常涉及压缩，以减少文件大小，从而节省存储空间和带宽。常见的编码格式包括：

- **视频编码格式**：如 H.264、H.265（HEVC）、VP9 等。
- **音频编码格式**：如 AAC、MP3、FLAC 等。

### 🔄 解码

解码是将编码后的音视频数据转换回可播放格式的过程。解码器负责读取编码数据，并将其转换为可以在媒体播放器中播放的格式。

## 🔍 Jellyfin 中的编码与解码

Jellyfin 通过使用 FFmpeg 等工具来处理音视频的编码与解码。

### 1. **转码**

当客户端设备不支持片源的音视频格式时，Jellyfin 会自动进行转码。转码是将文件从一种格式转换为另一种格式的过程。Jellyfin 会根据客户端的能力和网络状况选择最佳的转码方式。

### 2. **直接播放**

如果客户端设备支持片源的音视频格式，Jellyfin 会选择直接播放。因此，在选择片源时，尽量选择主力播放设备支持的格式。如果使用功能较齐全的电视播放，通常大部分都是直接播放的。

### 3. **硬解与软解**

- **硬解**：利用硬件加速进行解码，通常使用 NAS 上的显卡进行解码，例如 NVIDIA GPU 和 Intel Quick Sync（核显）。
  
- **软解**：通过软件进行解码，通常会消耗更多的 CPU 资源，可能导致性能下降，尤其是在高分辨率视频播放时。面对高质量片源时，软解的效率较低。

## 🖥️ Docker 中的 Jellyfin 使用 NVIDIA 显卡进行硬解

### 1. 安装 N 卡驱动

如果 Jellyfin 部署在 Docker 中，并且 NAS 拥有一块 NVIDIA 显卡并想用该显卡解码，那么在部署 Jellyfin 之前需要先在 NAS 上安装 NVIDIA 驱动。

首先，运行命令检查是否已经安装 N 卡驱动：

```bash
nvidia-smi
```

如果输出信息类似下图，且 Driver Version 与 CUDA Version 不为空，则表示已安装驱动。

![nvidia-smi 输出信息](/assets/images/nas/jellyfin/j-5.png)

如果提示命令不存在等信息，则视为未安装驱动。

访问 [NVIDIA 官网](https://www.nvidia.cn/drivers/lookup/)，根据 NAS 的配置信息，搜索对应的驱动：

![搜索驱动](/assets/images/nas/jellyfin/j-6.png)

![搜索结果](/assets/images/nas/jellyfin/j-7.png)

右键单击下载按钮，复制地址，在 NAS 命令行中使用 `wget` 命令下载(wget需要添加refer和user-agent，否则下载会碰到403)：

```bash
wget --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --header="Referer: https://www.nvidia.cn/" https://cn.download.nvidia.com/XFree86/Linux-x86_64/570.133.07/NVIDIA-Linux-x86_64-570.133.07.run
```

当然，也可以下载到其他机器上，通过 SFTP 或 SCP 等方式传输到 NAS 上。

下载完成后，运行命令，根据提示完成安装：

```bash
sh ./NVIDIA-Linux-x86_64-550.144.03.run
```

### 2. Jellyfin Docker Compose 配置

以下是配置 Jellyfin 使用 NVIDIA 显卡的 Docker Compose 示例：

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

:::tip
如果安装过程中提示：
```
ERROR: Unable to find the kernel source tree for the currently running kernel. Please make sure you have installed the kernel source files for your kernel and that they are properly configured; on Red Hat Linux systems, for example, be sure you have the 'kernel-source' or 'kernel-devel' RPM installed. If you know the correct kernel source files are installed, you may specify the kernel source path with the '--kernel-source-path' command line option.
```

这是由于`当前系统未安装内核头文件或源代码：在Linux系统中，内核头文件（linux-headers）或源代码（kernel-source）并不是默认安装的。如果系统缺少这些文件，安装程序就无法编译内核模块。`。先退出安装程序，运行

```bash
sudo apt-get install linux-headers-$(uname -r)
```
后继续安装即可。
：：：