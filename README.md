# 域名到期监控系统

基于 Cloudflare Pages 和 Workers 构建的域名到期监控仪表盘，支持自动 WHOIS 查询、分组管理、到期提醒等功能。

## 功能特性

- ✅ **域名管理**：支持一级和二级域名的添加、编辑、删除
- 🔍 **WHOIS 自动查询**：一级域名自动获取注册和到期信息
- 📊 **可视化仪表盘**：域名状态概览、进度条、分组展示
- 🔐 **密码保护**：简单的访问控制机制
- 💾 **KV 存储**：使用 Cloudflare Workers KV 持久化数据
- 📱 **Telegram 通知**：定时检查并推送即将到期提醒
- 🎨 **响应式设计**：支持移动端和桌面端访问

## 快速开始

### 1. 前置要求

- Cloudflare 账号
- Node.js 和 npm/pnpm
- Wrangler CLI

### 2. 安装依赖

```bash
npm install -g wrangler
```

### 3. 配置环境变量

创建 `.dev.vars` 文件用于本地开发（不要提交到 Git）：

```bash
# 登录密码（必填）
PASSWORD=your_secure_password

# WHOIS API 配置（可选，用于自动查询一级域名信息）
API_URL=https://your-whois-api.example.com/api/
API_KEY=your_api_key

# Telegram 通知配置（可选）
TGID=your_telegram_chat_id
TGTOKEN=your_telegram_bot_token

# 其他配置（可选）
SITENAME=域名到期监控
DAYS=30
ICON=https://example.com/icon.png
BGIMG=https://example.com/bg.jpg
GITHUB_URL=https://github.com/your/repo
BLOG_URL=https://yourblog.com
BLOG_NAME=Your Blog
```

### 4. 创建 KV 命名空间

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "DOMAIN_KV"

# 更新 wrangler.json 中的 id 为返回的 ID
```

### 5. 本地开发

```bash
wrangler pages dev public --kv DOMAIN_KV
```

### 6. 部署

```bash
wrangler pages deploy public
```

部署后，在 Cloudflare Dashboard 中配置环境变量和 KV 绑定。

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PASSWORD` | 访问密码 | `123123` | ❌ |
| `API_URL` | WHOIS API 地址 | - | ❌ |
| `API_KEY` | WHOIS API 密钥 | - | ❌ |
| `TGID` | Telegram Chat ID | - | ❌ |
| `TGTOKEN` | Telegram Bot Token | - | ❌ |
| `DAYS` | 到期提醒天数 | `30` | ❌ |
| `SITENAME` | 网站名称 | `域名到期监控` | ❌ |
| `ICON` | 网站图标 | - | ❌ |
| `BGIMG` | 背景图片 | - | ❌ |
| `GITHUB_URL` | GitHub 链接 | - | ❌ |
| `BLOG_URL` | 博客链接 | - | ❌ |
| `BLOG_NAME` | 博客名称 | - | ❌ |

### KV 命名空间

需要绑定一个名为 `DOMAIN_KV` 的 KV 命名空间来存储域名数据。

### 定时任务（可选）

如需启用 Telegram 定时通知，在 Cloudflare Dashboard 中添加 Cron Trigger：

```
0 9 * * *  # 每天上午 9 点执行
```

## 项目结构

```
.
├── functions/              # Pages Functions (后端 API)
│   ├── _middleware.js      # 认证中间件
│   ├── api/
│   │   └── domains.js      # 域名 CRUD API
│   ├── scheduled.js        # 定时任务
│   └── utils.js            # 工具函数
├── public/                 # 静态前端资源
│   ├── index.html          # 主页面
│   ├── script.js           # 前端逻辑
│   └── style.css           # 样式
├── wrangler.json           # Wrangler 配置
└── README.md               # 本文档
```

## API 接口

### GET /api/domains
获取所有域名列表

### POST /api/domains
添加或编辑域名

请求体：
```json
{
  "domain": "example.com",
  "registrationDate": "2020-01-01",
  "expirationDate": "2025-01-01",
  "system": "Registrar Name",
  "systemURL": "https://registrar.com",
  "registerAccount": "user@example.com",
  "groups": "主要, 生产"
}
```

### PUT /api/domains
批量更新域名列表（用于删除等操作）

## 安全建议

⚠️ **重要提示**：

1. **不要在 `wrangler.json` 中写入真实密码**，使用 Cloudflare Dashboard 的环境变量或 `.dev.vars`
2. 使用强密码并定期更换
3. 考虑添加更强的认证机制（如 JWT、OAuth）
4. 定期备份 KV 数据
5. 限制 API 访问频率

## 常见问题

### Q: 如何备份域名数据？
A: 使用 Wrangler CLI 导出 KV 数据：
```bash
wrangler kv:key get --namespace-id=YOUR_ID "DOMAIN_LIST"
```

### Q: WHOIS 查询失败怎么办？
A: 可以手动输入域名信息，系统会保存手动输入的数据。

### Q: 如何自定义界面？
A: 修改 `public/style.css` 和环境变量中的图标、背景等配置。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
