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

使用 cloudflare pages 部署

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值/示例值 | 必填 |
|--------|------|--------|------|
| `PASSWORD` | 访问密码 | `123123` | ❌ |
| `API_URL` | WHOIS API 地址 | `https://your-whois-api.example.com/api/` | ❌ |
| `API_KEY` | WHOIS API 密钥 | `abc123` | ❌ |
| `TGID` | Telegram Chat ID | - | ❌ |
| `TGTOKEN` | Telegram Bot Token | - | ❌ |
| `DAYS` | 到期提醒天数 | `30` | ❌ |
| `SITENAME` | 网站名称 | `域名到期监控` | ❌ |
| `ICON` | 网站图标 | `https://example.com/icon.png` | ❌ |
| `BGIMG` | 背景图片 | `https://example.com/bg.png` | ❌ |
| `GITHUB_URL` | GitHub 链接 | - | ❌ |
| `BLOG_URL` | 博客链接 | `https://github.com/yutian81/domain-check` | ❌ |
| `BLOG_NAME` | 博客名称 | `https://blog.notett.com` | ❌ |

### KV 命名空间

需要绑定一个名为 `DOMAIN_KV` 的 KV 命名空间来存储域名数据。

### 定时任务（可选）

如需启用 Telegram 定时通知，在 Cloudflare Dashboard 中添加 Cron Trigger：

```
0 9 * * *  # 每天上午 9 点执行
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

1. 不要在 `wrangler.json` 中写入真实密码，应使用 Cloudflare Dashboard 的环境变量
2. 使用强密码并定期更换
3. 定期备份 KV 数据
4. 限制 API 访问频率

## 常见问题

### Q: 如何备份域名数据？
A: 使用 Wrangler CLI 导出 KV 数据：
```bash
wrangler kv:key get --namespace-id=YOUR_ID "DOMAIN_LIST"
```

### Q: WHOIS 查询失败怎么办？
A: 可以手动输入域名信息，系统会保存手动输入的数据。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
