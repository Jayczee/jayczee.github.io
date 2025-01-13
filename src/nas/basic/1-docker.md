---
title: Docker
order: 1
category:
    - docker
    - 教程
---
<img src="https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/docker.svg" /> 


## 相关链接

- [Docker 官网](https://www.docker.com/)
- [Docker 文档](https://docs.docker.com/)
- [Docker Desktop 安装 (Windows系统推荐)](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Engine 安装 (Linux及Mac系统推荐)](https://docs.docker.com/engine/install/)


## 安装说明

本教程不详细描述安装过程，可以根据官方文档的步骤进行安装。对于Windows系统，推荐安装**Docker Desktop**，它提供了图形用户界面，使用起来更加方便。喜欢使用命令行的朋友可以选择安装**Docker Engine**。


## 使用教程

Docker的使用可以参考[Docker 菜鸟教程](https://www.runoob.com/docker/docker-tutorial.html)。该教程简明易懂，跟着操作一遍即可掌握基础功能，后续可以在实践中逐步提升。


## 为什么要安装 Docker？

在[个人最佳实践](/nas/README.md)中提到的服务都可以直接安装在宿主机上，也就是直接在Windows、Linux或Mac OS系统中进行安装。那么，为什么还需要再套一层Docker呢？

1. **避免冲突**：许多服务需要依赖特定的库和版本，不同服务之间可能会产生冲突。
   
2. **简化卸载**：在宿主机上卸载某个服务时，需要逐步卸载软件并删除配置文件夹，这个过程非常繁琐，稍有不慎就可能留下残留文件，后续维护工作也会变得复杂。


## 镜像与容器

**镜像**是一个轻量级、可执行的独立软件包，包含了运行某个应用所需的所有代码、库和依赖。**容器**则是镜像的运行实例，它提供了一个隔离的环境来运行应用，确保应用在不同环境中具有一致的运行效果。

## Docker Hub
[Docker Hub](https://hub.docker.com)是一个Docker镜像站（需要开启代理访问），里面包含了大量镜像资源，也是docker pull命令默认拉取的镜像仓库。


## 相关文章

- [Docker 镜像加速/代理](/nas/docker-proxy.md)
