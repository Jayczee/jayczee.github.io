---
title: 🏠 个人的NAS最佳实践
category:
    - NAS
---

## 📖 NAS简介

> **NAS（Network Attached Storage）**，即网络附属存储，是中年男人三大爱好之一（我毕业的时候入的坑，所以我一毕业就成为了中年...bushi）。

在如今的市场上，有许多成品NAS可供选择，例如威联通、群晖和绿联等知名品牌。这些品牌提供各自独特的NAS系统，用户购买后可以快速进行配置，以满足个人需求。然而，对于像我这样的刚毕业的穷鬼来说，成品NAS的价格往往难以承受。因此，更倾向于使用一台纯净的服务器，从零开始自己搭建NAS，这样不仅能节省开支，还能学习到许多新知识。

---

## 🔍 NAS的本质

NAS的本质其实很简单，无论它的名称如何，它仍然是一台承载各种服务的服务器。只要手上有一台电脑，无论是 **Windows**、**Linux** 还是 **Mac OS**，都可以实现NAS的功能。我的第一台NAS就是大学时使用的笔记本电脑，刷成了Linux系统。笔记本电脑作为NAS的优点在于：

- **功耗低**：相较于传统服务器，笔记本电脑更节能。
- **自带UPS电源**：即便断电也能保证数据安全。
- **独立显卡**：可以用于影音解码，提升观看体验。

---

## ❓ 为什么需要NAS？

初步接触NAS是出于兴趣，想了解相关技术。但在深入研究后，明确了自己的需求，发现NAS在以下几个方面非常有用：

- 📂 **文件备份**：安全存储重要文件，避免丢失。
- 🎥 **高清影音播放**：随时随地享受高质量的影音内容。
- 🌐 **个人服务器需求**：搭建自己的网络服务，实现个性化需求。

---

## 🌍 公网IP

NAS设备最好拥有一个公网IP以支持其下载与上传的功能（PT），无论是IPv4还是IPv6都可以，但需要注意的是，IPv6在老旧设备上可能不被支持，通常是由于网卡过于陈旧。如果有条件的话，可以更换新的网卡，例如某宝上几十块的2.5G有线网卡就足以胜任。没有公网IP也行，只不过在PT时能够发现的用户比较少，在做种时无法连接和你同样是内网的用户。

---

在某些地区，运营商（大部分是电信，其次是联通，移动基本没有）会提供动态的公网IPv4。这意味着公网IP会不定时刷新，每次刷新时还可能会短暂断网。为了方便在外网访问NAS，需要“以不变应万变”：

- 将一个不变的域名解析到设备的IP地址。
- 在设备IP地址变化时更新解析记录，确保域名解析的IP地址始终是设备最新的公网IP。

这样，就可以通过域名在外网访问设备或设备中的服务，几乎可以屏蔽公网IP变化带来的不便。这就是**动态DNS（DDNS）**的作用。

::: tip
**相关文章：** [DDNS-GO 动态DNS](./basic/3-ddns-go.md)
:::

## ⚙️ 常用服务

以下是我在NAS上使用到的一些服务，分为基础服务和可选服务：

### 基建服务

::: tip 提示
以下服务是我搭建NAS时的基础服务，确保系统稳定运行。
:::

| 服务名称 | 描述 |
| -------- | ---- |
| [Docker](./basic/1-docker.md) ![Docker](https://img.shields.io/badge/Docker-0db7f2?style=flat-square&logo=docker&logoColor=white) | 容器化应用管理 |
| [Portainer 容器管理](./basic/2-portainer.md) ![Portainer](https://img.shields.io/badge/Portainer-5c6b7d?style=flat-square&logo=portainer&logoColor=white) | 方便的Docker管理界面 |
| [Nginx 反向代理](./basic/5-nginx.md) ![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white) | 高性能的HTTP和反向代理服务器 |
| [DDNS-Go 动态DNS](./basic/3-ddns-go.md) ![DDNS-Go](https://img.shields.io/badge/DDNS-Go-ff3c00?style=flat-square&logo=cloudflare&logoColor=white) | 动态DNS服务 |
| [Certbot](./basic/4-certbot.md) ![Certbot](https://img.shields.io/badge/Certbot-003b57?style=flat-square&logo=letsencrypt&logoColor=white) | 自动化SSL证书管理 |
| [Samba 网络存储映射](./basic/6-samba.md) ![Samba](https://img.shields.io/badge/Samba-4e9e3a?style=flat-square&logo=samba&logoColor=white) | 网络共享文件服务 |
| [V2rayN 搭配 V2raya 代理服务](./basic/9-v2rayn.md) ![V2ray](https://img.shields.io/badge/V2ray-4b4b4b?style=flat-square&logo=vmware&logoColor=white) | 代理服务 |
| [qBittorrent BT下载器](./basic/7-qbittorrent.md) ![qBittorrent](https://img.shields.io/badge/qBittorrent-4a90e2?style=flat-square&logo=qbit&logoColor=white) | BT下载工具 |
| [Jellyfin 影音服务器](./basic/8-jellyfin.md) ![Jellyfin](https://img.shields.io/badge/Jellyfin-ff3d00?style=flat-square&logo=jellyfin&logoColor=white) | 自建影音流媒体服务器 |
| [Movie-Pilot 媒体整体与刮削](./basic/10-movie-pilot.md) ![Movie-Pilot](https://img.shields.io/badge/Movie--Pilot-ffcc00?style=flat-square&logo=movie&logoColor=black) | 媒体管理工具 |

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

基建服务之间需要相互配合，以完成最基本的存储和影音需求。而可选服务则是个人的额外需求，用户可以根据需要选择安装与否。