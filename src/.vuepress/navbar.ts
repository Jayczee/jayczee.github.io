import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "NAS",
    icon: "server",
    link: "/nas/",
  },
  {
    text: "Linux",
    icon: "fab fa-linux",
    link: "/linux/"
  },
  {
    text: "Win",
    icon: "fab fa-windows",
    link: "/windows/"
  },
  {
    text: "编程相关",
    icon: "pen-to-square",
    link: "/code/"
  },
  {
    text: "学习笔记",
    icon: "book",
    link: "/note/"
  }
]);
