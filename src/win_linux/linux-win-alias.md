---
title: Linux & Windows 命令行设置 alias 别名
isOriginal: true
category:
    - Linux
    - Windows
tag:
    - shell
    - alias
---

在访问不熟悉的服务器时，查看当前目录下的文件时，常常会习惯性地输入 `ll` 命令。然而，在陌生的服务器上，系统常常反馈找不到该命令。每次都需要手动设置 `alias ll="ls -l"`，实在麻烦。

可以将该命令写入环境变量，Linux 中通常对应的是 `~/.bashrc`（具体文件根据用户所用的 shell 而异），而 Windows PowerShell 使用的是 `$PROFILE`。

## 🐧 Linux 给当前用户添加别名 ll

使用 `vim` 或其他喜欢的编辑器打开 `~/.bashrc`：

```bash
vim ~/.bashrc
```

在文件中添加一行：

```bash
alias ll="ls -l"
```

随后，更新环境变量，使修改立即生效：

```bash
source ~/.bashrc
```

## 🌍 Linux 给所有用户添加别名

上述操作仅对当前 SSH 用户生效。如果想要对服务器上的所有用户生效，对于 `bash` 用户而言，打开 `/etc/bash.bashrc`，重复上述操作即可。

## 🪟 Windows PowerShell 添加别名

在 Windows 下，`ll` 命令可以用 `dir` 或 `Get-ChildItem` 替代，但在 Linux 上习惯使用 `ll` 的用户仍然希望设置别名。

在 Windows 中，设置别名的命令为 `Set-Alias`，例如给 `dir` 设置别名 `ll` 的方法如下：

```powershell
Set-Alias ll dir
```

同样，添加环境变量，打开 `$PROFILE` 文件，添加上述命令，随后运行以下命令使其立即生效：

```powershell
. $PROFILE
```