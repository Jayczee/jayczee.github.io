---
title: NAS的个人最佳实践
category:
    - NAS
    - 教程
---

## NAS简介

> **NAS（Network Attached Storage）**，即网络附属存储，是中年男人三大爱好之一（我毕业的时候入的坑，所以我一毕业就成为了中年...bushi）。

在如今的市场上，有许多成品NAS可供选择，例如威联通、群晖和绿联等知名品牌。这些品牌提供各自独特的NAS系统，用户购买后可以快速进行配置，以满足个人需求。然而，对于像我这样的刚毕业的穷鬼来说，成品NAS的价格往往难以承受。因此，我更倾向于使用一台纯净的服务器，从零开始自己搭建NAS，这样不仅能节省开支，还能学习到许多新知识。

---

## NAS的本质

NAS的本质其实很简单，无论它的名称如何，它仍然是一台承载各种服务的服务器。只要手上有一台电脑，无论是 **Windows**、**Linux** 还是 **Mac OS**，都可以实现NAS的功能。我的第一台NAS就是大学时使用的笔记本电脑，刷成了Linux系统。笔记本电脑作为NAS的优点在于：

- **功耗低**：相较于传统服务器，笔记本电脑更节能。
- **自带UPS电源**：即便断电也能保证数据安全。
- **独立显卡**：可以用于影音解码，提升观看体验。

---

## 为什么需要NAS？

我初步接触NAS是出于兴趣，想了解相关技术。但在深入研究后，我明确了自己的需求，发现NAS在以下几个方面非常有用：

- 📂 **文件备份**：安全存储重要文件，避免丢失。
- 🎥 **高清影音播放**：随时随地享受高质量的影音内容。
- 🌐 **个人服务器需求**：搭建自己的网络服务，实现个性化需求。

---

## 常用服务

以下是我在NAS上使用到的一些服务，分为基础服务和可选服务：

### 基建服务

::: tip 提示
以下服务是我搭建NAS时的基础服务，确保系统稳定运行。
:::

| 服务名称 | 描述 |
| -------- | ---- |
| [Docker](./basic/docker.md) ![Docker](https://img.shields.io/badge/Docker-0db7f2?style=flat-square&logo=docker&logoColor=white) | 容器化应用管理 |
| [Portainer 容器管理](./basic/portainer.md) ![Portainer](https://img.shields.io/badge/Portainer-5c6b7d?style=flat-square&logo=portainer&logoColor=white) | 方便的Docker管理界面 |
| [Nginx 反向代理](./basic/nginx.md) ![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white) | 高性能的HTTP和反向代理服务器 |
| [DDNS-Go 动态DNS](./basic/ddns-go.md) ![DDNS-Go](https://img.shields.io/badge/DDNS-Go-ff3c00?style=flat-square&logo=cloudflare&logoColor=white) | 动态DNS服务 |
| [Samba 网络存储映射](./basic/samba.md) ![Samba](https://img.shields.io/badge/Samba-4e9e3a?style=flat-square&logo=samba&logoColor=white) | 网络共享文件服务 |
| [V2rayN 搭配 V2raya 代理服务](./basic/v2rayn.md) ![V2ray](https://img.shields.io/badge/V2ray-4b4b4b?style=flat-square&logo=vmware&logoColor=white) | 代理服务 |
| [qBittorrent BT下载器](./basic/qbittorrent.md) ![qBittorrent](https://img.shields.io/badge/qBittorrent-4a90e2?style=flat-square&logo=qbit&logoColor=white) | BT下载工具 |
| [Jellyfin 影音服务器](./basic/jellyfin.md) ![Jellyfin](https://img.shields.io/badge/Jellyfin-ff3d00?style=flat-square&logo=jellyfin&logoColor=white) | 自建影音流媒体服务器 |
| [Movie-Pilot 媒体整体与刮削](./basic/movie-pilot.md) ![Movie-Pilot](https://img.shields.io/badge/Movie--Pilot-ffcc00?style=flat-square&logo=movie&logoColor=black) | 媒体管理工具 |

---

### 可选服务

::: warning 注意
以下服务为可选项，用户可以根据个人需求选择安装与否。
:::

| 服务名称 | 描述 |
| -------- | ---- |
| MySQL 数据库 | 关系型数据库 |
| [TeamSpeak 游戏语音](./optional/teamspeak.md) ![TeamSpeak](https://img.shields.io/badge/TeamSpeak-1e90ff?style=flat-square&logo=teamspeak&logoColor=white) | 语音聊天工具 |
| [Alist 搭配 Merilisearch 私有云盘](./optional/alist.md) ![Alist](https://img.shields.io/badge/Alist-ff9000?style=flat-square&logo=alist&logoColor=white) | 私有云盘解决方案 |
| [ChatGPT-Web-Midjourney-Proxy 私有GPT UI](./optional/gpt.md) ![ChatGPT](https://img.shields.io/badge/ChatGPT-00bfff?style=flat-square&logo=openai&logoColor=white) | 私有GPT界面 |
| [Beszel 服务器监控](./optional/beszel.md) ![Beszel](https://img.shields.io/badge/Beszel-ff4500?style=flat-square&logo=monitor&logoColor=white) | 服务器监控工具 |

---

基建服务之间需要相互配合，以完成最基本的存储和影音需求。而可选服务则是我个人的额外需求，用户可以根据需要选择安装与否。