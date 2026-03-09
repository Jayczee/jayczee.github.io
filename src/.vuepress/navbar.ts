import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "NAS",
    icon: "server",
    link: "/nas/",
  },
  {
    text: "系统与工具",
    icon: "tools",
    link: "/system/",
  },
  {
    text: "编程相关",
    icon: "code",
    link: "/projects/",
  },
  {
    text: "学习笔记",
    icon: "book",
    link: "/notes/",
  },
  {
    text: "随笔",
    icon: "pen",
    link: "/blog/",
  }
]);
