import{_ as t,c as l,a as e,b as a,d as i,e as h,f as p,r as d,o as r}from"./app-Ch3uayla.js";const k={};function o(c,s){const n=d("RouteLink");return r(),l("div",null,[s[5]||(s[5]=e(`<h2 id="🔗-相关链接" tabindex="-1"><a class="header-anchor" href="#🔗-相关链接"><span>🔗 相关链接</span></a></h2><p><a href="https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/description/?envType=study-plan-v2&amp;envId=top-interview-150" target="_blank" rel="noopener noreferrer">移除有序数组中的重复项 II</a></p><h2 id="📜-题目描述" tabindex="-1"><a class="header-anchor" href="#📜-题目描述"><span>📜 题目描述</span></a></h2><p>给定一个有序数组 <code>nums</code>，需要 <strong>原地</strong> 删除重复出现的元素，使得出现次数超过两次的元素只出现两次，返回删除后数组的新长度。不要使用额外的数组空间，必须在 <strong>原地</strong> 修改输入数组，并在使用 O(1) 额外空间的条件下完成。</p><h3 id="说明" tabindex="-1"><a class="header-anchor" href="#说明"><span>说明</span></a></h3><p>为什么返回数值是整数，但输出的答案是数组呢？</p><p>请注意，输入数组是以「引用」方式传递的，这意味着在函数里修改输入数组对于调用者是可见的。</p><p>可以想象内部操作如下：</p><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// nums 是以“引用”方式传递的。也就是说，不对实参做任何拷贝</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> len </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> removeDuplicates</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">(nums)</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 在函数里修改输入数组对于调用者是可见的。</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 根据你的函数返回的长度, 它会打印出数组中该长度范围内的所有元素。</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">for</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> i </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&lt;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> len</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> i</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">++</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">    print</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">(nums[i])</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="📊-示例" tabindex="-1"><a class="header-anchor" href="#📊-示例"><span>📊 示例</span></a></h2><h3 id="示例-1" tabindex="-1"><a class="header-anchor" href="#示例-1"><span>示例 1</span></a></h3><p><strong>输入：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>nums = [1,1,1,2,2,3]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>输出：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>5, nums = [1,1,2,2,3]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>解释：</strong><br> 函数应返回新长度 <code>length = 5</code>，并且原数组的前五个元素被修改为 <code>1, 1, 2, 2, 3</code>。不需要考虑数组中超出新长度后面的元素。</p><h3 id="示例-2" tabindex="-1"><a class="header-anchor" href="#示例-2"><span>示例 2</span></a></h3><p><strong>输入：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>nums = [0,0,1,1,1,1,2,3,3]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>输出：</strong></p><div class="language-plaintext line-numbers-mode" data-highlighter="shiki" data-ext="plaintext" data-title="plaintext" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>7, nums = [0,0,1,1,2,3,3]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><strong>解释：</strong><br> 函数应返回新长度 <code>length = 7</code>，并且原数组的前七个元素被修改为 <code>0, 0, 1, 1, 2, 3, 3</code>。不需要考虑数组中超出新长度后面的元素。</p><h2 id="📝-提示" tabindex="-1"><a class="header-anchor" href="#📝-提示"><span>📝 提示</span></a></h2><ul><li><code>1 &lt;= nums.length &lt;= 3 * 10^4</code></li><li><code>-10^4 &lt;= nums[i] &lt;= 10^4</code></li><li><code>nums</code> 已按升序排列</li></ul><h2 id="💡-思路" tabindex="-1"><a class="header-anchor" href="#💡-思路"><span>💡 思路</span></a></h2>`,25)),a("p",null,[s[1]||(s[1]=i("对比")),h(n,{to:"/note/leet150/2-leet026.html"},{default:p(()=>s[0]||(s[0]=[i("026 移除有序数组中的重复项")])),_:1}),s[2]||(s[2]=i("，该题难度上升在不能开辟额外的数组保存某个值是否达到删除的条件。根据题目，每个数字最多可以出现两次，即需要满足条件 ")),s[3]||(s[3]=a("code",null,"nums[i] == nums[i-1] == nums[i-2]",-1)),s[4]||(s[4]=i(" (i >= 2)。"))]),s[6]||(s[6]=e(`<p>使用 <code>while</code> 循环和快慢指针遍历数组，初始化 <code>slow</code> 和 <code>fast</code> 为 2（数组长度小于 2 的条件不需要比较，可以直接返回）并比较 <code>nums[slow-2]</code> 与 <code>nums[fast]</code>，若不同则直接赋值。</p><p><code>nums[slow-2]</code> 表示已经被确定需要保留的值，即刚开始 <code>slow</code> 和 <code>fast</code> 都为 2 时，<code>0</code>（<code>slow-2</code>）为第一个确定需要保留的元素。若 <code>nums[slow-2]</code> 与 <code>nums[slow-1]</code> 相同，则 <code>nums[slow]</code> 不需要被保留。</p><div class="hint-container tip"><p class="hint-container-title">提示</p><p><strong>LeetCode官方定义</strong><br> 我们定义两个指针 <code>slow</code> 和 <code>fast</code> 分别为慢指针和快指针，其中慢指针表示处理出的数组的长度，快指针表示已经检查过的数组的长度，即 <code>nums[fast]</code> 表示待检查的第一个元素，<code>nums[slow−1]</code> 为上一个应该被保留的元素所移动到的指定位置。</p><p>因为本题要求相同元素最多出现两次而非一次，所以我们需要检查上上个应该被保留的元素 <code>nums[slow−2]</code> 是否和当前待检查元素 <code>nums[fast]</code> 相同。当且仅当 <code>nums[slow−2]=nums[fast]</code> 时，当前待检查元素 <code>nums[fast]</code> 不应该被保留（因为此时必然有 <code>nums[slow−2]=nums[slow−1]=nums[fast]</code>）。最后，<code>slow</code> 即为处理好的数组的长度。</p></div><h2 id="💻-代码实现" tabindex="-1"><a class="header-anchor" href="#💻-代码实现"><span>💻 代码实现</span></a></h2><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">public</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> int</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> removeDuplicates</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">(</span><span style="--shiki-light:#C18401;--shiki-dark:#C678DD;">int</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">[] nums) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        if</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> &lt;=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            return</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">        }</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        int</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> slow </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> fast </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        while</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (fast </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&lt;</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> nums</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">) {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            if</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (nums[slow </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">-</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">!=</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> nums[fast]) {</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">                nums[slow] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> nums[fast]</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">                slow</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">++;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">            }</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">            fast</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">++;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">        }</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        return</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> slow</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">    }</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,5))])}const m=t(k,[["render",o],["__file","4-leet080.html.vue"]]),u=JSON.parse(`{"path":"/note/leet150/4-leet080.html","title":"080 移除有序数组中的重复项 II","lang":"zh-CN","frontmatter":{"title":"080 移除有序数组中的重复项 II","order":4,"category":["LeetCode"],"tag":["LeetCode面试经典150题","LeetCode26","中等题","数组","双指针","快慢指针"],"description":"🔗 相关链接 移除有序数组中的重复项 II 📜 题目描述 给定一个有序数组 nums，需要 原地 删除重复出现的元素，使得出现次数超过两次的元素只出现两次，返回删除后数组的新长度。不要使用额外的数组空间，必须在 原地 修改输入数组，并在使用 O(1) 额外空间的条件下完成。 说明 为什么返回数值是整数，但输出的答案是数组呢？ 请注意，输入数组是以「...","head":[["meta",{"property":"og:url","content":"https://jayczee.cn/note/leet150/4-leet080.html"}],["meta",{"property":"og:site_name","content":"Jayczee's Blog"}],["meta",{"property":"og:title","content":"080 移除有序数组中的重复项 II"}],["meta",{"property":"og:description","content":"🔗 相关链接 移除有序数组中的重复项 II 📜 题目描述 给定一个有序数组 nums，需要 原地 删除重复出现的元素，使得出现次数超过两次的元素只出现两次，返回删除后数组的新长度。不要使用额外的数组空间，必须在 原地 修改输入数组，并在使用 O(1) 额外空间的条件下完成。 说明 为什么返回数值是整数，但输出的答案是数组呢？ 请注意，输入数组是以「..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-02-26T03:13:33.000Z"}],["meta",{"property":"article:tag","content":"LeetCode面试经典150题"}],["meta",{"property":"article:tag","content":"LeetCode26"}],["meta",{"property":"article:tag","content":"中等题"}],["meta",{"property":"article:tag","content":"数组"}],["meta",{"property":"article:tag","content":"双指针"}],["meta",{"property":"article:tag","content":"快慢指针"}],["meta",{"property":"article:modified_time","content":"2025-02-26T03:13:33.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"080 移除有序数组中的重复项 II\\",\\"image\\":[\\"\\"],\\"dateModified\\":\\"2025-02-26T03:13:33.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Jayczee\\",\\"url\\":\\"https://jayczee.cn\\"}]}"]]},"headers":[{"level":2,"title":"🔗 相关链接","slug":"🔗-相关链接","link":"#🔗-相关链接","children":[]},{"level":2,"title":"📜 题目描述","slug":"📜-题目描述","link":"#📜-题目描述","children":[{"level":3,"title":"说明","slug":"说明","link":"#说明","children":[]}]},{"level":2,"title":"📊 示例","slug":"📊-示例","link":"#📊-示例","children":[{"level":3,"title":"示例 1","slug":"示例-1","link":"#示例-1","children":[]},{"level":3,"title":"示例 2","slug":"示例-2","link":"#示例-2","children":[]}]},{"level":2,"title":"📝 提示","slug":"📝-提示","link":"#📝-提示","children":[]},{"level":2,"title":"💡 思路","slug":"💡-思路","link":"#💡-思路","children":[]},{"level":2,"title":"💻 代码实现","slug":"💻-代码实现","link":"#💻-代码实现","children":[]}],"git":{"createdTime":1740538461000,"updatedTime":1740539613000,"contributors":[{"name":"Jayczee","username":"Jayczee","email":"jayczee@yeah.net","commits":2,"url":"https://github.com/Jayczee"}]},"readingTime":{"minutes":3.15,"words":946},"filePathRelative":"note/leet150/4-leet080.md","localizedDate":"2025年2月26日","excerpt":"<h2>🔗 相关链接</h2>\\n<p><a href=\\"https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/description/?envType=study-plan-v2&amp;envId=top-interview-150\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">移除有序数组中的重复项 II</a></p>\\n<h2>📜 题目描述</h2>\\n<p>给定一个有序数组 <code>nums</code>，需要 <strong>原地</strong> 删除重复出现的元素，使得出现次数超过两次的元素只出现两次，返回删除后数组的新长度。不要使用额外的数组空间，必须在 <strong>原地</strong> 修改输入数组，并在使用 O(1) 额外空间的条件下完成。</p>","autoDesc":true}`);export{m as comp,u as data};
