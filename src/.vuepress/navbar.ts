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
    link: "/win_linux/ollama.md"
  },
  {
    text: "编程相关",
    icon: "pen-to-square",
    link: "/code/way-to-define-model-value.md"
  },
  {
    text: "学习笔记",
    icon: "book",
    link: "/note/mysql.md"
  },
  {
    text: "其他",
    icon: "ellipsis",
    link: "/etc/journal-to-japan.md"
  }
]);
