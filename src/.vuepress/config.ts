import { defineUserConfig } from "vuepress";
import { getDirname, path } from "vuepress/utils";
import theme from "./theme.js";
import { slimsearchPlugin } from '@vuepress/plugin-slimsearch'

const __dirname = getDirname(import.meta.url);

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "Jayczee's Blog",
  description: "Whispering for nothing",

  theme,

  alias: {
    "@theme-hope/modules/blog/components/BlogHero": path.resolve(
      __dirname,
      "./components/BlogHero.vue",
    ),
  },

  head: [
    ['meta', {name: 'baidu-site-verification', content: 'codeva-A6fpwUixCj'}],
    ['meta', {name: 'bytedance-verification-code', content: 'ZlYWRrDBxWLFrd/pzdTw'}],
    ['meta', {name: 'shenma-site-verification', content: 'b27a1373bace84bc712ba22193609294_1739525350'}],
  ],

  plugins:[
    slimsearchPlugin({
      // 配置项
      indexContent: true,
      suggestion: false
    }),
  ]
  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
