---
title: 给创维电视去广告：不 root，只用 ADB
published: 2026-10-20
description: 开机广告、关机广告、屏保广告轮着来，实在忍不了。用 ADB 扫出局域网里的电视，把酷开那套广告包禁掉，顺手记下几个坑。
image: /assets/images/skyworth-tv-debloat/cover.png
category: 系统与工具
tags:
  - Android TV
  - ADB
draft: false
---

家里有台创维电视A7D，经典国产电视广告满天飞。

忍了很久，这周研究了一下，尝试删除。

省流：只用了 ADB。删掉广告相关的系统包即可。

## 先把电视找出来

由于想到折腾这个的时候是在远程操作，忘掉了家里电视的局域网IP。虽然电视是插网线的，路由器后台的 DHCP 列表里肯定有，但又懒得登路由器，干脆直接扫网段。

ADB一般走 5555 端口，直接扫。PowerShell 7 的 `ForEach-Object -Parallel` ：

```powershell
$targets = 1..254 | ForEach-Object { "192.168.10.$_" }
$targets | ForEach-Object -ThrottleLimit 64 -Parallel {
  $c = [System.Net.Sockets.TcpClient]::new()
  try {
    $t = $c.ConnectAsync($_, 5555)
    if ($t.Wait(700) -and $c.Connected) { $_ }
  } catch {} finally { $c.Dispose() }
}
```

结果只出来一个地址：`192.168.10.175`。顺手 `arp -a` 看了 MAC（`08-28-02-66-c6-d5`），因为家里的设备只有电视开着ADB调试，所以基本断定这就是电视。

如果电视支持 mDNS，`adb mdns services` 也能直接列出来，我这台没反应，只能硬扫。

## 连上去，先摸个底

连接之前，负责连接的设备需要装adb库。

```bash
adb connect 192.168.10.175:5555
adb devices -l
```

```text
192.168.10.175:5555   device product:Sky_rtk2885n_8R145_A5D model:8R134_A7D device:rtk2885n
```

创维 8R134_A7D，Realtek rtk2885n 的方案。因为之前我已经开过电视里的网络调试开关，所以连上的时候电视没弹授权框，我记得应该是要弹的（存疑）。

再查版本：

```bash
adb shell "getprop ro.product.brand; getprop ro.build.version.release; getprop ro.build.type"
```

```text
Skyworth
11
user
```

`user` 版本，也就是说 `/system` 只读，没有 root 可玩。这台机器总共 3.2G 内存，开机就用掉 2.3G，一台电视能吃掉这么多，后台确实有东西在跑。

## 广告位置

`pm list packages -s` 列系统包，一眼就能看出是酷开的底子，包名清一色 `com.tianci.*` 和 `com.coocaa.*`。

其实直接看包名就看出个大概了：

```bash
adb shell "dumpsys package com.tianci.ad | head -60"
```

输出的 Activity 列表几乎是自报家门：

- `com.tianci.ad/.ui.BootViewActivity`，挂在 `com.tianci.ad.bootview` 这个 action 上，开机广告
- `com.tianci.ad/.PowerOffActivity`，`com.tianci.ad.poweroff`，关机广告
- `com.tianci.ad/.ScreensaverActivity`，`com.tianci.ad.screensaver`，屏保广告
- `com.tianci.ad/com.coocaa.adsdk.landing.LandingWebActivity` 这一类，广告落地页
- `com.tianci.ad/com.coocaa.adcore.ActiveTaskActivity`，任务型广告

其实这样也挺好的，厂家把广告整合到几个包里，只删除包就行了，要是内嵌到正经服务里那就吐了。

## 只禁，不卸

毕竟莫得源码进行分析，不知道直接删除会不会把把电视弄成大块板砖了，所以先备份一份数据，然后只采用禁用的方案。

使用的命令是 `pm disable-user`。想要恢复`pm enable` 就回来了；

先记一份当前的禁用列表，出事了方便对照：

```bash
adb shell "pm list packages -d" > backup.txt
```

然后照名单来：

```powershell
$pkgs = @(
  "com.tianci.ad",
  "com.tianci.push",
  "com.tianci.autoinstaller",
  "com.coocaa.messageprovider",
  "com.coocaa.lifeassistant",
  "com.coocaa.screensaver",
  "com.coocaa.NewStoreSystem",
  "com.coocaa.app_browser",
  "com.coocaa.guide"
)
foreach ($p in $pkgs) { adb shell "pm disable-user --user 0 $p" }
```

| 包名 | 干什么的 |
| --- | --- |
| `com.tianci.ad` | 广告 SDK 本体，开机、关机、屏保、落地页都在这 |
| `com.tianci.push` | 广告推送 |
| `com.tianci.autoinstaller` | 静默装 App 的那位 |
| `com.coocaa.messageprovider` | 消息中心，推的基本是广告 |
| `com.coocaa.lifeassistant` | 生活助手，首页推荐位之一 |
| `com.coocaa.screensaver` | 酷开屏保 |
| `com.coocaa.NewStoreSystem` | 新商店，同上 |
| `com.coocaa.app_browser` | 内置浏览器，广告落地页会用 |
| `com.coocaa.guide` | 开机引导，带推荐下载 |

每条回一句 `new state: disabled-user`，九个全过。

## 应用商店不能禁

一开始名单里还有 `com.tianci.appstore`。禁掉之后开机、桌面都正常，但点“我的应用”会直接提示已被禁用。

查了一下，这个页面其实长在应用商店里：

```text
coocaa.intent.action.APP_STORE_MYAPPS
  -> com.tianci.appstore/...appstore3.pages.home.v3.AppStoreHomeActivityV3
```

自己装的 Kodi、Jellyfin 都在这个列表里，禁了等于把自己的应用入口也一起关了。所以这个包最后又放回去了：

```bash
adb shell pm enable com.tianci.appstore
```

商店里的推荐位会跟着回来一点，但开机、关机、屏保、推送这些大头还是禁着的。

## 这台机器不能 `adb reboot`

随后重启验证，`adb reboot` 直接报错：

```text
/system/bin/sh: /system/bin/reboot: inaccessible or not found
```

`/system/bin/reboot` 压根不存在，真正的在 `/vendor/bin/` 下。换成 `svc power reboot`，命令没报错，五秒后设备离线。

然后再也没回来。

ping 不通，`arp -a` 里 MAC 也没了。我甚至试了 WoL，魔术包往 `192.168.10.255` 和 `255.255.255.255` 的 9、7 端口各发了一轮，一点反应都没有。后来才反应过来，这台机器的 `svc power reboot` 压根没在重启，是直接关机了。

最后只能走过去按遥控器的电源键。

重启了，完美。开屏清爽。

## 还剩什么

按这几个包的分工，开机广告、关机广告、屏保广告、推送弹窗和商店推荐都该没了。

还在的：

- **桌面**。`com.tianci.de` 是创维的桌面，它自己内嵌了一套 `com.coocaa.adsdk.landing.*` 的 Activity，首页那排“精选”就是它画的。禁掉它就没桌面了，只能换第三方 launcher，这就不是小改了，没继续折腾。
- **App 里的贴片**。小电视、芒果这些，广告是服务端下发的，本地删不掉，除非买会员，在考虑dns侧的禁用，不知道有没有效果。

## 一键恢复

```bash
adb shell pm enable com.tianci.ad
```

九个包挨个 `pm enable`。

---

还好广告包独立。禁包还是轻轻松松。