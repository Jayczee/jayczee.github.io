---
title: Markdown修改Mac风格代码块  
isOriginal: true  
star: true  
category:  
  - Linux  
tag:  
  - vuepress  
---

使用Vuepress编写markdown文档时，默认的代码块样式比较干。很多博客文章的代码块采用mac风格边框，视觉性比较好，该边框可以通过修改全局CSS实现。

可以在 `.vuepress/styles/index.scss` 中插入以下全局样式：

```css
.theme-hope-content pre {
  position: relative;
  padding-top: 2.2em !important;
  border-radius: 12px !important;
  background-color: #2e2e38 !important; /* 由#1e1e1e变为#2e2e38 */
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
  overflow: hidden;
}

.theme-hope-content pre::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 2em;
  width: 100%;
  background: #3a3a45; /* 由#2c2c2c变为#3a3a45，稍亮 */
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  z-index: 10;
}

.theme-hope-content pre::after {
  content: "";
  position: absolute;
  top: 0.6em;
  left: 1em;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 24px 0 0 #ffc107, 48px 0 0 #4caf50;
  background-color: #f44336;
  z-index: 15;
  display: block;
}
```

我是用的Vuepress theme hope主题，代码高亮默认使用shiki插件。由于修改成mac风格后代码块底色偏暗，原本灰色的注释文字变得看不清，可以通过修改shiki主题解决：[shiki themes](https://shiki.style/themes)。

这里我选择的是VS Code风格的`dark-plus`，效果不错。

如果是Vuepress theme hope主题，修改 `.vuepress/theme.ts`：

```ts
export default hopeTheme({
  // ...其他配置
  markdown: {
    highlighter: {
      type: 'shiki',
      lineNumbers: false, // 关闭行号显示
      theme: 'dark-plus'  // 修改主题
    },
  }
})
```

这样修改后，代码块既有Mac风格的边框效果，也保证了注释的可读性。