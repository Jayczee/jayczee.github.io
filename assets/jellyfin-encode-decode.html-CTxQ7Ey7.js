import{_ as s,c as e,a,o as n}from"./app-BpRl8Ce5.js";const l="/assets/images/nas/jellyfin/j-5.png",t="/assets/images/nas/jellyfin/j-6.png",h="/assets/images/nas/jellyfin/j-7.png",r={};function p(d,i){return n(),e("div",null,i[0]||(i[0]=[a('<h2 id="🎥-什么是编码与解码" tabindex="-1"><a class="header-anchor" href="#🎥-什么是编码与解码"><span>🎥 什么是编码与解码？</span></a></h2><h3 id="📡-编码" tabindex="-1"><a class="header-anchor" href="#📡-编码"><span>📡 编码</span></a></h3><p>编码是将原始音视频数据转换为特定格式的过程，以便于存储和传输。这个过程通常涉及压缩，以减少文件大小，从而节省存储空间和带宽。常见的编码格式包括：</p><ul><li><strong>视频编码格式</strong>：如 H.264、H.265（HEVC）、VP9 等。</li><li><strong>音频编码格式</strong>：如 AAC、MP3、FLAC 等。</li></ul><h3 id="🔄-解码" tabindex="-1"><a class="header-anchor" href="#🔄-解码"><span>🔄 解码</span></a></h3><p>解码是将编码后的音视频数据转换回可播放格式的过程。解码器负责读取编码数据，并将其转换为可以在媒体播放器中播放的格式。</p><h2 id="🔍-jellyfin-中的编码与解码" tabindex="-1"><a class="header-anchor" href="#🔍-jellyfin-中的编码与解码"><span>🔍 Jellyfin 中的编码与解码</span></a></h2><p>Jellyfin 通过使用 FFmpeg 等工具来处理音视频的编码与解码。</p><h3 id="_1-转码" tabindex="-1"><a class="header-anchor" href="#_1-转码"><span>1. <strong>转码</strong></span></a></h3><p>当客户端设备不支持片源的音视频格式时，Jellyfin 会自动进行转码。转码是将文件从一种格式转换为另一种格式的过程。Jellyfin 会根据客户端的能力和网络状况选择最佳的转码方式。</p><h3 id="_2-直接播放" tabindex="-1"><a class="header-anchor" href="#_2-直接播放"><span>2. <strong>直接播放</strong></span></a></h3><p>如果客户端设备支持片源的音视频格式，Jellyfin 会选择直接播放。因此，在选择片源时，尽量选择主力播放设备支持的格式。如果使用功能较齐全的电视播放，通常大部分都是直接播放的。</p><h3 id="_3-硬解与软解" tabindex="-1"><a class="header-anchor" href="#_3-硬解与软解"><span>3. <strong>硬解与软解</strong></span></a></h3><ul><li><p><strong>硬解</strong>：利用硬件加速进行解码，通常使用 NAS 上的显卡进行解码，例如 NVIDIA GPU 和 Intel Quick Sync（核显）。</p></li><li><p><strong>软解</strong>：通过软件进行解码，通常会消耗更多的 CPU 资源，可能导致性能下降，尤其是在高分辨率视频播放时。面对高质量片源时，软解的效率较低。</p></li></ul><h2 id="🖥️-docker-中的-jellyfin-使用-nvidia-显卡进行硬解" tabindex="-1"><a class="header-anchor" href="#🖥️-docker-中的-jellyfin-使用-nvidia-显卡进行硬解"><span>🖥️ Docker 中的 Jellyfin 使用 NVIDIA 显卡进行硬解</span></a></h2><h3 id="_1-安装-n-卡驱动" tabindex="-1"><a class="header-anchor" href="#_1-安装-n-卡驱动"><span>1. 安装 N 卡驱动</span></a></h3><p>如果 Jellyfin 部署在 Docker 中，并且 NAS 拥有一块 NVIDIA 显卡并想用该显卡解码，那么在部署 Jellyfin 之前需要先在 NAS 上安装 NVIDIA 驱动。</p><p>首先，运行命令检查是否已经安装 N 卡驱动：</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">nvidia-smi</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>如果输出信息类似下图，且 Driver Version 与 CUDA Version 不为空，则表示已安装驱动。</p><figure><img src="'+l+'" alt="nvidia-smi 输出信息" tabindex="0" loading="lazy"><figcaption>nvidia-smi 输出信息</figcaption></figure><p>如果提示命令不存在等信息，则视为未安装驱动。</p><p>访问 <a href="https://www.nvidia.cn/drivers/lookup/" target="_blank" rel="noopener noreferrer">NVIDIA 官网</a>，根据 NAS 的配置信息，搜索对应的驱动：</p><figure><img src="'+t+'" alt="搜索驱动" tabindex="0" loading="lazy"><figcaption>搜索驱动</figcaption></figure><figure><img src="'+h+`" alt="搜索结果" tabindex="0" loading="lazy"><figcaption>搜索结果</figcaption></figure><p>右键单击下载按钮，复制地址，在 NAS 命令行中使用 <code>wget</code> 命令下载(wget需要添加refer和user-agent，否则下载会碰到403)：</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">wget</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --user-agent=</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36&quot;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --header=</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Referer: https://www.nvidia.cn/&quot;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> https://cn.download.nvidia.com/XFree86/Linux-x86_64/570.133.07/NVIDIA-Linux-x86_64-570.133.07.run</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>当然，也可以下载到其他机器上，通过 SFTP 或 SCP 等方式传输到 NAS 上。</p><p>下载完成后，运行命令，根据提示完成安装：</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sh</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> ./NVIDIA-Linux-x86_64-550.144.03.run</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h3 id="_2-jellyfin-docker-compose-配置" tabindex="-1"><a class="header-anchor" href="#_2-jellyfin-docker-compose-配置"><span>2. Jellyfin Docker Compose 配置</span></a></h3><p>以下是配置 Jellyfin 使用 NVIDIA 显卡的 Docker Compose 示例：</p><div class="language-yaml line-numbers-mode" data-highlighter="shiki" data-ext="yaml" data-title="yaml" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">version</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;3.8&#39;</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">volumes</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  jellyfin_config</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  jellyfin_cache</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">services</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  jellyfin</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    image</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">nyanmisaka/jellyfin:latest</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    container_name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">jellyfin</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    hostname</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">jellyfin</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    restart</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">always</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    environment</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">TZ=Asia/Shanghai</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">NVIDIA_DRIVER_CAPABILITIES=all</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">NVIDIA_VISIBLE_DEVICES=all</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    network_mode</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">host</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    volumes</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">jellyfin_config:/config</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">jellyfin_cache:/cache</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">/mnt/data_hdd:/data_hdd</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"> # 该映射是影音文件存储位置，可根据实际情况调整</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">/mnt/nas1_smb:/nas1_smb</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"> # 该映射是影音文件存储位置，可根据实际情况调整</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">/dev:/dev</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    runtime</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">nvidia</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    deploy</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">      resources</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        reservations</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          devices</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            - </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">capabilities</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">              - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">gpu</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="hint-container tip"><p class="hint-container-title">提示</p><p>如果安装过程中提示：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>ERROR: Unable to find the kernel source tree for the currently running kernel. Please make sure you have installed the kernel source files for your kernel and that they are properly configured; on Red Hat Linux systems, for example, be sure you have the &#39;kernel-source&#39; or &#39;kernel-devel&#39; RPM installed. If you know the correct kernel source files are installed, you may specify the kernel source path with the &#39;--kernel-source-path&#39; command line option.</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这是由于<code>当前系统未安装内核头文件或源代码：在Linux系统中，内核头文件（linux-headers）或源代码（kernel-source）并不是默认安装的。如果系统缺少这些文件，安装程序就无法编译内核模块。</code>。先退出安装程序，运行</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sudo</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> apt-get</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> install</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> linux-headers-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">$(</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">uname</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -r</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>后继续安装即可。<br> ：：：</p></div>`,34)]))}const c=s(r,[["render",p],["__file","jellyfin-encode-decode.html.vue"]]),o=JSON.parse(`{"path":"/nas/jellyfin-encode-decode.html","title":"Jellyfin 编码与解码 | N 卡驱动安装","lang":"zh-CN","frontmatter":{"title":"Jellyfin 编码与解码 | N 卡驱动安装","isOriginal":true,"category":["NAS"],"tag":["jellyfin","编码与解码"],"description":"🎥 什么是编码与解码？ 📡 编码 编码是将原始音视频数据转换为特定格式的过程，以便于存储和传输。这个过程通常涉及压缩，以减少文件大小，从而节省存储空间和带宽。常见的编码格式包括： 视频编码格式：如 H.264、H.265（HEVC）、VP9 等。 音频编码格式：如 AAC、MP3、FLAC 等。 🔄 解码 解码是将编码后的音视频数据转换回可播放格...","head":[["meta",{"property":"og:url","content":"https://jayczee.cn/nas/jellyfin-encode-decode.html"}],["meta",{"property":"og:site_name","content":"Jayczee's Blog"}],["meta",{"property":"og:title","content":"Jellyfin 编码与解码 | N 卡驱动安装"}],["meta",{"property":"og:description","content":"🎥 什么是编码与解码？ 📡 编码 编码是将原始音视频数据转换为特定格式的过程，以便于存储和传输。这个过程通常涉及压缩，以减少文件大小，从而节省存储空间和带宽。常见的编码格式包括： 视频编码格式：如 H.264、H.265（HEVC）、VP9 等。 音频编码格式：如 AAC、MP3、FLAC 等。 🔄 解码 解码是将编码后的音视频数据转换回可播放格..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://jayczee.cn/assets/images/nas/jellyfin/j-5.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-04-10T09:20:37.000Z"}],["meta",{"property":"article:tag","content":"jellyfin"}],["meta",{"property":"article:tag","content":"编码与解码"}],["meta",{"property":"article:modified_time","content":"2025-04-10T09:20:37.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Jellyfin 编码与解码 | N 卡驱动安装\\",\\"image\\":[\\"https://jayczee.cn/assets/images/nas/jellyfin/j-5.png\\",\\"https://jayczee.cn/assets/images/nas/jellyfin/j-6.png\\",\\"https://jayczee.cn/assets/images/nas/jellyfin/j-7.png\\"],\\"dateModified\\":\\"2025-04-10T09:20:37.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Jayczee\\",\\"url\\":\\"https://jayczee.cn\\"}]}"]]},"headers":[{"level":2,"title":"🎥 什么是编码与解码？","slug":"🎥-什么是编码与解码","link":"#🎥-什么是编码与解码","children":[{"level":3,"title":"📡 编码","slug":"📡-编码","link":"#📡-编码","children":[]},{"level":3,"title":"🔄 解码","slug":"🔄-解码","link":"#🔄-解码","children":[]}]},{"level":2,"title":"🔍 Jellyfin 中的编码与解码","slug":"🔍-jellyfin-中的编码与解码","link":"#🔍-jellyfin-中的编码与解码","children":[{"level":3,"title":"1. 转码","slug":"_1-转码","link":"#_1-转码","children":[]},{"level":3,"title":"2. 直接播放","slug":"_2-直接播放","link":"#_2-直接播放","children":[]},{"level":3,"title":"3. 硬解与软解","slug":"_3-硬解与软解","link":"#_3-硬解与软解","children":[]}]},{"level":2,"title":"🖥️ Docker 中的 Jellyfin 使用 NVIDIA 显卡进行硬解","slug":"🖥️-docker-中的-jellyfin-使用-nvidia-显卡进行硬解","link":"#🖥️-docker-中的-jellyfin-使用-nvidia-显卡进行硬解","children":[{"level":3,"title":"1. 安装 N 卡驱动","slug":"_1-安装-n-卡驱动","link":"#_1-安装-n-卡驱动","children":[]},{"level":3,"title":"2. Jellyfin Docker Compose 配置","slug":"_2-jellyfin-docker-compose-配置","link":"#_2-jellyfin-docker-compose-配置","children":[]}]}],"git":{"createdTime":1736491706000,"updatedTime":1744276837000,"contributors":[{"name":"Jayczee","username":"Jayczee","email":"jayczee@yeah.net","commits":7,"url":"https://github.com/Jayczee"}]},"readingTime":{"minutes":3.47,"words":1042},"filePathRelative":"nas/jellyfin-encode-decode.md","localizedDate":"2025年1月10日","excerpt":"<h2>🎥 什么是编码与解码？</h2>\\n<h3>📡 编码</h3>\\n<p>编码是将原始音视频数据转换为特定格式的过程，以便于存储和传输。这个过程通常涉及压缩，以减少文件大小，从而节省存储空间和带宽。常见的编码格式包括：</p>\\n<ul>\\n<li><strong>视频编码格式</strong>：如 H.264、H.265（HEVC）、VP9 等。</li>\\n<li><strong>音频编码格式</strong>：如 AAC、MP3、FLAC 等。</li>\\n</ul>\\n<h3>🔄 解码</h3>\\n<p>解码是将编码后的音视频数据转换回可播放格式的过程。解码器负责读取编码数据，并将其转换为可以在媒体播放器中播放的格式。</p>","autoDesc":true}`);export{c as comp,o as data};
