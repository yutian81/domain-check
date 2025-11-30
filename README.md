# 域名到期监控系统

**对原有的 [worker版](https://github.com/yutianqq/domain-check-pages/tree/old-worker) 进行模块化重构，kv作为数据储存，前端界面大升级，采用现代化卡片式布局**

基于 Cloudflare Worker 和 Worker KV 构建的域名到期监控仪表盘，支持自动 WHOIS 查询、分组管理、到期提醒等功能。

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

### 前置条件
- 先给把本项目点个⭐，再 Fork，[点击直达](https://github.com/yutian81/domain-check/fork)
- 在 [Cloudflare](https://dash.cloudflare.com) 创建一个 KV 空间，名称随意，例如：`DOMAIN_KV`
- 创建完KV后，KV名称右侧有一串字符，就是KV的ID值，保存下来备用

### 设置仓库 action

- 点开仓库 `settings` → `Secrets and variables` → `Actions`
- 设置如下 `secrets`
  - CF_API_TOKEN: 需要 worker 和 kv 权限

- 访问你的 workers 默认地址，输入登录密码，进入管理页面
- 界面预览

<img width="1894" height="879" alt="image" src="https://github.com/user-attachments/assets/f36e4e11-14d9-45d3-a456-38e19d3a0762" />

### 环境变量

| 变量名 | 说明 | 默认值/示例值 | 必填 |
|--------|------|--------|------|
| `PASSWORD` | 访问密码 | `123123` | ✔️ |
| <del>WHOIS_API_URL</del> | 已内置 | 不再需要，内置端点为 `GET /api/whois/<域名>` | ❌ |
| <del>WHOIS_API_KEY</del> | 已内置 | 不再需要，内置端点为 `GET /api/whois/<域名>` | ❌ |
| `TGID` | Telegram Chat ID | - | ❌ |
| `TGTOKEN` | Telegram Bot Token | - | ❌ |
| `DAYS` | 到期提醒天数 | `30` | ❌ |
| `SITENAME` | 网站名称 | `域名到期监控` | ❌ |
| `ICON` | 网站图标 | `https://example.com/icon.png` | ❌ |
| `BGIMG` | 背景图片 | `https://example.com/bg.png` | ❌ |
| `GITHUB_URL` | GitHub 链接 | `https://github.com/yutian81` | ❌ |
| `BLOG_URL` | 博客链接 | `https://blog.notett.com` | ❌ |
| `BLOG_NAME` | 博客名称 | `QingYun Blog` | ❌ |

## 本项目 API 接口

https://github.com/yutian81/domain-check/blob/main/API.md

## 安全建议

⚠️ **重要提示**：

1. 使用强密码并定期更换
2. 定期备份 KV 数据
3. 限制 API 访问频率

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
