# Giscus 评论

文章底部使用官方 `giscus@1.6.0` Web Component，不需要后台服务或 GitHub Token。公开仓库与分类 ID 不是凭证；保留 GitHub 仓库的 Discussions 与 Giscus App 授权即可。

## 配置

`src/config.ts` 中的 `giscusConfig` 管理开关、仓库、分类、语言、浅色背景和主题地址。`bannerBackground: false` 可关闭评论卡片的淡背景；开启时自动使用 `siteConfig.banner.src`，不是文章封面。图片放在 iframe 外，由 Astro 优化；浅色透明度13%，深色隐藏，评论正文和输入区保留遮罩。

文章 frontmatter 支持：

```yaml
comments: false
```

默认开启；草稿不显示评论。也可以显式指定已有讨论：

```yaml
discussion: 123
```

或者用 `commentTerm: stable-key` 指定稳定的讨论搜索标识。优先级：frontmatter 的 discussion、已核验的历史讨论编号、commentTerm、迁移前路径、新文章路径。标题变化不会改变关联。

## 旧评论

迁移前插件版本 `@vuepress/plugin-comment@2.0.0-rc.70` 使用 pathname 映射、strict=1。pathname 规则去掉开头 `/` 和末尾文件扩展名，但保留目录尾部的 `/`。

已核验的三条历史讨论在 `src/data/giscus-discussions.json` 中直接按编号关联：cc-codex → #1（讨论标题还在使用更早的 code/cc-codex）、nas-guide → #2、try-wake-on-lan → #3。不修改或重建原讨论。其他迁移文章从 legacy-redirects.json 找到旧路径；新文章使用 posts/slug/。发现额外旧讨论时可补编号映射。

## 自定义外观与部署

`public/giscus/light.css` 和 `dark.css` 是完整独立样式，没有 @import。iframe 内的字体、圆角、边框和青蓝色配色与当前 Fuwari 的默认 hue=220 协调，链接和按钮使用较深的浅色模式颜色保证对比度。系统自动、手动深浅色切换都会同步；访客的任意 hue 滑块只改变博客外框，iframe 内使用固定配色，需要调整两份 CSS 的220才能改变它的主色。

Giscus 的 iframe 不能继承外部 CSS，也不能访问父页面 DOM。自定义 CSS 通过带 crossorigin 的 link 加载，服务器必须允许跨域。目前博客 Nginx 静态资源没有返回 CORS 头，GitHub Pages 域名又重定向到博客，因此默认使用 jsDelivr 的 GitHub 文件地址。

GitHub Actions 构建时用 GITHUB_SHA 将 CSS 地址锁定到同次提交，避免 main 分支缓存延迟。本机构建回退到 main。**首次发布前，新 CSS 尚未在 GitHub 上，本地页面使用默认 CDN 地址会返回404；需要提交并部署后才能通过该地址加载完整主题。** 本地视觉测试可以将两个 CDN CSS 请求映射到本地 public/giscus 文件，不会修改线上资源。不要为了预览把登录 Token 写进配置。

若更换 themeBaseUrl，可指向自己允许 `Access-Control-Allow-Origin: https://giscus.app`（或 `*`）的 HTTPS 静态目录。目录下须包含 light.css、dark.css。服务端响应需为 text/css。自定义 CSS 需随 Giscus 的 gsc- 类名变化维护。

## 加载与验证

接近评论区200px时才加载组件；错误/超时显示重试按钮和 GitHub 链接。通过自定义元素的连接/断开生命周期处理 Swup 页面替换和缓存恢复：旧 iframe、监听器、观察器会销毁，新文章重新初始化；不复用上一页的讨论。

```bash
pnpm test:giscus
pnpm check
pnpm build
```

手动验证：旧文章能读到原讨论；新文章显示空评论提示；切换文章、后退时只存在一个正确的 iframe；切换浅/深/跟随系统模式；检查浅色 banner、窄屏排版；模拟断网后重试。留言需要用户自己登录并提交，验证过程不自动发表评论或创建测试讨论。
