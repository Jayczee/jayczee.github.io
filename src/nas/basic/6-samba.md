---
title: Samba 文件共享服务配置
order: 6
isOriginal: true
category:
    - NAS
tag:
    - samba
    - docker
---

## 📖 什么是 Samba？

**Samba** 是一个开源项目，允许在 Linux 和 Windows 系统之间共享文件和打印机。它实现了 SMB/CIFS 协议，使得不同操作系统之间能够无缝地进行文件共享。Samba 被广泛应用于家庭和企业网络中，可以轻松地将 Linux 服务器或 NAS (网络附属存储) 变成文件共享服务器。

## 🚀 Samba 的优势

- **跨平台支持**：Samba 使得 Windows 和 Linux 系统之间的文件共享变得简单，用户可以在不同的操作系统上访问共享文件。
- **权限管理**：通过 Samba，用户可以灵活地设置文件和目录的访问权限，确保数据安全。
- **易于配置**：Samba 提供了简单的配置文件，用户可以根据需求快速进行设置。

## 🛠️ 使用 Docker 部署 Samba

通过 Docker 部署 Samba 是一种便捷的方式，可以快速搭建文件共享服务。以下是一个基本的 Docker Compose 配置示例，用于启动 Samba 服务。

### Docker Compose 配置

```yaml
services:
  samba:
    image: dperson/samba
    container_name: samba
    ports:
      - "137:137"
      - "138:138"
      - "139:139"
      - "445:445"
    volumes:
      - /mnt:/mnt
    environment:
      - USERID=0
      - GROUPID=0
      - SAMBA_USER=root
      - SAMBA_PASS=
    command: -u "root" -s "mnt:/mnt:rw"
```

### 配置说明

- **image**: 使用 `dperson/samba` 镜像，这个镜像是一个轻量级的 Samba 服务器。
- **container_name**: 设置容器的名称为 `samba`，便于管理。
- **ports**: 映射 Samba 服务的端口，以便外部访问：
  - `137`: NetBIOS 名称服务
  - `138`: NetBIOS 数据报服务
  - `139`: NetBIOS 会话服务
  - `445`: SMB/CIFS 服务
- **volumes**: 将宿主机的 `/mnt` 目录挂载到容器内的 `/mnt` 目录，允许共享文件。我通常会将NAS的机械硬盘挂在到宿主机的/mnt,此处直接同步挂载到容器的/mnt内，保证容器也能访问后面添加的硬盘。
- **environment**: 设置环境变量以配置 Samba 用户：
  - `USERID` 和 `GROUPID` 设置为 `0`，表示使用 root 用户。
  - `SAMBA_USER` 设置为 `root`，表示 Samba 用户名。
  - `SAMBA_PASS` 设置为空，表示不设置密码（可根据需要修改）。
- **command**: 指定 Samba 的启动命令，`-u "root"` 表示使用 root 用户，`-s "mnt:/mnt:rw"` 表示共享 `/mnt` 目录，并设置为可读写。

## ⚠️ 注意事项

- **安全性**：在生产环境中，不建议使用 root 用户和空密码。应创建专用用户并设置强密码。此处我使用samba服务仅为了内网机器互相连接，为了我可以在个人PC上方便管理NAS的文件，所以没有设置密码。
- **防火墙设置**：确保宿主机的防火墙允许 Samba 服务的端口访问。

## 🔍 访问 Samba 共享

1. **启动 Docker 容器**：
   在Portainer的Stack Web Editor中添加上述配置文件，点击Deploy the stack部署samba docker服务。

2. **访问 Samba 共享**：
   - Windows 系统中，可以在文件资源管理器中输入 `\\<宿主机IP>\mnt` 访问共享文件夹。
   - Linux 系统中，可以使用命令行挂载 Samba 共享：
     ```bash
     sudo mount -t cifs //<宿主机IP>/mnt /mnt -o username=root,password=
     ```