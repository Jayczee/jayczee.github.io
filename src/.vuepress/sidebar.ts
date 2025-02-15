import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
  ],
  "/nas":[
    "",
    {
      text: "基建服务",
      collapsible: true,
      expanded: true,
      prefix: "basic/",
      children: [
        "1-docker.md","2-portainer.md","3-ddns-go.md","4-certbot.md",
        "5-nginx.md","6-samba.md","7-qbittorrent.md","8-jellyfin.md",
        "9-v2rayn.md","10-movie-pilot.md",
      ]
    },
    {
      text: "可选服务",
      collapsible: true,
      expanded: true,
      prefix: "optional/",
      children: [
        "alist.md","beszel.md","gpt.md","teamspeak.md"
      ]
    },
    "qbit-category.md",
    "jellyfin-encode-decode.md"
  ],
  "/code":[
    "fedex-crawler.md"
  ],
  "/linux":[
    "docker-proxy.md",
    "link.md"
  ],
  "/windows":[
    "ollama.md"
  ],
  "/note":[
    "mysql.md"
  ]
});
