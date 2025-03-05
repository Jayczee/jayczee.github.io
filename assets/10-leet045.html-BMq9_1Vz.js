import{_ as n,c as t,a,b as l,d as i,e as h,f as p,r as k,o as r}from"./app-CDIcMaE7.js";const d={};function g(c,s){const e=k("RouteLink");return r(),t("div",null,[s[3]||(s[3]=a('<h2 id="🔗-相关链接" tabindex="-1"><a class="header-anchor" href="#🔗-相关链接"><span>🔗 相关链接</span></a></h2><p><a href="https://leetcode.cn/problems/jump-game/?envType=study-plan-v2&amp;envId=top-interview-150" target="_blank" rel="noopener noreferrer">跳跃游戏 II</a></p><h2 id="📜-题目描述" tabindex="-1"><a class="header-anchor" href="#📜-题目描述"><span>📜 题目描述</span></a></h2><p>给定一个长度为 <code>n</code> 的 0 索引整数数组 <code>nums</code>。初始位置为 <code>nums[0]</code>。</p><p>每个元素 <code>nums[i]</code> 表示从索引 <code>i</code> 向后跳转的最大长度。换句话说，如果在 <code>nums[i]</code> 处，可以跳转到任意 <code>nums[i + j]</code> 处，条件如下：</p><ul><li>(0 \\leq j \\leq nums[i])</li><li>(i + j &lt; n)</li></ul><h2 id="🎯-目标" tabindex="-1"><a class="header-anchor" href="#🎯-目标"><span>🎯 目标</span></a></h2><p>返回到达 <code>nums[n - 1]</code> 的最小跳跃次数。生成的测试用例可以到达 <code>nums[n - 1]</code>。</p><h2 id="📊-示例" tabindex="-1"><a class="header-anchor" href="#📊-示例"><span>📊 示例</span></a></h2><h3 id="示例-1" tabindex="-1"><a class="header-anchor" href="#示例-1"><span>示例 1</span></a></h3><p><strong>输入：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>nums = [2, 3, 1, 1, 4]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>输出：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>2</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>解释：</strong><br> 跳到最后一个位置的最小跳跃数是 2。<br> 从下标为 0 跳到下标为 1 的位置，跳 1 步，然后跳 3 步到达数组的最后一个位置。</p><hr><h3 id="示例-2" tabindex="-1"><a class="header-anchor" href="#示例-2"><span>示例 2</span></a></h3><p><strong>输入：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>nums = [2, 3, 0, 1, 4]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>输出：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>2</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h2 id="📝-提示" tabindex="-1"><a class="header-anchor" href="#📝-提示"><span>📝 提示</span></a></h2><ul><li><code>1 &lt;= nums.length &lt;= 10^4</code></li><li><code>0 &lt;= nums[i] &lt;= 1000</code></li></ul><p><strong>注意</strong>：题目保证可以到达 <code>nums[n-1]</code>。</p><h2 id="💡-思路" tabindex="-1"><a class="header-anchor" href="#💡-思路"><span>💡 思路</span></a></h2>',25)),l("p",null,[s[1]||(s[1]=i("和")),h(e,{to:"/note/leet150/9-leet055.html"},{default:p(()=>s[0]||(s[0]=[i("跳跃游戏")])),_:1}),s[2]||(s[2]=i("思路类似，只不过维护一个是否可到达的数组改为维护一个到达此处需要的最少步数的数组。"))]),s[4]||(s[4]=a(`<h2 id="💻-代码实现" tabindex="-1"><a class="header-anchor" href="#💻-代码实现"><span>💻 代码实现</span></a></h2><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">public</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> int</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> jump</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">(</span><span style="--shiki-light:#C18401;--shiki-dark:#C678DD;">int</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">[] nums) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    if</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> ==</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        return</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">    }</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#C678DD;">    int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">[] steps </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> new</span><span style="--shiki-light:#C18401;--shiki-dark:#C678DD;"> int</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">[</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">]</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">    Arrays</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">fill</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(steps, </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">10001</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">    steps[</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">0</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    for</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&lt;</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> i</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">++</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> range </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> nums[i]</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        if</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> range </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&gt;=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> -</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            return</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> steps[i] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">        }</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        for</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> j </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> j </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&lt;=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> Math</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">min</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> range, </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> -</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> j</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">++</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            if</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (steps[j] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&gt;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> steps[i] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">                steps[j] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> steps[i] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">            }</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">        }</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">    }</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    return</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> steps[</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> -</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">]</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,2))])}const y=n(d,[["render",g],["__file","10-leet045.html.vue"]]),A=JSON.parse(`{"path":"/note/leet150/10-leet045.html","title":"045 跳跃游戏 II","lang":"zh-CN","frontmatter":{"title":"045 跳跃游戏 II","order":10,"category":["LeetCode"],"tag":["LeetCode面试经典150题","LeetCode045","中等题","贪心","数组"],"description":"🔗 相关链接 跳跃游戏 II 📜 题目描述 给定一个长度为 n 的 0 索引整数数组 nums。初始位置为 nums[0]。 每个元素 nums[i] 表示从索引 i 向后跳转的最大长度。换句话说，如果在 nums[i] 处，可以跳转到任意 nums[i + j] 处，条件如下： (0 \\\\leq j \\\\leq nums[i]) (i + j < n...","head":[["meta",{"property":"og:url","content":"https://jayczee.cn/note/leet150/10-leet045.html"}],["meta",{"property":"og:site_name","content":"Jayczee's Blog"}],["meta",{"property":"og:title","content":"045 跳跃游戏 II"}],["meta",{"property":"og:description","content":"🔗 相关链接 跳跃游戏 II 📜 题目描述 给定一个长度为 n 的 0 索引整数数组 nums。初始位置为 nums[0]。 每个元素 nums[i] 表示从索引 i 向后跳转的最大长度。换句话说，如果在 nums[i] 处，可以跳转到任意 nums[i + j] 处，条件如下： (0 \\\\leq j \\\\leq nums[i]) (i + j < n..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-03-05T09:43:46.000Z"}],["meta",{"property":"article:tag","content":"LeetCode面试经典150题"}],["meta",{"property":"article:tag","content":"LeetCode045"}],["meta",{"property":"article:tag","content":"中等题"}],["meta",{"property":"article:tag","content":"贪心"}],["meta",{"property":"article:tag","content":"数组"}],["meta",{"property":"article:modified_time","content":"2025-03-05T09:43:46.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"045 跳跃游戏 II\\",\\"image\\":[\\"\\"],\\"dateModified\\":\\"2025-03-05T09:43:46.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Jayczee\\",\\"url\\":\\"https://jayczee.cn\\"}]}"]]},"headers":[{"level":2,"title":"🔗 相关链接","slug":"🔗-相关链接","link":"#🔗-相关链接","children":[]},{"level":2,"title":"📜 题目描述","slug":"📜-题目描述","link":"#📜-题目描述","children":[]},{"level":2,"title":"🎯 目标","slug":"🎯-目标","link":"#🎯-目标","children":[]},{"level":2,"title":"📊 示例","slug":"📊-示例","link":"#📊-示例","children":[{"level":3,"title":"示例 1","slug":"示例-1","link":"#示例-1","children":[]},{"level":3,"title":"示例 2","slug":"示例-2","link":"#示例-2","children":[]}]},{"level":2,"title":"📝 提示","slug":"📝-提示","link":"#📝-提示","children":[]},{"level":2,"title":"💡 思路","slug":"💡-思路","link":"#💡-思路","children":[]},{"level":2,"title":"💻 代码实现","slug":"💻-代码实现","link":"#💻-代码实现","children":[]}],"git":{"createdTime":1741167826000,"updatedTime":1741167826000,"contributors":[{"name":"Jayczee","username":"Jayczee","email":"jayczee@yeah.net","commits":1,"url":"https://github.com/Jayczee"}]},"readingTime":{"minutes":1.3,"words":389},"filePathRelative":"note/leet150/10-leet045.md","localizedDate":"2025年3月5日","excerpt":"<h2>🔗 相关链接</h2>\\n<p><a href=\\"https://leetcode.cn/problems/jump-game/?envType=study-plan-v2&amp;envId=top-interview-150\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">跳跃游戏 II</a></p>\\n<h2>📜 题目描述</h2>\\n<p>给定一个长度为 <code>n</code> 的 0 索引整数数组 <code>nums</code>。初始位置为 <code>nums[0]</code>。</p>\\n<p>每个元素 <code>nums[i]</code> 表示从索引 <code>i</code> 向后跳转的最大长度。换句话说，如果在 <code>nums[i]</code> 处，可以跳转到任意 <code>nums[i + j]</code> 处，条件如下：</p>","autoDesc":true}`);export{y as comp,A as data};
