---
title: Openclaw Skills
isOriginal: true
category:
    - Linux
    - Openclaw
tag:
    - openclaw
---

## 前言
起初是因为刚装好的Openclaw不自带websearch的能力，需要MCP或Skills来拓展，所以就在[ClawHub](https://clawhub.ai)上检索websearch以及其他用得上的Skills。

之所以没有第一个想到使用MCP（我使用Gemini CLI， Codex CLI等是优先使用MCP的），在我看来我MCP的大部分作用由于龙虾已经获得了宿主机的大部分权限所以就不再需要了。

安装skills之前需要在宿主机上安装clawhub，而且需要登录，防止安装skills碰到rate limit问题。 

安装SKILLS时可以直接告诉openclaw让其自己安装，不过会花费token。 

愿意动手可以自己在宿主机中安装clawhub来手动安装，然后配置仍然交由openclaw。

## 登录

在clawhub注册账号后，可以在宿主机上运行`clawhub login`进行登录。

默认会提供一个认证链接，进入页面进行认证之后会回调临时起的本地服务。
如果无效，则重新进入登录链接，他在回调之前，页面上会提示，如果重定向失败请复制token：XXXX。复制该token，在宿主机中运行命令`clawhub login --token <token>`即可。

## 安装

告诉openclaw skill名称（即skill url最后的部分，例如`tavily-search`）和需要的配置信息即可。或者在宿主机运行：

```bash
clawhub install xxx
```

随后手动配置，或让openclaw配置。

## [Tavily Web Search `tavily-search`](https://clawhub.ai/arun-8687/tavily-search)

WebSearch能力通常都需要配合Api Key来使用，具有相同功能的还有Brave Search。这款优点在于对返回结果干净，对LLM友好。

先通过[Tavily官方](https://www.tavily.com/)获取API Key，免费额度有每个月1000Credits。同时他也支持MCP方式的接入。

将clawhub相关页面的url和申请到的API Key直接告诉openclaw让它自己配置即可。

## [Agent Browser `agent-browser`](https://clawhub.ai/TheSethRose/agent-browser)

Agent专用的无头浏览器，0配置，开箱即用。

## [Baidu Search `baidu-search`](https://clawhub.ai/ide-rea/baidu-search)

用于补充中文web search，需要到百度千帆平台创建API Key，每日有1000次赠送的免费搜索的额度。

## [Multi Search Engine `multi-search-engine`](https://clawhub.ai/gpyAngyoujun/multi-search-engine)

这款web search比较粗暴，***不需要api key***，只是使用自带的web fetch功能拼接url，去各大搜索引擎搜索结果然后总结归纳。

## [ByteRover `byterover`](https://clawhub.ai/byteroverinc/byterover)

简单来说，它可以完成保存编码记忆、检索记忆、跨 IDE / 跨 Agent 复用、团队共享以及降低重复错误、提升代码一致性。

## [Openclaw Youtube Transcript `openclaw-youtube-transcript`](https://clawhub.ai/YoavRez/openclaw-youtube-transcript)

最近网上比较火的一个应用，通过youtube链接来总结视频，但是它是通过字幕来总结的，不分析音频，对无字幕视频就有些困难了。

## [Find Skills `find-skills`](https://clawhub.ai/JimLiuxinghai/find-skills)

可以让龙虾自己寻找合适的skill来完成当前任务。

