---
title: 记开发环境迁移到wsl2的一次过程
isOriginal: true
star: true
category:
    - Code
tag:
    - wsl2
order: 4
---

## 动机

最近使用Codex开发的时候，发现Codex在检索文件这一步经常报错`找不到命令`，而后尝试使用python读取文件内容。但是在我朋友的机器上它尝试调用python也会出现失败的情况，猜测可能是因为环境差异：我本机确实有python环境而朋友的电脑没有。

其次，安装CC和Codex时，两者都有提示推荐使用WSL2，体验效果更好。但是没有明说**好在哪里**。

在我的Mac上使用两个ai agent确实表现要更好，没有这样的提示，但无奈我的Mac是小规格，只有8G内存，无法同时开过多的项目。

WSL2与Windows目前的适配非常棒。

综上，下定决心，在Windows上安装wsl2并将代码迁移进去。

## 安装WSL2

我比较喜欢Debian系统，所以wsl2中安装的也是debian。

安装命令：
```bash
wsl --install -d Debian
```

此处建议挂个🪜，该命令会从github拉取文件信息。

wsl中安装的linux发行版似乎并非完全体，我下载的非常快，30s就下载安装完毕，直接可以启动了。

检查wsl版本，确定版本是wsl2（在windows命令行中运行）：
```bash
wsl -l -v
```

## 安装过程中检索AI的一些问题

- Q：wsl2可以使用宿主机的目录吗？
    - A：Windows 的盘会自动挂载在 /mnt 下，例如：
        
        | Windows 路径 | 在 WSL2 中路径 |
        | :--- | :--- |
        | `C:\` | `/mnt/c/` |
        | `D:\` | `/mnt/d/` |
    
        虽然可以互通目录，但是不建议跨系统访问文件，在后续在`npm install`、`build`等安装依赖和构建行为中会非常慢。

- Q：宿主机是游戏主力主机，需要打一些高配置竞技游戏，安装wsl2是否会影响我的游戏性能？
    - A：wsl2会动态分配资源，并非像传统虚拟机和wsl1一样直接占用定量的资源。空闲不使用时不会占用CPU和GPU。且wsl2 的 GPU 访问是独立的接口，不会影响Windows中的驱动。

在玩游戏前可执行命令来关闭wsl：
```bash
wsl --shutdown
```

:::tip
在宿主机windows中可以在命令行中运行：
```bash
wsl <具体命令>
```
通过以上方法可以直接从windows中调用wsl环境下的命令，不用每次都单独进入运行wsl的cmd会话框。
:::

## 更新软件源

顺手通过`cat /etc/issue`查看了一下wsl中安装的是最新版的Debian 13。

```bash
sudo apt update && sudo apt full-upgrade -y
```

前面的步骤中，安装wsl完后会弹出一个图形化配置界面，里面有自动让linux使用宿主机http代理的选项，并且该选项是默认勾选的，所以宿主机可以直接开启系统代理让wsl使用。

我是在我家主路由上安装的openclash，全自动科学，没有这种烦恼。

## 迁移代码

我的代码目录在宿主机的`D:\Code`下，对应wsl中就是`/mnt/d/Code`文件夹。

虽然可以互通，但是上面也提及文件系统互通在实际开发时某些场景下特别慢。

此处给出的解决方案是：**代码空间，ai agent等都放在wsl中，宿主机的Jetbrains系IDE和VS Code都通过连接本地wsl来编辑代码。**

因为代码项目文件有特别多，先安装rsync用于迁移文件：

```bash
sudo apt install rsync
```

宿主机的代码项目文件夹中有很多依赖文件和编译后文件，这些文件非常大，我们只需要源代码即可，环境可以之后重装，所以根据自己的项目环境写出一个exclude文件列表，然后添加到迁移命令中。我需要把宿主机D盘中的Code文件夹迁移到wsl的/code下（如果没有/code需要先新建）：

```bash
rsync -av \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '.next' \
  --exclude '.nuxt' \
  --exclude 'venv' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude 'target' \
  --exclude '.gradle' \
  --exclude '.m2' \
  /mnt/d/code/ /code/
```

等待了几分钟即可。

## IDE打开WSL中项目

### VS Code

此外还需要上网学习一下VS Code、Jetbrains系IDE 打开wsl中项目的方法，VSCode集成度特别高，几乎无缝打开。直接在Start选项中选择Connect to，而后选择WSL，VSCode会自动连接本机WSL,然后打开迁移到WSL中的项目即可。

### Jetbrains系

Jetbrains系就比较麻烦，它需要在wsl中也安装一遍IDE。
在Jetbrains系的新建/打开项目的窗口中，或在左上角菜单中选择远程开发，就可以选择WSL。连接成功后，Jetbrains系就会在wsl中尝试安装一套IDE，但是由于网络原因，它自带的下载会很慢。这时候可以点击过程中版本选择下面的`Download Options`选择上传安装包或其他方式。若选择是上传安装包，则去官网下载最新安装包上传即可，当然，如果是学习版，则还要在wsl中进行激活等操作，非常麻烦。

此处推荐java项目也用vscode就可以快速解决上述问题。

## 总结

挺折腾的。。。。。

安装WSL很简单，上手使用才是一个难事。

VSCode其实还好，连接非常快速，但Jetbrains需要再安装一遍IDE。 

如果不想折腾的话，最简单的方式就是在windows上打开HyperV功能，安装一个带GUI的Linux发行版，直接在里面进行编码，更加顺畅。

萝卜青菜各有所爱，到底需不需要用还要看自己的使用场景。

对我来说，比如哪天线上突然出BUG，我正在打游戏，我还得去启动WSL，去等各个IDE加载，修改，推送。在Windows本地我直接打开IDE编辑代码，远程debug很快就可以解决。在WSL中的好处就是可以隔离开发环境和我自己的游戏环境。