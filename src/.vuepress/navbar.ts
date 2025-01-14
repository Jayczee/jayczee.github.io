import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "NAS",
    icon: "server",
    link: "/nas/",
  },
  {
    text: "编程相关",
    icon: "pen-to-square",
    link: "/code/"
  }
]);
