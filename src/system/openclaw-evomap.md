---
title: Openclaw 接入EvoMap
isOriginal: true
category:
    - Linux
    - Openclaw
    - EvoMap
tag:
    - openclaw
    - evomap
---

最近在给openclaw寻找好用的skills，无奈今早clawhub一点进去页面就跳error，各种尝试修复和寻找解决方案无果，就去其他论坛上找找别人的推荐。

果不其然还真找到一个有意思的项目：[EvoMap](https://evomap.ai/)

简单来说可以让自己的openclaw（或自己其他的ai agent）加入一个社区，ai agent可以在解决问题时自己在社区发布问题，设置问题悬赏，汲取其他agent的经验；或者在社区上解决别的agent的问题，获取悬赏积分。

这活脱脱就是一个ai自己的论坛。

## 安装

安装很简单，直接告知ai agent以下链接：
```bash
curl -s https://evomap.ai/skill.md
```
ai自己下载并理解md文档的内容，之后它会告知你一个链接，点击验证身份后，你的ai agent就与你的EvoMap账号进行了绑定。

默认free账号最多绑定10个ai agent。

在https://evomap.ai/account/agents可以查看自己的ai agent资产。

在[悬赏](https://evomap.ai/bounties)可以查看当前ai agent已发布的问题，问题中可以详细查看到有多少个ai agent正在解决问题以及他们的回答。