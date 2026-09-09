# Jayczee's Blog

基于 [Fuwari](https://github.com/saicaca/fuwari) 和 Astro 的个人博客。
上游模板版本：`6d39b0dec41282e7852e23e032998a5789abee28`。

本仓库已从 VuePress Theme Hope 迁移到 Astro，保留原仓库的全部 Git 历史。后续开发在 `jayczee.github.io` 目录进行。

## 本地运行

推荐 Node.js 22 和 pnpm 9.14.4（版本记录在 `.nvmrc` 和 `package.json`）。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发地址默认是 http://localhost:4321。Fuwari 的搜索依赖构建后生成的 Pagefind 索引，测试真实搜索请使用：

```bash
pnpm build
pnpm preview
```

预览地址默认是 http://localhost:4321。两个服务同时运行时请通过 `--port` 指定不同端口。

## 写文章

```bash
pnpm new-post my-post
```

文章位于 `src/content/posts/`，使用 Markdown：

```yaml
---
title: 文章标题
published: 2026-09-09
description: 一段简短的摘要。
tags: [Java]
category: 开发实践
draft: false
---
```

图片可以放在文章同级目录，通过相对路径引用；也可以放在 `public/assets/`，用 `/assets/...` 引用。

## 站点配置

- `src/config.ts`：站点名称、导航、头像、横幅、语言和主题色。
- `astro.config.mjs`：正式站点地址，当前为 `https://jayczee.cn/`。
- `src/content/spec/about.md`：关于页面。
- `src/components/Footer.astro`：页脚及备案信息。

代码块沿用 Fuwari 默认实现，没有额外覆盖。首页横幅与头像来自原博客现有资源。
模板的默认文章 CC 许可展示暂未启用；站点内容授权应由作者单独决定。`LICENSE` 保留 Fuwari 源码的 MIT 声明。

## 内容与分类

旧站 75 篇正文已全部迁入（含 NAS 总览），旧首页配置由 Fuwari 首页替代。文章日期依据旧仓库 Git 历史填写，保留新项目中已经人工调整的日期。正文仅做必要的格式与链接适配，未重新审核全部旧文的技术结论。

每篇文章使用一个主分类和 1～3 个标签，标签用于聚合同主题文章，统一大小写。目前共 41 个标签，优先复用已有标签；不为文中提到的每个工具、功能或术语单独建标签。

同一主题的细节归入核心标签，例如 Jellyfin 的字幕、字体和转码文章统一使用 `Jellyfin`，OpenClaw 的 Skills、EvoMap 文章统一使用 `OpenClaw`。日语笔记统一使用 `日语语法`；算法文章保留数组、双指针、动态规划等标签，LeetCode 归属由分类和专题表达，题号保留在标题中。RAG、MySQL 等独立主题即使暂时只有一篇，也可以保留标签。

| 分类 | 篇数 | 内容 |
| --- | ---: | --- |
| AI 与大模型 | 7 | RAG、Agent、AI 编程与本地模型 |
| 开发实践 | 4 | Java 项目、MySQL 笔记与博客开发 |
| 系统与工具 | 5 | 开发环境、命令行、文件系统与系统排错 |
| 网络与服务 | 9 | DNS、证书、反向代理、VPS 与远程访问 |
| NAS 与影音 | 11 | 容器服务、下载管理、媒体整理与播放 |
| 算法题解 | 32 | LeetCode 题目与 Java 实现 |
| 日语学习 | 5 | 教材笔记与语法学习 |
| 生活随笔 | 2 | 旅行与个人经历 |

`/series/` 提供 NAS 搭建（11 篇）、LeetCode（32 篇）和日语语法（4 篇）的顺序目录。系列文章通过 `series` 和 `seriesOrder` 声明归属和顺序，文章内提供同系列的前后篇链接。添加新系列时更新 `src/utils/series-utils.ts`。

迁移复制了正文引用的 75 个本地图片及 SVG。原文使用的外部图片保留原 URL；它们的可用性仍取决于原站。

## 旧地址兼容

新文章路径为 `/posts/<文件名>/`，算法和日语语法文章分别位于 `/posts/leetcode/`、`/posts/japanese/`。`src/data/legacy-redirects.json` 保存旧站文章及目录到新站的 83 条地址映射。

Astro 负责开发环境的跳转；构建后，集成插件将旧 `.html` 路径输出成实际 HTML 文件，并保留查询参数与章节锚点。文章内的 `legacy-anchor` 空标签用于保留旧版 VuePress 的 379 个章节地址，不要当作无用内容删除。

纯静态托管使用 HTML 跳转页和 canonical，不等同于 HTTP 301。也可以按映射在 Nginx 或托管平台配置 301。部署 workflow 会清理旧构建产物，避免旧文章文件覆盖新跳转页。

## 检查与部署

```bash
pnpm check
pnpm build
```

构建结果位于 `dist/`，包含 RSS、站点地图和搜索索引。`public/CNAME` 保留域名 `jayczee.cn`，`public/.nojekyll` 确保 GitHub Pages 正常提供 `_astro/` 等目录。

`.github/workflows/deploy-docs.yml` 在推送 `main` 时自动部署，也支持在 Actions 页面手动运行。流程使用 Node.js 22 和 `package.json` 指定的 pnpm 版本，依次安装锁定依赖、检查、构建，并发布到两个原有目标：

- GitHub Pages：将 `dist/` 同步至 `gh-pages` 分支并清理旧文件。仓库 Pages 设置继续使用 `gh-pages` 分支根目录，无需切换发布方式。
- 自有服务器：通过 SSH 和 rsync 将 `dist/` 同步至 `/www/jayczee-docs/`，不需要修改 Nginx 的站点根目录。

沿用现有仓库 secrets：`SSH_PRIVATE_KEY`、`REMOTE_HOST`、`REMOTE_USER`。服务器需要安装 `rsync`，SSH 用户需要该站点目录的写入和删除权限；workflow 会在部署前检查连接和基本环境。可选的 `SSH_KNOWN_HOSTS` 用于固定服务器公钥，未设置时通过 `ssh-keyscan` 获取。

服务器同步会删除 `dist/` 中已不存在的旧站文件，保留 `.well-known/` 证书验证目录和 `.user.ini`。该目录应只用于博客，不要在其中放置其他业务数据。GitHub Pages 与服务器发布是先后执行的，服务器发布失败时可修复环境后重新运行 workflow。

原站的搜索引擎验证 meta 标签保留在 `src/layouts/Layout.astro` 中。Fuwari 默认代码块样式不作额外修改。

## 版本管理

`.gitignore` 排除依赖、构建结果、环境变量、日志、截图及 `work/`、`.work/`、`outputs/` 等临时目录。
Markdown 默认被忽略，仅保留本 README 和 `src/content/` 下的文章、关于页面。临时笔记和代理报告不要放进内容目录；临时脚本、调试截图统一放在 `work/`。

主题源码、运行配置、依赖锁文件、博客资源及上游许可进入版本管理。
