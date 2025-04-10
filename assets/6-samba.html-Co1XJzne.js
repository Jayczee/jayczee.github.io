import{_ as s,c as i,a as e,o as n}from"./app-BpRl8Ce5.js";const t={};function l(r,a){return n(),i("div",null,a[0]||(a[0]=[e(`<h2 id="📖-什么是-samba" tabindex="-1"><a class="header-anchor" href="#📖-什么是-samba"><span>📖 什么是 Samba？</span></a></h2><p><strong>Samba</strong> 是一个开源项目，允许在 Linux 和 Windows 系统之间共享文件和打印机。它实现了 SMB/CIFS 协议，使得不同操作系统之间能够无缝地进行文件共享。Samba 被广泛应用于家庭和企业网络中，可以轻松地将 Linux 服务器或 NAS (网络附属存储) 变成文件共享服务器。</p><h2 id="🚀-samba-的优势" tabindex="-1"><a class="header-anchor" href="#🚀-samba-的优势"><span>🚀 Samba 的优势</span></a></h2><ul><li><strong>跨平台支持</strong>：Samba 使得 Windows 和 Linux 系统之间的文件共享变得简单，用户可以在不同的操作系统上访问共享文件。</li><li><strong>权限管理</strong>：通过 Samba，用户可以灵活地设置文件和目录的访问权限，确保数据安全。</li><li><strong>易于配置</strong>：Samba 提供了简单的配置文件，用户可以根据需求快速进行设置。</li></ul><h2 id="🛠️-使用-docker-部署-samba" tabindex="-1"><a class="header-anchor" href="#🛠️-使用-docker-部署-samba"><span>🛠️ 使用 Docker 部署 Samba</span></a></h2><p>通过 Docker 部署 Samba 是一种便捷的方式，可以快速搭建文件共享服务。以下是一个基本的 Docker Compose 配置示例，用于启动 Samba 服务。</p><h3 id="docker-compose-配置" tabindex="-1"><a class="header-anchor" href="#docker-compose-配置"><span>Docker Compose 配置</span></a></h3><div class="language-yaml line-numbers-mode" data-highlighter="shiki" data-ext="yaml" data-title="yaml" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">services</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  samba</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    image</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">dperson/samba</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    container_name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">samba</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    ports</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;139:139&quot;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;445:445&quot;</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    volumes</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">/mnt/data_hdd:/share_dir</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    command</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">&gt;</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">      -u &quot;root;&quot;</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">      -s &quot;SmbShare;/share_dir/;yes;no;yes;all;root;;&quot;</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    restart</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">unless-stopped</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="配置说明" tabindex="-1"><a class="header-anchor" href="#配置说明"><span>配置说明</span></a></h3><ul><li><strong>image</strong>: 使用 <code>dperson/samba</code> 镜像，这个镜像是一个轻量级的 Samba 服务器。</li><li><strong>container_name</strong>: 设置容器的名称为 <code>samba</code>，便于管理。</li><li><strong>ports</strong>: 映射 Samba 服务的端口，以便外部访问： <ul><li><code>139</code>: NetBIOS 会话服务</li><li><code>445</code>: SMB/CIFS 服务</li></ul></li><li><strong>volumes</strong>: 将宿主机的 <code>/mnt/data_hdd</code> 目录挂载到容器内的 <code>/share_dir</code> 目录，允许共享文件。此处直接同步挂载到容器的 <code>/share_dir</code> 内，保证容器也能访问后面添加的硬盘。</li><li><strong>command</strong>: 指定 Samba 的启动命令： <ul><li><code>-u &quot;root;&quot;</code> 表示使用 root 用户，且不设置密码。</li><li><code>-s &quot;SmbShare;/share_dir/;yes;no;yes;all;root;;&quot;</code> 表示共享 <code>/share_dir</code> 目录，并设置为可读写，允许所有用户访问。</li></ul></li><li><strong>restart</strong>: 设置容器为 <code>unless-stopped</code>，确保容器在意外退出时自动重启。</li></ul><h2 id="⚠️-注意事项" tabindex="-1"><a class="header-anchor" href="#⚠️-注意事项"><span>⚠️ 注意事项</span></a></h2><ul><li><strong>安全性</strong>：在生产环境中，不建议使用 root 用户和空密码。应创建专用用户并设置强密码。此处我使用samba服务仅为了内网机器互相连接，为了我可以在个人PC上方便管理NAS的文件，所以没有设置密码。</li><li><strong>防火墙设置</strong>：确保宿主机的防火墙允许 Samba 服务的端口访问。</li></ul><h2 id="🔍-访问-samba-共享" tabindex="-1"><a class="header-anchor" href="#🔍-访问-samba-共享"><span>🔍 访问 Samba 共享</span></a></h2><ol><li><p><strong>启动 Docker 容器</strong>：<br> 在Portainer的Stack Web Editor中添加上述配置文件，点击Deploy the stack部署samba docker服务。</p></li><li><p><strong>访问 Samba 共享</strong>：</p><ul><li>Windows 系统中，可以在文件资源管理器中输入 <code>\\\\&lt;宿主机IP&gt;\\mnt</code> 访问共享文件夹。</li><li>Linux 系统中，可以使用命令行挂载 Samba 共享：<div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sudo</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> mount</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -t</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> cifs</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> //</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&lt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">宿主机I</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">P&gt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">/mnt</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> /mnt</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -o</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> username=root,password=</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div></li></ul></li></ol>`,14)]))}const h=s(t,[["render",l],["__file","6-samba.html.vue"]]),d=JSON.parse(`{"path":"/nas/basic/6-samba.html","title":"Samba 文件共享服务配置","lang":"zh-CN","frontmatter":{"title":"Samba 文件共享服务配置","order":6,"isOriginal":true,"category":["NAS"],"tag":["samba","docker"],"description":"📖 什么是 Samba？ Samba 是一个开源项目，允许在 Linux 和 Windows 系统之间共享文件和打印机。它实现了 SMB/CIFS 协议，使得不同操作系统之间能够无缝地进行文件共享。Samba 被广泛应用于家庭和企业网络中，可以轻松地将 Linux 服务器或 NAS (网络附属存储) 变成文件共享服务器。 🚀 Samba 的优势 跨...","head":[["meta",{"property":"og:url","content":"https://jayczee.cn/nas/basic/6-samba.html"}],["meta",{"property":"og:site_name","content":"Jayczee's Blog"}],["meta",{"property":"og:title","content":"Samba 文件共享服务配置"}],["meta",{"property":"og:description","content":"📖 什么是 Samba？ Samba 是一个开源项目，允许在 Linux 和 Windows 系统之间共享文件和打印机。它实现了 SMB/CIFS 协议，使得不同操作系统之间能够无缝地进行文件共享。Samba 被广泛应用于家庭和企业网络中，可以轻松地将 Linux 服务器或 NAS (网络附属存储) 变成文件共享服务器。 🚀 Samba 的优势 跨..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-03-21T09:33:47.000Z"}],["meta",{"property":"article:tag","content":"samba"}],["meta",{"property":"article:tag","content":"docker"}],["meta",{"property":"article:modified_time","content":"2025-03-21T09:33:47.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Samba 文件共享服务配置\\",\\"image\\":[\\"\\"],\\"dateModified\\":\\"2025-03-21T09:33:47.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Jayczee\\",\\"url\\":\\"https://jayczee.cn\\"}]}"]]},"headers":[{"level":2,"title":"📖 什么是 Samba？","slug":"📖-什么是-samba","link":"#📖-什么是-samba","children":[]},{"level":2,"title":"🚀 Samba 的优势","slug":"🚀-samba-的优势","link":"#🚀-samba-的优势","children":[]},{"level":2,"title":"🛠️ 使用 Docker 部署 Samba","slug":"🛠️-使用-docker-部署-samba","link":"#🛠️-使用-docker-部署-samba","children":[{"level":3,"title":"Docker Compose 配置","slug":"docker-compose-配置","link":"#docker-compose-配置","children":[]},{"level":3,"title":"配置说明","slug":"配置说明","link":"#配置说明","children":[]}]},{"level":2,"title":"⚠️ 注意事项","slug":"⚠️-注意事项","link":"#⚠️-注意事项","children":[]},{"level":2,"title":"🔍 访问 Samba 共享","slug":"🔍-访问-samba-共享","link":"#🔍-访问-samba-共享","children":[]}],"git":{"createdTime":1736491706000,"updatedTime":1742549627000,"contributors":[{"name":"Jayczee","username":"Jayczee","email":"jayczee@yeah.net","commits":5,"url":"https://github.com/Jayczee"}]},"readingTime":{"minutes":2.39,"words":718},"filePathRelative":"nas/basic/6-samba.md","localizedDate":"2025年1月10日","excerpt":"<h2>📖 什么是 Samba？</h2>\\n<p><strong>Samba</strong> 是一个开源项目，允许在 Linux 和 Windows 系统之间共享文件和打印机。它实现了 SMB/CIFS 协议，使得不同操作系统之间能够无缝地进行文件共享。Samba 被广泛应用于家庭和企业网络中，可以轻松地将 Linux 服务器或 NAS (网络附属存储) 变成文件共享服务器。</p>\\n<h2>🚀 Samba 的优势</h2>\\n<ul>\\n<li><strong>跨平台支持</strong>：Samba 使得 Windows 和 Linux 系统之间的文件共享变得简单，用户可以在不同的操作系统上访问共享文件。</li>\\n<li><strong>权限管理</strong>：通过 Samba，用户可以灵活地设置文件和目录的访问权限，确保数据安全。</li>\\n<li><strong>易于配置</strong>：Samba 提供了简单的配置文件，用户可以根据需求快速进行设置。</li>\\n</ul>","autoDesc":true}`);export{h as comp,d as data};
