---
title: OpenCode Go 的 DeepSeek Flash 经 new-api 接入 ChatGPT Desktop 踩坑记：修好工具调用与上下文状态
published: 2026-09-24
description: OpenCode Go 的 DeepSeek Flash 经 new-api 接入桌面端后，聊天秒回，但一跑命令或读文件就当场暴毙。本文记录排查过程，通过自建协议桥接处理 DSML 流式标签、custom 工具包装、孤儿 call_id 与思考模式上下文丢失。
category: AI 与大模型
tags:
  - OpenCode Go
  - DeepSeek
  - new-api
  - Codex
draft: false
---

前阵子开了 OpenCode Go，打算把里面的 DeepSeek Flash 挂到自己的 new-api，再接入 ChatGPT Desktop / Codex 当主力 Agent 敲代码。

一开始配完 baseURL 和 key，在对话框里打个招呼回得飞快，还以为一把过了。结果一丢进真实项目让它读文件、跑命令，客户端当场暴毙：要么毫无征兆地中断报错，要么界面上猝不及防吐出一大段裸露的 XML 标签：

~~~text
<｜｜DSML｜｜ calls>
<｜｜DSML｜｜ invoke name="exec">
<｜｜DSML｜｜ parameter name="input" string="true">
...
</｜｜DSML｜｜ parameter>
</｜｜DSML｜｜ invoke>
</｜｜DSML｜｜ calls>
~~~

这些不是模型想对用户说的话，而是它准备下发给客户端的工具调用指令（DSML 格式）。正常情况下客户端应该直接在本地执行命令，根本不该把这串东西渲染到前端界面上。

抓包看了下请求链路，原因其实很直接：**普通聊天只要文本透传就够了，但 Agent 干活本质上是一套严格的 RPC 状态机握手**。客户端下发 tools schema，模型决策后返回结构化调用指令，客户端本地执行命令再回传 tool_output，模型接收结果后继续输出。中间层只要有一处协议细节或历史状态对不上，整条流水线立马停摆。

## 部署拓扑与架构

整条请求链路如下：

~~~text
Codex / ChatGPT Desktop
    ↓
nginx (反向代理与路由分发)
    ↓
tools-bridge (自写的协议桥接服务，Python 实现)
    ↓
new-api (密钥校验、渠道分发、用量统计)
    ↓
OpenCode Go (DeepSeek Flash)
~~~

new-api 负责路由别名、渠道负载均衡和用量统计，但它不会主动去解决模型专有格式与客户端之间的方言差异。为了不改动 new-api 源码，我在它前面挂了一个轻量的协议桥接程序（`tools-bridge`），专门在两端之间充当“协议垫片”。

下面按排查时遇到的四个坑逐个拆解。

---

## 坑一：上游把工具调用当普通文本吐出（DSML 拦截与重组）

也就是开头看到的 `<｜｜DSML｜｜ calls>`。

模型的真实意图是下发 `exec` 工具调用，但在某些接入渠道或提示词环境下，上游没有把它封装进标准的 OpenAI `tool_calls` JSON 结构，而是直接以纯文本流的形式回传给前端。中间层如果原样透传，客户端只当这是一串普通回答，本地的执行引擎自然纹丝不动。

桥接服务的处理策略是：
1. **正则识别与解析**：在 SSE（Server-Sent Events）流中监控 DSML 标签，一旦发现 `<｜｜DSML｜｜ calls>`，立即拦截该段文本输出；
2. **提取参数并转译**：解析出工具名称（如 `exec`）和参数（如命令内容），重新包装成客户端能识别的标准 `tool_calls` 结构并注入到响应流中；
3. **流式分块缓冲（Chunk Buffering）**：流式传输时模型是一个字一个字往外蹦的，一段 DSML 经常被切成好几个 TCP 数据包。如果刚匹配到开头就急着解析，参数就会被严重截断。因此桥接服务必须维护一个轻量缓冲区，直到收到完整的 `</｜｜DSML｜｜ calls>` 闭合标签后再执行转译与下发。

