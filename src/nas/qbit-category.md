---
title: qBittorrent 分类管理
isOriginal: true
category:
  - NAS
tag:
  - qbittorrent
---

刚开始用qBittorrent时，发现了分类这么一个功能，并且我在创建分类时，还可以填写存储位置。

![qBittorrent创建分类](/assets/images/nas/qbittorrent/qbit-3.png)

此时我当然想到既然分类和存储位置相关，那么在新建下载的时候，只要选择好分类，就能自动填写存储位置，**毕竟qBittorrent填写存储位置时竟然不会联想**。

于是立刻实操。

首先右键新建分类，然后左上角新建下载时选择分类，然并卵。。。。。。

此时创建的下载任务，分类一栏确实显示了我增加的分类，但是下载地址仍然要我自己填写。

折腾了半天，发现了需要如下设置：

![qBittorrent自动分类管理](/assets/images/nas/qbittorrent/qbit-4.png)

将分类管理设成`自动`后，修改分类时才会自动填写存储路径。并且还可以实现修改已下载文件的分类时自动转移文件位置的功能。

::: tip
在将该选项设为自动后，使用其他媒体整理工具（nastool、moviepilot等）的相关功能时也可以根据qBittorrent的分类来管理资源。例如`自动刷流`插件。
:::