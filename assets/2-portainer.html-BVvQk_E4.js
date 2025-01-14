import{_ as t}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as s,b as r,d as i,e as n,f as o,a as l,r as p,o as c}from"./app-sSrUqLq2.js";const d="/assets/svg/portainer.svg",h="/assets/images/nas/portainer/portainer-ui.png",k="/assets/images/nas/portainer/portainer-i-step-1.png",g={};function m(u,e){const a=p("RouteLink");return c(),s("div",null,[e[3]||(e[3]=r("img",{src:d,alt:"Portainer Logo",style:{width:"200px"}},null,-1)),r("p",null,[e[1]||(e[1]=i("在")),n(a,{to:"/nas/basic/1-docker.html"},{default:o(()=>e[0]||(e[0]=[i("上一篇文章 Docker")])),_:1}),e[2]||(e[2]=i("中完成安装步骤后，可以开始着手第一个容器Portainer的部署 🚀。"))]),e[4]||(e[4]=l('<h3 id="🤔-为什么要使用-portainer" tabindex="-1"><a class="header-anchor" href="#🤔-为什么要使用-portainer"><span>🤔 为什么要使用 Portainer？</span></a></h3><p>Portainer简单来说是一款Docker管理面板程序，相同的程序还有很多，例如<a href="https://github.com/gohutool/docker.ui" target="_blank" rel="noopener noreferrer">Docker UI</a>和<a href="https://docs.docker.com/desktop/setup/install/windows-install/" target="_blank" rel="noopener noreferrer">Docker Desktop</a>。之所以选择Portainer，只是因为这是第一款使用的管理面板程序，其次它的使用率确实比较高。它可以方便地管理Docker镜像和容器，即便个人对其功能的使用程度仍然很低。虽然<code>docker pull</code>、<code>docker start</code>以及<code>docker stop</code>命令已经非常方便了，但谁能拒绝鼠标点点就能操作的诱惑呢（笑）？当然，新手小白们还是推荐先使用命令熟悉Docker，至少要知道戳戳点点背后的命令究竟是哪一条，才能更深入地理解。</p><figure><img src="'+h+'" alt="Portainer UI" tabindex="0" loading="lazy"><figcaption>Portainer UI</figcaption></figure><h3 id="📥-下载-portainer" tabindex="-1"><a class="header-anchor" href="#📥-下载-portainer"><span>📥 下载 Portainer</span></a></h3><p>首先访问<a href="https://hub.docker.com" target="_blank" rel="noopener noreferrer">Docker Hub</a>，在上方搜索栏中搜索portainer-ce，下载的是Portainer的社区CE（Community Edition）版，它还有商业版可供选择 🛠️。</p><div class="hint-container tip"><p class="hint-container-title">提示</p><p>如果没有登录Docker Hub，可能会转到登录页面，没有账号可以注册一个，毕竟后续会经常使用。</p></div><figure><img src="'+k+`" alt="搜索Portainer CE镜像" tabindex="0" loading="lazy"><figcaption>搜索Portainer CE镜像</figcaption></figure><p>点击图片中的搜索结果后会跳转到portainer-ce的详情页，阅读详情，其中指向了Portainer的官网文档，这里直接把链接po出来: <a href="https://docs.portainer.io/start/install-ce/server/docker" target="_blank" rel="noopener noreferrer">官方文档</a>。根据自己的Docker安装方式选择具体选项。以下以<a href="https://docs.portainer.io/start/install-ce/server/docker/linux" target="_blank" rel="noopener noreferrer">Install Portainer CE with Docker on Linux</a>为例。</p><h3 id="🚀-安装-portainer" tabindex="-1"><a class="header-anchor" href="#🚀-安装-portainer"><span>🚀 安装 Portainer</span></a></h3><p>首先为Portainer创建一个专属volume：</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">docker</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> volume</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> create</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> portainer_data</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>然后在命令行中运行命令安装Portainer:</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">docker</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> run</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -d</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -p</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 8000:8000</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> \\</span></span>
<span class="line"><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">  -p</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 9443:9443</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> \\</span></span>
<span class="line"><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">  --name</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> portainer</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> \\</span></span>
<span class="line"><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">  --restart=always</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> \\</span></span>
<span class="line"><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">  -v</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> /var/run/docker.sock:/var/run/docker.sock</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> \\</span></span>
<span class="line"><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">  -v</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> portainer_data:/data</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> \\</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">  portainer/portainer-ce:2.21.5</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>该命令解析如下：</p><ul><li><code>docker run</code>: 启动一个新的容器。</li><li><code>-d</code>: 以后台模式运行容器（分离模式）。</li><li><code>-p 8000:8000</code>: 将主机的8000端口映射到容器的8000端口。</li><li><code>-p 9443:9443</code>: 将主机的9443端口映射到容器的9443端口。</li><li><code>--name portainer</code>: 给容器指定一个名称为“portainer”。</li><li><code>--restart=always</code>: 设置容器在退出时总是重启。</li><li><code>-v /var/run/docker.sock:/var/run/docker.sock</code>: 将主机的Docker套接字挂载到容器内，以便容器能够与Docker引擎进行通信。</li><li><code>-v portainer_data:/data</code>: 创建一个名为“portainer_data”的卷，并将其挂载到容器内的<code>/data</code>目录，用于持久化存储数据。</li><li><code>portainer/portainer-ce:2.21.5</code>: 指定要使用的镜像及其版本，这里是Portainer Community Edition的2.21.5版本。</li></ul><p>此处需要注意的是，默认映射的9443端口是HTTPS端口，若需要HTTP端口，则需要多映射一个9000端口:</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-p</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 9000:9000</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>安装完后，访问<a href="https://localhost:9443" target="_blank" rel="noopener noreferrer">https://localhost:9443</a>（HTTPS）或<a href="http://localhost:9000" target="_blank" rel="noopener noreferrer">http://localhost:9000</a>（HTTP），即可访问Portainer容器 🔑。</p><p>首次进入Portainer会被要求设置管理员账号密码，千万不要忘了，后续使用非常频繁。</p><h3 id="📊-portainer-ui-常用项" tabindex="-1"><a class="header-anchor" href="#📊-portainer-ui-常用项"><span>📊 Portainer UI 常用项</span></a></h3><p>此处介绍上面Portainer UI图中侧边导航栏几个常用项，前文提及个人使用程度也很浅，所以这里介绍个人的通常用法。</p><ul><li><strong>Stacks</strong>: 保存Docker Compose文件，用来快速创建/更新容器 📄。</li><li><strong>Containers</strong>: 管理当前已经创建的容器 🗃️。</li><li><strong>Images</strong>: 管理已下载的镜像 📥。</li><li><strong>Network</strong>: 管理已经创建的Docker Network。大部分时候使用的是bridge桥接或直接使用宿主机网络host，个别特殊情况会创建一个network供几个特别的容器进行通信 🔗。</li><li><strong>Volumes</strong>: 管理已创建的存储空间volume，这个使用得很少，一般都是定期查看删除没在使用的volume，可能还是学艺不精吧hhh 😂。</li></ul><p>此时点进Containers，会发现列表中已经存在刚刚创建的portainer-ce容器，但无法对其进行停止等操作，毕竟通过Portainer让它关闭自己肯定也是不愿意的吧（笑）😄。</p><p>后续的使用教程将通过部署服务来实践。</p>`,24))])}const v=t(g,[["render",m],["__file","2-portainer.html.vue"]]),P=JSON.parse(`{"path":"/nas/basic/2-portainer.html","title":"Portainer 容器管理","lang":"zh-CN","frontmatter":{"title":"Portainer 容器管理","order":2,"category":["NAS"],"tag":["portainer","docker"],"description":"Portainer Logo 在中完成安装步骤后，可以开始着手第一个容器Portainer的部署 🚀。 🤔 为什么要使用 Portainer？ Portainer简单来说是一款Docker管理面板程序，相同的程序还有很多，例如Docker UI和Docker Desktop。之所以选择Portainer，只是因为这是第一款使用的管理面板程序，其次它...","head":[["meta",{"property":"og:url","content":"https://jayczee.github.io/nas/basic/2-portainer.html"}],["meta",{"property":"og:site_name","content":"Jayczee's Blog"}],["meta",{"property":"og:title","content":"Portainer 容器管理"}],["meta",{"property":"og:description","content":"Portainer Logo 在中完成安装步骤后，可以开始着手第一个容器Portainer的部署 🚀。 🤔 为什么要使用 Portainer？ Portainer简单来说是一款Docker管理面板程序，相同的程序还有很多，例如Docker UI和Docker Desktop。之所以选择Portainer，只是因为这是第一款使用的管理面板程序，其次它..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://jayczee.github.io/assets/images/nas/portainer/portainer-ui.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-01-14T08:18:39.000Z"}],["meta",{"property":"article:tag","content":"portainer"}],["meta",{"property":"article:tag","content":"docker"}],["meta",{"property":"article:modified_time","content":"2025-01-14T08:18:39.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Portainer 容器管理\\",\\"image\\":[\\"https://jayczee.github.io/assets/images/nas/portainer/portainer-ui.png\\",\\"https://jayczee.github.io/assets/images/nas/portainer/portainer-i-step-1.png\\"],\\"dateModified\\":\\"2025-01-14T08:18:39.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Jayczee\\",\\"url\\":\\"https://jayczee.github.io\\"}]}"]]},"headers":[{"level":3,"title":"🤔 为什么要使用 Portainer？","slug":"🤔-为什么要使用-portainer","link":"#🤔-为什么要使用-portainer","children":[]},{"level":3,"title":"📥 下载 Portainer","slug":"📥-下载-portainer","link":"#📥-下载-portainer","children":[]},{"level":3,"title":"🚀 安装 Portainer","slug":"🚀-安装-portainer","link":"#🚀-安装-portainer","children":[]},{"level":3,"title":"📊 Portainer UI 常用项","slug":"📊-portainer-ui-常用项","link":"#📊-portainer-ui-常用项","children":[]}],"git":{"createdTime":1736491706000,"updatedTime":1736842719000,"contributors":[{"name":"Jayczee","username":"Jayczee","email":"jayczee@yeah.net","commits":8,"url":"https://github.com/Jayczee"}]},"readingTime":{"minutes":3.44,"words":1031},"filePathRelative":"nas/basic/2-portainer.md","localizedDate":"2025年1月10日","excerpt":"<img src=\\"/assets/svg/portainer.svg\\" alt=\\"Portainer Logo\\" style=\\"width: 200px;\\">\\n<p>在<a href=\\"/nas/basic/1-docker.html\\" target=\\"_blank\\">上一篇文章 Docker</a>中完成安装步骤后，可以开始着手第一个容器Portainer的部署 🚀。</p>\\n<h3>🤔 为什么要使用 Portainer？</h3>\\n<p>Portainer简单来说是一款Docker管理面板程序，相同的程序还有很多，例如<a href=\\"https://github.com/gohutool/docker.ui\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">Docker UI</a>和<a href=\\"https://docs.docker.com/desktop/setup/install/windows-install/\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">Docker Desktop</a>。之所以选择Portainer，只是因为这是第一款使用的管理面板程序，其次它的使用率确实比较高。它可以方便地管理Docker镜像和容器，即便个人对其功能的使用程度仍然很低。虽然<code>docker pull</code>、<code>docker start</code>以及<code>docker stop</code>命令已经非常方便了，但谁能拒绝鼠标点点就能操作的诱惑呢（笑）？当然，新手小白们还是推荐先使用命令熟悉Docker，至少要知道戳戳点点背后的命令究竟是哪一条，才能更深入地理解。</p>","autoDesc":true}`);export{v as comp,P as data};
