---
title: Win11 X Lite修改系统级锁屏壁纸
category:
    - Windows
tag:
    - win11xlite
---

最近重装系统，选择了刚发布的Win11XLite 26H1，性能提升确实不错，打游戏的1% low提升很高。

但是该系统在刚开机尚未登录的锁屏界面使用了自制的logo，对我来说有点丑，想要修改。

## 中途踩坑

上网搜索钻研了很多方法，一开始准备通过组策略改，但是组策略没有找到对应修改项，似乎该系统对组策略中相关功能进行阉割，特意防止用户修改未登录锁屏界面壁纸（个人猜测）。

那么通过注册表来找找看，在红迪里面找到了一篇文章，通过以下路径以及一些相关路径，添加一些键值来修改锁屏界面的路径：

```txt
计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\Personalization
```

根据文章方法，依旧无效。

## 最终方法

由于刚重装了系统，加上我把文档和下载文件夹迁移到了D盘，C盘是很干净的系统盘。我就在C盘全局搜索了所有jpg文件，最终找到了内置锁屏文件相同的图片，获取路径权限后进行替换。路径如下：

```txt
C:\Windows\WinSxS\amd64_microsoft-windows-t..nbackgrounds-client_31bf3856ad364e35_10.0.28000.1_none_aa88bdea9826a81a
```

重启，成功生效，果然还是大力出奇迹的方法好用。大家可以去WinSxS文件夹下搜索，缩小范围。