# domain-check
这是一个简洁高效的域名可视化展示面板，基于Cloudflare Workers构建。它提供了一个直观的界面，让用户能够一目了然地查看他们域名的状态、注册商、注册日期、过期日期和使用进度，并可在到期前通过TG机器人向用户推送通知。

**DEMO**：<https://domain.yuzong.nyc.mn/>  

## 2025-04-14 更新：通过 whois 服务自动查询域名到期时间（对二级域名无效）
### 部署 whois 域名查询 API
- 文件`whois-api.js`
- 变量
  - API_KEY：自行设置，调用 API 需要用到，`如：abcabc`
  - CACHE_HOURS：缓存时间（单位：小时），默认为24小时，`如：24`
- 绑定域名（因为worker被墙，建议绑定域名）

### API 调用
- 请求URL格式：
```bash
https://<worker项目地址>/api/<要查询的域名>
示例：https://whois.example.com/api/github.com
```
- 请求头：`X-API-KEY: 你的API密钥`
- 请求方法：`GET`
- 调用示例
```bash
curl -X GET \
  -H "X-API-KEY: 你的API密钥" \
  https://whois.example.com/api/github.com
```
- 返回示例
```json
{
  "domain": "example.com",
  "creationDate": "1995-08-14T04:00:00Z",
  "updatedDate": "2022-08-13T07:01:38Z",
  "expiryDate": "2023-08-13T04:00:00Z",
  "registrar": "RESERVED-INTERNET",
  "registrarUrl": "http://www.reserved.com",
  "nameServers": [
    "a.iana-servers.net",
    "b.iana-servers.net"
  ]
}
```

### API 字段说明
| 字段           | 类型          | 说明            |
| ------------ | ----------- | ------------- |
| domain       | string      | 查询的域名（小写），无需http(s)     |
| creationDate | string/null | 域名创建时间（ISO格式） |
| updatedDate  | string/null | 最后更新时间        |
| expiryDate   | string/null | 域名过期时间        |
| registrar    | string/null | 注册商名称         |
| registrarUrl | string/null | 注册商网址         |
| nameServers  | array       | 域名服务器列表（已去重）  |

### 错误响应
| 状态码 | 含义              | 示例响应                          |
| --- | --------------- | ----------------------------- |
| 400 | 请求格式错误          | {"error": "路径格式应为 /api/<域名>"} |
| 401 | 未提供API Key      | {"error": "需要提供有效的API Key"}   |
| 403 | API Key无效       | {"error": "无效的API Key"}       |
| 500 | 服务器错误           | {"error": "WHOIS查询超时"}        |
| 502 | WHOIS服务不可用      | {"error": "WHOIS服务返回502"}     |
| 503 | 未配置环境变量 API Key | {"error": "未配置 API Key"}      |

## 完整部署教程
https://blog.811520.xyz/post/2025/04/domain-autocheck/
