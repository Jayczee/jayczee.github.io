import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "NAS",
    icon: "server",
    link: "/nas/",
  },
  {
    text: "Win & Linux",
    icon: "fab fa-linux",
    link: "/win_linux/"
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