---

## 坑二：custom 自由文本工具与 function 规整参数的类型冲突

修完 DSML 后，新对话可以执行常规工具了，但一调用 `exec` 或 `apply_patch` 依然报错。

查了请求体才发现，桌面客户端对工具的定义有两套体系：
- **普通函数（function）**：参数是格式规整的 JSON Object，如 `{"path": "/tmp/a.txt"}`；
- **自由文本工具（custom）**：参数是一大段包含换行和特殊字符的 Shell 脚本或 git patch 文本。

Codex 桌面端把 `exec` 和 `apply_patch` 标记成了 `custom` 类型。然而上游的 OpenAI 兼容端只认标准的 `function` schema，碰到未知的 `custom` 类型直接无情拒收。

处理方法是**双向装箱与拆箱**：
- **发往上游前**：桥接服务拦截 tools 定义，把所有的 `custom` 工具强制改成 `function` 类型，并将其自由文本参数封装进一个名为 `input` 的标准 JSON 字段：
  ~~~json
  {
    "name": "exec",
    "arguments": {
      "input": "echo 'hello world'"
    }
  }
  ~~~
- **模型返回后**：桥接服务再把 `input` 字段里的原始脚本拿出来，还原成桌面客户端期望的 payload 格式。
- **命名空间清洗**：桌面端喜欢把工具按功能分组（类似命名空间），有时模型会回复带有前缀的 `functions.exec`，客户端本地找不到名为 `functions.exec` 的工具就会报错，桥接也顺带把这类命名空间前缀统统剥离。

---

## 坑三：中断对话导致的“孤儿 call_id”（No tool output found）

这是最恶心的一个问题。客户端在执行长命令时，如果我手动点了取消或者网络波动重试，再次发送任何一句话，上游都会直接抛错：

~~~text
No tool output found for tool call call_xxx.
~~~

在 OpenAI 协议规范中，每个 `tool_call` 都有一个类似事务单号的 `call_id`。发起调用时带上 ID，客户端执行完毕后必须在下一轮 messages 中附带一条 `role: tool` 且 `tool_call_id: call_xxx` 的结果记录。

如果某次调用被中途按了中断，对话历史中就只留下了“助手发起了工具调用”，却没有对应的“工具返回了结果”。当客户端带着整段上下文继续向模型发问时，上游一检查历史记录，发现有个 call_id “有去无回”，便直接判定协议损坏并拒绝推理。

为了彻底治好这个毛病，桥接服务在每次转发 `messages` 之前，会先做一次上下文状态机重整：
1. **配对检查**：遍历整段对话历史，收集所有已完成的 `tool_call_id` 与 `tool` 结果；
2. **清理孤儿结果**：丢弃那些找不到调用发起源头的悬空 tool 响应；
3. **补齐中断记录**：对于被中断、没有结果的 `tool_call`，自动在后面补齐一条占位 tool 响应，明确标注“该调用已在客户端中断”，确保每个 call_id 都能闭环。

> 注意：绝对不能伪造一条“执行成功”的结果骗过模型。如果命令实际上根本没跑却谎称成功，模型接下来的推导逻辑会彻底跑偏。

---

## 坑四：思考模式上下文丢失（reasoning_text must be passed back）

开启 DeepSeek 思考模式后，还会遇到这个报错：

~~~text
The `reasoning_text` in the thinking mode must be passed back to the API.
~~~

DeepSeek 的思考模式要求：当一轮对话里包含工具调用时，下一轮必须将前一轮模型生成的 `reasoning_content` 一并回传给上游，否则上游无法延续思维链。

然而很多客户端中转层（包括 new-api 的部分版本）在持久化或回显 messages 时，只保存了最终的 `content` 和 `tool_calls`，把思维链给丢了。

