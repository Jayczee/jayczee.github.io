import{_ as r}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,a as n,b as t,d as o,e as s,f as e,r as d,o as g}from"./app-D2iFtlzY.js";const u={},p={class:"hint-container tip"};function m(f,l){const i=d("RouteLink");return g(),a("div",null,[l[59]||(l[59]=n('<h2 id="nas简介" tabindex="-1"><a class="header-anchor" href="#nas简介"><span>NAS简介</span></a></h2><blockquote><p><strong>NAS（Network Attached Storage）</strong>，即网络附属存储，是中年男人三大爱好之一（我毕业的时候入的坑，所以我一毕业就成为了中年...bushi）。</p></blockquote><p>在如今的市场上，有许多成品NAS可供选择，例如威联通、群晖和绿联等知名品牌。这些品牌提供各自独特的NAS系统，用户购买后可以快速进行配置，以满足个人需求。然而，对于像我这样的刚毕业的穷鬼来说，成品NAS的价格往往难以承受。因此，我更倾向于使用一台纯净的服务器，从零开始自己搭建NAS，这样不仅能节省开支，还能学习到许多新知识。</p><hr><h2 id="nas的本质" tabindex="-1"><a class="header-anchor" href="#nas的本质"><span>NAS的本质</span></a></h2><p>NAS的本质其实很简单，无论它的名称如何，它仍然是一台承载各种服务的服务器。只要手上有一台电脑，无论是 <strong>Windows</strong>、<strong>Linux</strong> 还是 <strong>Mac OS</strong>，都可以实现NAS的功能。我的第一台NAS就是大学时使用的笔记本电脑，刷成了Linux系统。笔记本电脑作为NAS的优点在于：</p><ul><li><strong>功耗低</strong>：相较于传统服务器，笔记本电脑更节能。</li><li><strong>自带UPS电源</strong>：即便断电也能保证数据安全。</li><li><strong>独立显卡</strong>：可以用于影音解码，提升观看体验。</li></ul><hr><h2 id="为什么需要nas" tabindex="-1"><a class="header-anchor" href="#为什么需要nas"><span>为什么需要NAS？</span></a></h2><p>我初步接触NAS是出于兴趣，想了解相关技术。但在深入研究后，我明确了自己的需求，发现NAS在以下几个方面非常有用：</p><ul><li>📂 <strong>文件备份</strong>：安全存储重要文件，避免丢失。</li><li>🎥 <strong>高清影音播放</strong>：随时随地享受高质量的影音内容。</li><li>🌐 <strong>个人服务器需求</strong>：搭建自己的网络服务，实现个性化需求。</li></ul><hr><h2 id="公网ip" tabindex="-1"><a class="header-anchor" href="#公网ip"><span>公网IP</span></a></h2><p>NAS设备最好拥有一个公网IP以支持其下载与上传的功能（PT），无论是IPv4还是IPv6都可以，但需要注意的是，IPv6在老旧设备上可能不被支持，通常是由于网卡过于陈旧。如果有条件的话，可以更换新的网卡，例如某宝上几十块的2.5G有线网卡就足以胜任。没有公网IP也行，只不过在PT时能够发现的用户比较少，在做种时无法连接和你同样是内网的用户。</p><hr><p>在某些地区，运营商（大部分是电信，其次是联通，移动基本没有）会提供动态的公网IPv4。这意味着公网IP会不定时刷新，每次刷新时还可能会短暂断网。为了方便在外网访问NAS，我们需要“以不变应万变”：</p><ul><li>将一个不变的域名解析到设备的IP地址。</li><li>在设备IP地址变化时更新解析记录，确保域名解析的IP地址始终是设备最新的公网IP。</li></ul><p>这样，我们就可以通过域名在外网访问设备或设备中的服务，几乎可以屏蔽公网IP变化带来的不便。这就是**动态DNS（DDNS）**的作用。</p>',18)),t("div",p,[l[3]||(l[3]=t("p",{class:"hint-container-title"},"提示",-1)),t("p",null,[l[1]||(l[1]=t("strong",null,"相关文章：",-1)),l[2]||(l[2]=o()),s(i,{to:"/nas/basic/3-ddns-go.html"},{default:e(()=>l[0]||(l[0]=[o("DDNS-GO 动态DNS")])),_:1})])]),l[60]||(l[60]=n('<h2 id="常用服务" tabindex="-1"><a class="header-anchor" href="#常用服务"><span>常用服务</span></a></h2><p>以下是我在NAS上使用到的一些服务，分为基础服务和可选服务：</p><h3 id="基建服务" tabindex="-1"><a class="header-anchor" href="#基建服务"><span>基建服务</span></a></h3><div class="hint-container tip"><p class="hint-container-title">提示</p><p>以下服务是我搭建NAS时的基础服务，确保系统稳定运行。</p></div>',4)),t("table",null,[l[40]||(l[40]=t("thead",null,[t("tr",null,[t("th",null,"服务名称"),t("th",null,"描述")])],-1)),t("tbody",null,[t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/docker.html"},{default:e(()=>l[4]||(l[4]=[o("Docker")])),_:1}),l[5]||(l[5]=o()),l[6]||(l[6]=t("img",{src:"https://img.shields.io/badge/Docker-0db7f2?style=flat-square&logo=docker&logoColor=white",alt:"Docker",loading:"lazy"},null,-1))]),l[7]||(l[7]=t("td",null,"容器化应用管理",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/portainer.html"},{default:e(()=>l[8]||(l[8]=[o("Portainer 容器管理")])),_:1}),l[9]||(l[9]=o()),l[10]||(l[10]=t("img",{src:"https://img.shields.io/badge/Portainer-5c6b7d?style=flat-square&logo=portainer&logoColor=white",alt:"Portainer",loading:"lazy"},null,-1))]),l[11]||(l[11]=t("td",null,"方便的Docker管理界面",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/nginx.html"},{default:e(()=>l[12]||(l[12]=[o("Nginx 反向代理")])),_:1}),l[13]||(l[13]=o()),l[14]||(l[14]=t("img",{src:"https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white",alt:"Nginx",loading:"lazy"},null,-1))]),l[15]||(l[15]=t("td",null,"高性能的HTTP和反向代理服务器",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/ddns-go.html"},{default:e(()=>l[16]||(l[16]=[o("DDNS-Go 动态DNS")])),_:1}),l[17]||(l[17]=o()),l[18]||(l[18]=t("img",{src:"https://img.shields.io/badge/DDNS-Go-ff3c00?style=flat-square&logo=cloudflare&logoColor=white",alt:"DDNS-Go",loading:"lazy"},null,-1))]),l[19]||(l[19]=t("td",null,"动态DNS服务",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/samba.html"},{default:e(()=>l[20]||(l[20]=[o("Samba 网络存储映射")])),_:1}),l[21]||(l[21]=o()),l[22]||(l[22]=t("img",{src:"https://img.shields.io/badge/Samba-4e9e3a?style=flat-square&logo=samba&logoColor=white",alt:"Samba",loading:"lazy"},null,-1))]),l[23]||(l[23]=t("td",null,"网络共享文件服务",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/v2rayn.html"},{default:e(()=>l[24]||(l[24]=[o("V2rayN 搭配 V2raya 代理服务")])),_:1}),l[25]||(l[25]=o()),l[26]||(l[26]=t("img",{src:"https://img.shields.io/badge/V2ray-4b4b4b?style=flat-square&logo=vmware&logoColor=white",alt:"V2ray",loading:"lazy"},null,-1))]),l[27]||(l[27]=t("td",null,"代理服务",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/qbittorrent.html"},{default:e(()=>l[28]||(l[28]=[o("qBittorrent BT下载器")])),_:1}),l[29]||(l[29]=o()),l[30]||(l[30]=t("img",{src:"https://img.shields.io/badge/qBittorrent-4a90e2?style=flat-square&logo=qbit&logoColor=white",alt:"qBittorrent",loading:"lazy"},null,-1))]),l[31]||(l[31]=t("td",null,"BT下载工具",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/jellyfin.html"},{default:e(()=>l[32]||(l[32]=[o("Jellyfin 影音服务器")])),_:1}),l[33]||(l[33]=o()),l[34]||(l[34]=t("img",{src:"https://img.shields.io/badge/Jellyfin-ff3d00?style=flat-square&logo=jellyfin&logoColor=white",alt:"Jellyfin",loading:"lazy"},null,-1))]),l[35]||(l[35]=t("td",null,"自建影音流媒体服务器",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/basic/movie-pilot.html"},{default:e(()=>l[36]||(l[36]=[o("Movie-Pilot 媒体整体与刮削")])),_:1}),l[37]||(l[37]=o()),l[38]||(l[38]=t("img",{src:"https://img.shields.io/badge/Movie--Pilot-ffcc00?style=flat-square&logo=movie&logoColor=black",alt:"Movie-Pilot",loading:"lazy"},null,-1))]),l[39]||(l[39]=t("td",null,"媒体管理工具",-1))])])]),l[61]||(l[61]=t("hr",null,null,-1)),l[62]||(l[62]=t("h3",{id:"可选服务",tabindex:"-1"},[t("a",{class:"header-anchor",href:"#可选服务"},[t("span",null,"可选服务")])],-1)),l[63]||(l[63]=t("div",{class:"hint-container warning"},[t("p",{class:"hint-container-title"},"注意"),t("p",null,"以下服务为可选项，用户可以根据个人需求选择安装与否。")],-1)),t("table",null,[l[58]||(l[58]=t("thead",null,[t("tr",null,[t("th",null,"服务名称"),t("th",null,"描述")])],-1)),t("tbody",null,[l[57]||(l[57]=t("tr",null,[t("td",null,"MySQL 数据库"),t("td",null,"关系型数据库")],-1)),t("tr",null,[t("td",null,[s(i,{to:"/nas/optional/teamspeak.html"},{default:e(()=>l[41]||(l[41]=[o("TeamSpeak 游戏语音")])),_:1}),l[42]||(l[42]=o()),l[43]||(l[43]=t("img",{src:"https://img.shields.io/badge/TeamSpeak-1e90ff?style=flat-square&logo=teamspeak&logoColor=white",alt:"TeamSpeak",loading:"lazy"},null,-1))]),l[44]||(l[44]=t("td",null,"语音聊天工具",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/optional/alist.html"},{default:e(()=>l[45]||(l[45]=[o("Alist 搭配 Merilisearch 私有云盘")])),_:1}),l[46]||(l[46]=o()),l[47]||(l[47]=t("img",{src:"https://img.shields.io/badge/Alist-ff9000?style=flat-square&logo=alist&logoColor=white",alt:"Alist",loading:"lazy"},null,-1))]),l[48]||(l[48]=t("td",null,"私有云盘解决方案",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/optional/gpt.html"},{default:e(()=>l[49]||(l[49]=[o("ChatGPT-Web-Midjourney-Proxy 私有GPT UI")])),_:1}),l[50]||(l[50]=o()),l[51]||(l[51]=t("img",{src:"https://img.shields.io/badge/ChatGPT-00bfff?style=flat-square&logo=openai&logoColor=white",alt:"ChatGPT",loading:"lazy"},null,-1))]),l[52]||(l[52]=t("td",null,"私有GPT界面",-1))]),t("tr",null,[t("td",null,[s(i,{to:"/nas/optional/beszel.html"},{default:e(()=>l[53]||(l[53]=[o("Beszel 服务器监控")])),_:1}),l[54]||(l[54]=o()),l[55]||(l[55]=t("img",{src:"https://img.shields.io/badge/Beszel-ff4500?style=flat-square&logo=monitor&logoColor=white",alt:"Beszel",loading:"lazy"},null,-1))]),l[56]||(l[56]=t("td",null,"服务器监控工具",-1))])])]),l[64]||(l[64]=t("hr",null,null,-1)),l[65]||(l[65]=t("p",null,"基建服务之间需要相互配合，以完成最基本的存储和影音需求。而可选服务则是我个人的额外需求，用户可以根据需要选择安装与否。",-1))])}const S=r(u,[["render",m],["__file","index.html.vue"]]),N=JSON.parse(`{"path":"/nas/","title":"NAS的个人最佳实践","lang":"zh-CN","frontmatter":{"title":"NAS的个人最佳实践","category":["NAS","教程"],"description":"NAS简介 NAS（Network Attached Storage），即网络附属存储，是中年男人三大爱好之一（我毕业的时候入的坑，所以我一毕业就成为了中年...bushi）。 在如今的市场上，有许多成品NAS可供选择，例如威联通、群晖和绿联等知名品牌。这些品牌提供各自独特的NAS系统，用户购买后可以快速进行配置，以满足个人需求。然而，对于像我这样的刚...","head":[["meta",{"property":"og:url","content":"https://mister-hope.github.io/nas/"}],["meta",{"property":"og:site_name","content":"Jayczee's Blog"}],["meta",{"property":"og:title","content":"NAS的个人最佳实践"}],["meta",{"property":"og:description","content":"NAS简介 NAS（Network Attached Storage），即网络附属存储，是中年男人三大爱好之一（我毕业的时候入的坑，所以我一毕业就成为了中年...bushi）。 在如今的市场上，有许多成品NAS可供选择，例如威联通、群晖和绿联等知名品牌。这些品牌提供各自独特的NAS系统，用户购买后可以快速进行配置，以满足个人需求。然而，对于像我这样的刚..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://img.shields.io/badge/Docker-0db7f2?style=flat-square&logo=docker&logoColor=white"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-01-13T06:29:41.000Z"}],["meta",{"property":"article:modified_time","content":"2025-01-13T06:29:41.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"NAS的个人最佳实践\\",\\"image\\":[\\"https://img.shields.io/badge/Docker-0db7f2?style=flat-square&logo=docker&logoColor=white\\",\\"https://img.shields.io/badge/Portainer-5c6b7d?style=flat-square&logo=portainer&logoColor=white\\",\\"https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white\\",\\"https://img.shields.io/badge/DDNS-Go-ff3c00?style=flat-square&logo=cloudflare&logoColor=white\\",\\"https://img.shields.io/badge/Samba-4e9e3a?style=flat-square&logo=samba&logoColor=white\\",\\"https://img.shields.io/badge/V2ray-4b4b4b?style=flat-square&logo=vmware&logoColor=white\\",\\"https://img.shields.io/badge/qBittorrent-4a90e2?style=flat-square&logo=qbit&logoColor=white\\",\\"https://img.shields.io/badge/Jellyfin-ff3d00?style=flat-square&logo=jellyfin&logoColor=white\\",\\"https://img.shields.io/badge/Movie--Pilot-ffcc00?style=flat-square&logo=movie&logoColor=black\\",\\"https://img.shields.io/badge/TeamSpeak-1e90ff?style=flat-square&logo=teamspeak&logoColor=white\\",\\"https://img.shields.io/badge/Alist-ff9000?style=flat-square&logo=alist&logoColor=white\\",\\"https://img.shields.io/badge/ChatGPT-00bfff?style=flat-square&logo=openai&logoColor=white\\",\\"https://img.shields.io/badge/Beszel-ff4500?style=flat-square&logo=monitor&logoColor=white\\"],\\"dateModified\\":\\"2025-01-13T06:29:41.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Jayczee\\",\\"url\\":\\"https://jayczee.github.io\\"}]}"]]},"headers":[{"level":2,"title":"NAS简介","slug":"nas简介","link":"#nas简介","children":[]},{"level":2,"title":"NAS的本质","slug":"nas的本质","link":"#nas的本质","children":[]},{"level":2,"title":"为什么需要NAS？","slug":"为什么需要nas","link":"#为什么需要nas","children":[]},{"level":2,"title":"公网IP","slug":"公网ip","link":"#公网ip","children":[]},{"level":2,"title":"常用服务","slug":"常用服务","link":"#常用服务","children":[{"level":3,"title":"基建服务","slug":"基建服务","link":"#基建服务","children":[]},{"level":3,"title":"可选服务","slug":"可选服务","link":"#可选服务","children":[]}]}],"git":{"createdTime":1736491706000,"updatedTime":1736749781000,"contributors":[{"name":"Jayczee","username":"Jayczee","email":"jayczee@yeah.net","commits":2,"url":"https://github.com/Jayczee"}]},"readingTime":{"minutes":4.37,"words":1310},"filePathRelative":"nas/README.md","localizedDate":"2025年1月10日","excerpt":"<h2>NAS简介</h2>\\n<blockquote>\\n<p><strong>NAS（Network Attached Storage）</strong>，即网络附属存储，是中年男人三大爱好之一（我毕业的时候入的坑，所以我一毕业就成为了中年...bushi）。</p>\\n</blockquote>\\n<p>在如今的市场上，有许多成品NAS可供选择，例如威联通、群晖和绿联等知名品牌。这些品牌提供各自独特的NAS系统，用户购买后可以快速进行配置，以满足个人需求。然而，对于像我这样的刚毕业的穷鬼来说，成品NAS的价格往往难以承受。因此，我更倾向于使用一台纯净的服务器，从零开始自己搭建NAS，这样不仅能节省开支，还能学习到许多新知识。</p>","autoDesc":true}`);export{S as comp,N as data};
