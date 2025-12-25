# 域名到期监控系统

**对原有的 [worker版](https://github.com/yutianqq/domain-check-pages/tree/old-worker) 进行模块化重构，kv作为数据储存，前端界面大升级，采用现代化卡片式布局**

基于 Cloudflare Worker 和 Worker KV 构建的域名到期监控仪表盘，支持自动 WHOIS 查询、分组管理、到期提醒等功能。

- 界面预览

<img width="1894" height="879" alt="image" src="https://b2qq.24811213.xyz/2025-11/1763455544-image.webp" />

## 功能特性

- ✅ **域名管理**：支持一级和二级域名的添加、编辑、删除
- 🔍 **WHOIS 自动查询**：一级域名自动获取注册和到期信息
- 📊 **可视化仪表盘**：域名状态概览、进度条、分组展示
- 🔐 **密码保护**：简单的访问控制机制
- 💾 **KV 存储**：使用 Cloudflare Workers KV 持久化数据
- 💾 **数据备份**：支持数据的导出和导入
- 📱 **Telegram 通知**：定时检查并推送即将到期提醒
- 🎨 **响应式设计**：支持移动端和桌面端访问

## 部署平台：Cloudflare Workers

> 放弃在CF网页管理后台直接链接仓库部署的方式  
> 这种方式对于kv空间绑定和定时触发器的设置完全依赖于 wrangler.toml  
> 如果 wrangler.toml 没有进行这些配置，则项目在重新部署后会丢失这些参数，导致kv空间绑定丢失以及定时器丢失  
> 这是CF worker 链接仓库部署一直以来的bug  
> **因此，项目部署方式改为 github action，以确保相关参数配置持久化**  
> 或者你也可以手动通过上传代码的方式部署到 CF worker  

### 前置条件
- 先给把本项目点个⭐，再 Fork，[点击直达](https://github.com/yutian81/domain-check/fork)
- 在 [Cloudflare](https://dash.cloudflare.com) 创建一个 KV 空间，名称随意，例如：`DOMAIN_KV`
- 创建完KV后，KV名称右侧有一串字符，就是KV的ID值，保存下来备用

### 设置仓库 action

- 点开仓库 `settings` → `Secrets and variables` → `Actions`
- 设置如下 `secrets`:
  - **CF_API_TOKEN**: 必须，需要 worker 和 kv 权限
  - **CF_KV_ID**: 必须，创建KV得到的ID值
  - **PASSWORD**: 必须，访问项目前端网页的密码，默认为 `123123`
  - **TGID**: 可选，tg机器人ID，用于发送tg通知
  - **TGTOKEN**: 可选，tg聊天ID或频道ID，用于发送tg通知
- 转到 `variables` 选项卡，设置以下变量:
  - **CF_ACCOUNT_ID**: 必须，CF的账户ID，**是ID不是邮箱账号**
  - **CF_CRONS**: 可选，用于定时检查域名到期情况以发送tg通知

### 运行 action

- 点击仓库 `actions` → `all workerflows` → `自动部署到 CF worker`
- 点击 `run workflow`
- 等待 action 运行，查看运行日志，点击输出的 `worker 管理后台` 链接

### 设置 CF worker

- 进入 CF worker管理后台，给项目绑定一个自定义域名
- 在 worker 的环境变量中，还可设置以下可选变量

| 变量名 | 说明 | 默认值/示例值 | 必填 |
|--------|------|--------|------|
| `DAYS` | 到期提醒天数 | `30` | ❌ |
| `SITENAME` | 网站名称 | `域名到期监控` | ❌ |
| `ICON` | 网站图标 | `https://example.com/icon.png` | ❌ |
| `BGIMG` | 背景图片 | `https://example.com/bg.png` | ❌ |
| `GITHUB_URL` | GitHub 链接 | `https://github.com/yutian81/domain-check` | ❌ |
| `BLOG_URL` | 博客链接 | `https://blog.notett.com` | ❌ |
| `BLOG_NAME` | 博客名称 | `QingYun Blog` | ❌ |

## 本项目 API 接口

https://github.com/yutian81/domain-check/blob/main/API.md

---

## 感谢 YXVM 与 ZMTO 赞助免费服务器

<a href="https://yxvm.com/aff.php?aff=891">
  <img src="https://github.com/user-attachments/assets/33ad6d6e-e159-4840-b6a3-f1ea3faa9df9" width="48%">
</a>
<a href="https://console.zmto.com/?affid=1598">
  <img src="https://github.com/user-attachments/assets/02a0d439-0283-43fe-a028-1212412b324e" width="48%">
</a>
 
## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## ⭐ Star 星星走起
[![Star History Chart](https://api.star-history.com/svg?repos=yutian81/domain-check&type=date&legend=top-left)](https://www.star-history.com/#yutian81/domain-check&type=date&legend=top-left)