丢失的内容不可能凭空复原。桥接服务的处理方案是在预检时做兜底：如果检测到上下文里存在工具调用但丢失了对应的 reasoning 节点，自动填充一条合法的占位声明，满足上游 API 的硬性校验规则。

---

## 防御性重试机制

哪怕发出前做过了历史重整，经过 new-api 多层中转后偶尔还是可能遇到边缘情况。因此桥接中增加了一层极其克制的定向重试：

- **只对配对错误重试**：仅当上游明确返回 `No tool output found for tool call` 或类似的 call_id 错位错误时，桥接才会针对该具体的 `call_id` 进行定向修复并重发一次；
- **遇到业务错误坚决不重试**：鉴权失败（401）、额度耗尽（429/402）、模型不存在等错误坚决放行。盲目全局重试不仅没有任何意义，还会导致耗时暴增甚至重复扣费。

---

## 线上部署与 Nginx 编排

修复逻辑没有做成本地脚本，而是统一部署在 VPS 服务端。这样无论切换到哪台新笔记本，只需把客户端的 baseURL 填上即可。

Nginx 仅将 `/v1/responses` 路由给桥接服务，其他管理后台和常规接口仍直通 new-api：

~~~nginx
location = /v1/responses {
    proxy_pass http://127.0.0.1:3011;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 600s;
}

location / {
    proxy_pass http://127.0.0.1:3000;
}
~~~

Systemd 守护进程配置：

~~~ini
[Service]
Environment=REWRITE_PORT=3011
Environment=REWRITE_UPSTREAM=http://127.0.0.1:3000
ExecStart=/usr/bin/python3 /opt/tools-bridge/rewrite_proxy_v2.py
Restart=always
RestartSec=2s
~~~

---

## 意外踩坑：13 万 Token 撑爆 VPS 内存

排查初期为了搞清楚客户端发出的完整 JSON 结构，我开了一段时间的全量请求 dump，把每次请求的原文、桥接修改前后的结构以及上游响应全盘写入日志。

结果遇到一次对话上下文飙到了 13 万 token。那台廉价 VPS 只有 1.7G 内存，且默认没有配置 swap。巨型 JSON 字符串解析、全量文件读写、new-api 的内部缓存多层叠加，内存瞬间打满，Linux OOM Killer 狂暴乱杀，连 SSH 和 HTTPS 握手都挂了，最后只能去云厂商后台硬重启。

教训深刻，事后立刻补全了防御措施：
1. **关掉全量 payload dump**，日志只记录工具名、call_id 和状态码，临时抓包用完即删；
2. **分配 4G swap 分区**，防止突发内存峰值直接导致内核假死；
3. **通过 systemd 严格限制各服务 cgroup 内存上限**：
   - `tools-bridge` 内存上限 384 MiB；
   - `new-api` 上限 640 MiB；
   - `mysql` 上限 512 MiB；
   - 单个服务哪怕内存泄漏也只会单独自杀重启，绝不能拖死整台机器的 SSH 守护进程。

---

## 验证矩阵

经过这一通折腾，单靠在对话框发一句“你好”是测不出效果的，必须跑完整的覆盖测试。

首先在本地跑通回归测试套件：覆盖了调用与结果逆序、重复 call_id、悬空调用、悬空结果、丢失 reasoning、以及跨数据包的分段 DSML 解析等 30 项单元测试用例。

随后在 Codex 桌面端完成实际场景验收：
1. 让 Agent 查看当前工程目录结构；
2. 全局搜索特定符号与代码引用；
3. 使用 patch 模式新建并修改一段业务逻辑；
4. 重新读取文件，校验变更是否真正生效；
5. 在单次会话中连续触发多轮工具链；
6. 故意在工具执行期间点击中断，然后接着发送下一条提问，验证孤儿 call_id 是否平滑自愈。

全部顺利跑通。至此，OpenCode Go 的 DeepSeek Flash 才真正算是在桌面 Agent 里安了家。
