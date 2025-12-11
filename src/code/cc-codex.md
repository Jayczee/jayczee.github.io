---
title: Claude Code & Codex使用有感
isOriginal: true
star: true
category:
    - Code
tag:
    - ai
    - codex
    - claude code
order: 3
---

最近在L站找到某赞助商的AI中转，按量付费，对我目前工作需求时有时无的情况比较友好。

此类AI Agent都需要Node环境，Node 18+即可。

## 使用感受

1. 普遍情况下，CC要比Codex快很多。原因是Codex我选择的gpt-5-high模型，思考得比较深。因此一些复杂任务我会下意识先交给Codex。但事无绝对，有时候CC做的会比Codex好很多。双方都是一会儿神一会儿鬼。


2. 因为自己现在同时负责前后端，很多需求在整理好思路并总结出一个prompt之后我会全权交给ai。Be like：

![需求提示词](/assets/images/code/cc-codex/image.png)

3. 某个需求只要自己的思路是清晰的，AI一定也能给你做出来。但如果自己都毫无头绪，AI虽然大概率能给出答案，但是如果自己无法理解，review的过程非常痛苦。

4. 如果需求涉及到后端sql变更，可以试着把数据库表DDL喂给AI，AI就能更好地理解业务。

5. 可以使用`codex --ask-for-approval never --sandbox danger-full-access`来跳过codex每次的命令询问，Claude code可以使用`claude --dangerously-skip-permissions`。

6. 可以让ai agent每次编辑都自动本地commit一次，自己修改后也可以本地commit，得到最终成果后Squash commits合并成一个。这样ai写出错误代码也可以自己手动回滚，不需要让ai自己回滚，否则对上下文和钱包也是一种浪费。

7. 原本的代码越规范，AI改的越利落。这条纯个人体感。因为有个老前端项目，虽然用的ts，但很多地方类型不对，定义缺失，ai改这个项目时确实感觉捉襟见肘，速度慢了很多。 

8. cc和codex都可以先让ai做一个项目总结文档放在项目目录（比如cc可以直接/init创建一个CLAUDE.md），这样后续向ai提需求时就可以省略一些上下文，让ai自己在总结文档中找。这也算是基操了。

9. 网上的mcp配置在windows下使用时，cc不会出现什么问题，codex会出现`program not started`之类的报错。折腾了很久一直没有成功，直到有天cc成功启动了但是提示我在windows在运行npx最好使用`cmd /c npx xxx`，我如此配置之后，mcp在codex侧也能使用了。

## 安装/配置

Claude Code：
```bash
npm install -g @anthropic-ai/claude-code
```

Codex：
```bash
npm install -g @openai/codex@latest
```

安装完后在用户目录文件夹下创建`.claude`（Claude Code）或`.codex`(Codex)文件夹，配置环境变量。

### Claude Code 环境变量配置

#### settings.json
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "XXX",  // API Key
    "ANTHROPIC_BASE_URL": "xxx",    //中转商API URL
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

### Codex 环境变量配置

#### config.toml
```toml
model_provider = "customName"
model = "gpt-5-codex"
model_reasoning_effort = "high"
network_access = "enabled"
disable_response_storage = true

[model_providers.customName]
name = "customName"
base_url = "XXX"    // 中转商API URL
wire_api = "responses"
requires_openai_auth = true
```

#### auth.json
```json
{
  "OPENAI_API_KEY": "xxxx"  // API Key
}
```