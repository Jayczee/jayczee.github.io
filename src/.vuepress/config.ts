import { defineUserConfig } from "vuepress";
import { getDirname, path } from "vuepress/utils";
import theme from "./theme.js";
import { searchConsolePlugin } from 'vuepress-plugin-china-search-console'

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
  ],

  plugins:[
  ]
  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
