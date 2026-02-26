---
title: Openclaw 安装与配置
isOriginal: true
category:
    - Linux
    - Openclaw
tag:
    - openclaw
---

最近经常刷到Openclaw相关的东西，在年（2026）前浅浅尝试了一下，为了方便使用了别人封装的openclaw的快速配置脚本，最终连接到telegram bot后就停止了。

使用第三方脚本是因为当时openclaw官方被攻击了还是咋，点进去vercel报错页面404，没招啊，当时还是叫clawdbot和moltbot。

此次在我的nas上进行安装，nas使用的系统是Debian 12。

## 官网地址

[Openclaw](https://openclaw.ai/)

在官网找到链接如下：

![Install Link](/assets/images/windows/openclaw/install.png)

## 安装步骤

### 下载运行安装脚本

注意科学，下载官网脚本可能会由于网络原因失败

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

运行命令后显示界面如下，下载必要组件后会运行openclaw docter检查并帮助你完成各项配置。

![Openclaw Install](/assets/images/windows/openclaw/install2.png)

### Openclaw 配置

Openclaw doctor会检查gateway状态，如果没有安装或配置，会提示以下相关信息：

```bash
gateway.mode is unset; gateway start will be blocked.            
Fix: run openclaw configure and set Gateway mode (local/remote). 
Or set directly: openclaw config set gateway.mode local          
Missing config: run openclaw setup first.
```

:::tips
此处提到了`Gateway mode`概念，区别如下：
1. `local`: 网关运行在你的本机（127.0.0.1）。只有你这台电脑上的程序能访问它。简单来说仅允许本机访问openclaw。
2. `remote`: 网关监听所有网络接口（0.0.0.0）。允许其他电脑通过网络访问你的 OpenClaw。允许其他设备通过网络访问openClaw。

由于我是安装在我的nas上的，平常我需要通过其他设备访问，所以我的安装选择必然是`remote`。
:::

- I understand this is powerful and inherently risky. Continue?
    - 安全条款协议，需要安装仅能选Yes。

- Onboarding mode
    - 此处提供了快速安装和手动配置两个选项，初次安装可以选择快速安装QuickStart。

- Model/auth provider
    - 此处选择ai服务提供商，根据自己的需要，我选择的是Google。选择服务商后会让你选择使用API key或者网页Oauth其一方式进行认证。如果选择的是国外AI服务商记得科学，否则认证会失败。此处我使用google oauth方式要求我在nas上也要安装google CLI。随后提供一个URL让我登录谷歌账号，登陆完成后给我一个auth code输入进CLI完成认证。

- Generate and configure a gateway token now? 
    - 如果是初次安装或者gateway auth未配置，则选择Yes来生成新的token用于gateway的身份验证。

-  Tighten permissions on ~/.openclaw to 700?
    - Yes。限制openclaw的配置文件夹仅当前登录的用户可读写。

- Create Session store dir at ~/.openclaw/agents/main/sessions?
    - 创建目录用于持久化保存openclaw的对话。

- Enable bash shell completion for openclaw? 
    - 该功能用于开启openclaw命令的自动补全。开启后再终端输入`openclaw`时可以自动补全剩余的命令。

- Install gateway service now?
    - 如果未安装就选择Yes立即安装gateway服务。

- Gateway service runtime
    - 2026-02-26我选择的是Node，因为脚本中官方提示bun会出内存相关问题。

以上选项选择完后会进行openclaw的node环境安装并且重启完成安装。

## 访问Openclaw Web GUI

因为我是在nas上进行安装的，openclaw安装脚本默认给我的gateway设置成了local，我仅能在nas上访问，但是我的nas又是无GUI的纯命令行。

openclaw官方很贴心的检测到并提示我们可以用打隧道的方式，直接端口转发。

```
Dashboard URL: http://127.0.0.1:18789/#token=xxx
Copy to clipboard unavailable.
No GUI detected. Open from your computer:
ssh -N -L 18789:127.0.0.1:18789 root@192.168.10.229
Then open:
http://localhost:18789/
http://localhost:18789/#token=xxx
Docs:
https://docs.openclaw.ai/gateway/remote
https://docs.openclaw.ai/web/control-ui
```

在同一局域网的有GUI的机器，比如windows，macos，或者带GUI 的linux运行上述命令，然后访问地址即可。

:::warning
请确保openclaw的gateway已经启动，否则没有服务在监听对应端口时是无法打通隧道的。
:::

打通隧道后没有什么提示，弄得我一度以为没有打通隧道。

![Tunnel](/assets/images/windows/openclaw/install3.png)

最终进入Web GUI的界面如下：

![Openclaw Web GUI](/assets/images/windows/openclaw/install4.png)

Openclaw的可玩性很高，配合MCP和Skills可以让他做很多事。比如我现在可以让他将这篇刚写的文章推送到我的github，甚至假设我没有github action的话还可以让他帮我写一个，实现一行命令部署博客的功能。

刚刚某个小玩具项目收到一个issue，直接让openclaw分析issue，pull，修改，测试，push，pr一套包圆了