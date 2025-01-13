---
title: Certbot 自动获取HTTPS证书
order: 4
category:
    - certbot
    - docker
    - 教程
---

Certbot 是一个 **开源工具**，用于自动化获取和管理 **SSL/TLS 证书**，主要与 **Let's Encrypt** 配合使用。它简化了 HTTPS 加密的配置过程，使网站管理员能够轻松为他们的网站启用安全连接。Certbot 能够自动续订证书，减少手动操作的需要，从而提高安全性和便利性。它支持多种操作系统和 Web 服务器，用户只需通过命令行界面进行简单的配置即可。


## 动态 DNS 解析

在上一篇 [DDNS-GO](./3-ddns-go.md) 中，已经配置了动态 DNS 解析，实现了将域名与 NAS 的动态公网 IP 进行绑定。访问 NAS 上的服务大多数情况下都是通过 Web 进行的，因此使用 HTTPS 进行安全加密是非常重要的。而且某些互联网服务限制必须使用 HTTPS URL 才能使用（例如对接国外电商平台时填写的 webhook URL）。

国内各大云服务商都有付费证书的选项，但对于个人 NAS 使用，免费的 **Let's Encrypt** 签发的证书即可满足需求。

### 域名服务商配置

- 若域名服务商是 **阿里云**，可以参考项目 [certbot-dns-aliyun](https://github.com/justjavac/certbot-dns-aliyun) 进行实现。
- 若域名服务商不是阿里云，则需要寻找 `certbot-dns-` 对应服务商的插件，每个服务商的认证流程都不一样。

该插件的作用在于协助 Certbot 认证该域名是否在名下。以阿里云插件为例，根据上述 GitHub 项目文档配置完阿里云插件后，会要求填写账号的 **Access Key** 和 **Access Token**（具体申请步骤参考 [配置 DDNS-GO](./3-ddns-go.md/#配置ddns-go)）。

若不想使用插件，可以使用 **dns-01** 认证来完成该流程，从而申请到证书，步骤如下。


## 安装 Certbot

### 使用 apt 安装 Certbot

```bash
sudo apt install certbot
```

### 运行申请命令

```bash
certbot certonly -d "*.example.com" --manual --preferred-challenges dns-01 # 改成自己的域名
```

- `certbot certonly`：表示仅获取证书，不自动配置 Web 服务器。
- `-d "*.example.com"`：表示申请一个通配符证书，适用于所有子域名。
- `--manual`：表示手动验证域名所有权。
- `--preferred-challenges dns-01`：指定使用 DNS-01 挑战方式进行域名验证。

### 结果示例

```bash
# certbot certonly -d "*.example.com" -d example.com --manual --preferred-challenges dns-01
Saving debug log to /etc/letsencrypt/log/letsencrypt.log
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
It contains these names: example.com
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name:
_acme-challenge.******.com.

with the following value:

obhvT0vzlPQANt0XsCHj5xGOj2YUacKnlprinGpfwCg

Before continuing, verify the TXT record has been deployed. Depending on the DNS
provider, this may take some time, from a few seconds to multiple minutes. You can check if it has finished deploying with aid of online tools, such as the Google Admin Toolbox: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.diaoan.xyz.
Look for one or more bolded line(s) below the line ANSWER. It should show the
value(s) you ve just added.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
***Press Enter to Continue***
```

根据上述结果，需要在域名服务商处添加一条 **TXT** 类型的解析记录，并且值为 Certbot 给出的值。**添加完后再按 Enter 继续**，之后 Certbot 会验证是否存在该解析记录，若验证成功，Certbot 会继续创建证书。

```bash
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/******/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/******/privkey.pem
This certificate expires on 2025-4-13.
These files will be updated when the certificate renews.
NEXT STEPS:
This certificate will not be renewed automatically. Autorenewal of --manual certificates requires the use of an authentication hook script (--manual-auth-hook) but one was not provided. To renew this certificate, repeat this same certbot command before the certificate's expiry date.
```

证书创建完成并保存到了对应目录。

## 提示

::: tip
**DNS-01** 是一种用于域名所有权验证的挑战类型。在使用 SSL 证书申请时，证书颁发机构需要确认申请者对域名的控制权。DNS-01 挑战的具体步骤如下：

1. **生成挑战**：请求证书时，证书颁发机构会生成一个特定的挑战字符串。
2. **添加 DNS 记录**：在 DNS 管理界面中添加一条 **TXT** 记录，记录的名称通常是 `_acme-challenge`，内容为颁发机构提供的挑战字符串。
3. **等待 DNS 传播**：添加记录后，可能需要一些时间让 DNS 记录传播。
4. **验证**：证书颁发机构会查询 DNS 记录，检查是否存在正确的 **TXT** 记录。如果存在且内容匹配，则证明对该域名的控制权。
5. **颁发证书**：验证通过后，颁发机构将颁发 SSL 证书。
:::

**DNS-01** 挑战的优点是可以用于申请通配符证书，而其他验证方式（如 **HTTP-01**）则无法实现这一点。

## 证书续期

证书即将到期时重新运行上述命令即可，会重新申请 3 个月期的新证书，不再需要中间步骤。因此也可以将申请命令加入 **crontab**，每 80 天自动运行一次，即可实现自动续期。