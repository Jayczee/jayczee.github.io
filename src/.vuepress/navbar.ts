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
    text: "编程相关",
    icon: "pen-to-square",
    link: "/code/"
  }
]);
