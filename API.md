# API 接口

## BASE_URL

```
https://your-domain-check.workers.dev
```

## GET /api/config —— 获取项目全局配置

- 请求示例（无需鉴权）

```bash
curl -X GET https://your-domain-check.workers.dev/api/config
```

- 返回示例

```json
{
  "siteName": "域名到期监控",
  "siteIcon": "https://pan.811520.xyz/icon/domain-check.png",
  "bgimgURL": "https://pan.811520.xyz/icon/bg_light.webp",
  "githubURL": "https://github.com/yutian81/domain-check",
  "blogURL": "https://blog.811520.xyz/post/2025/04/domain-autocheck/",
  "blogName": "QingYun Blog",
  "days": 30
}
```

## GET 或 POST /cron —— 手动检查域名到期情况

- 请求示例（无需鉴权）

```
curl -X GET https://your-domain-check.workers.dev/cron
# 或
curl -X POST https://your-domain-check.workers.dev/cron
```

- 返回示例

```json
{
  "success": true,
  "message": "已找到 2 个即将到期的域名，Telegram通知已尝试发送。",
  "expiringCount": 2,
  "domains": [
    {
      "domain": "example1.com",
      "expirationDate": "2025-01-01",
      "daysRemaining": 15,
      // ... 其他域名信息
    },
    // ...
  ]
}
```

## GET /api/domains —— 获取所有域名列表

- 请求示例（需要鉴权）

```bash
curl -X GET https://your-domain-check.workers/api/domains \
     -H "Cookie: auth=<PASSWORD>"
```

- 返回示例

```json
[
  {
    "domain": "site-a.com",
    "registrationDate": "2022-10-01",
    "expirationDate": "2025-10-01",
    "system": "Cloudflare",
    "systemURL": "https://cloudflare.com",
    "registerAccount": "admin@site-a.com",
    "groups": "主要"
  },
  {
    "domain": "backup-b.net",
    "registrationDate": "2023-01-15",
    "expirationDate": "2026-01-15",
    "system": "Aliyun",
    "systemURL": "https://aliyun.com",
    "registerAccount": "backup@b.net",
    "groups": "备份, 测试"
  }
]
```

## POST /api/domains —— 添加或编辑域名

- 请求示例（需要鉴权）

```bash
curl -X POST https://your-domain-check.workers.dev/api/domains \
     -H "Content-Type: application/json" \
     -H "Cookie: auth=<PASSWORD>" \
     -d '{
            "domain": "new-domain.com",
            "registrationDate": "2023-08-08",
            "expirationDate": "2026-08-08",
            "system": "GoDaddy",
            "systemURL": "https://godaddy.com",
            "registerAccount": "contact@new-domain.com",
            "groups": "新购"
          }'
```

- 返回示例

```json
{
  "success": true, 
  "domain": "example.com"
}
```

## PUT /api/domains —— 批量更新域名列表（用于编辑）

- 请求示例

```bash
curl -X PUT https://your-domain-check.workers.dev/api/domains \
     -H "Content-Type: application/json" \
     -H "Cookie: auth=<PASSWORD>" \
     -d '[
            { "domain": "site-a.com", "expirationDate": "2025-10-01", "groups": "主要" },
            { "domain": "site-c-new.net", "expirationDate": "2026-08-08", "groups": "次要" }
         ]'
```


- 返回示例

```json
{
  "success": true, 
  "count": 2
}
```

## DELETE /api/domains —— 删除域名

- 请求示例：删除单个域名

```bash
curl -X DELETE https://your-domain-check.workers.dev/api/domains \
     -H "Content-Type: application/json" \
     -H "Cookie: auth=<PASSWORD>" \
     -d '{ "domain": "domain-to-delete.com" }'
```

- 返回示例：删除单个域名

```json
{
  "success": true, 
  "message": "域名 domain-to-delete.com 已删除"
}
```

- 请求示例：删除多个域名

```bash
curl -X DELETE https://your-domain-check.workers.dev/api/domains \
     -H "Content-Type: application/json" \
     -H "Cookie: auth=<PASSWORD>" \
     -d '["domain-to-delete-1.com", "domain-to-delete-2.net", "domain-to-delete-3.io"]'
```

- 返回示例：删除多个域名

```json
{
  "success": true,
  "message": "成功删除 2 个域名。",
  "deletedCount": 2
}
```

## GET /api/whois —— whois查询（仅支持一级域名）

- 请求示例（无需鉴权）

```bash
curl -X GET https://your-domain-check.workers/api/whois/<要查询的域名>
```

- 返回示例

```json
{
  "success": true,
  "data": {
    "domain": "github.com",
    "creationDate": "2007-10-09T18:20:50Z",
    "updatedDate": "2024-09-07T09:16:32Z",
    "expiryDate": "2026-10-09T18:20:50Z",
    "registrar": "MarkMonitor",
    "registrarUrl": "http://www.markmonitor.com",
    "nameServers": [
      "dns1.p08.nsone.net",
      "dns2.p08.nsone.net",
      "dns3.p08.nsone.net",
      "dns4.p08.nsone.net",
      "ns-1283.awsdns-32.org",
      "ns-1707.awsdns-21.co.uk",
      "ns-421.awsdns-52.com",
      "ns-520.awsdns-01.net"
    ]
  }
}
```
