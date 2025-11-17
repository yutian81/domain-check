# test

## 文件结构

```
/domain-check
├── src/
│   ├── api/
│   │   ├── config.js
│   │   ├── domains.js
│   ├── index.js             <-- Worker 主入口文件
│   ├── _middleware.js
│   ├── scheduled.js
│   ├── utils.js
├── frontend/
│   ├── index.js
│   ├── script.js
│   ├── style.js
├── wrangler.toml            <-- Worker 配置文件
├── README.md
```

## whois 域名查询api（仅支持一级域名）

- 请求示例

```bash
curl -X GET \
  -H "X-API-KEY: 你的API密钥" \
  https://whois.example.com/api/github.com
```

- 返回示例

```json
{
  "domain": "bing.com",
  "creationDate": "1997-03-24T00:00:00Z",
  "updatedDate": "2024-04-20T10:11:47Z",
  "expiryDate": "2025-03-23T00:00:00Z",
  "registrar": "MarkMonitor Inc.",
  "registrarUrl": "http://www.markmonitor.com",
  "nameServers": [
    "ns1.msft.net",
    "ns2.msft.net",
    "ns3.msft.net",
    "ns4.msft.net"
  ]
}
```
