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

## 2024-11-11 更新：每天只进行一次 TG 通知
- 创建一个KV命令空间：名称随意，假设为`DOMAINS_TG_KV`
- 在 workers 或 pages 的设置里，绑定 kv 空间，变量名为`DOMAINS_TG_KV`（不能修改），绑定上一步中新建的 kv 空间

## 部署方法

**worker 部署**

在cf中创建一个workers，复制`_worker.js`中的代码到workers中，点击保存并部署。

## 变量设置
| 变量名 | 填写示例 | 说明 | 是否必填 | 
| ------ | ------- | ------ | ------ |
| SITENAME | 我的域名监控 | 自定义站点名称，默认为`域名监控` | 否 |
| DOMAINS | `https://raw.githubusercontent.com/用户名/仓库名/main/domains.json` | 替换为你自己的json文件 | 是 |
| TGID | 652***4200 | TG机器人ID，不需要通知可不填 | 否 |
| TGTOKEN | 60947***43:BBCrcWzLb000000vdtt0jy000000-uKM7p8 | TG机器人TOKEN，不需要通知可不填 | 否 |
| DAYS | 7 | 提前几天发送TG提醒，必须是整数，默认为`7` | 否 |

## 域名信息json文件格式
**示例**
```
[
  { "domain": "883344.best", "registrationDate": "2024-06-16", "expirationDate": "2025-07-15", "system": "SpaceShip", "systemURL": "https://www.spaceship.com/zh" },
  { "domain": "711911.xyz", "registrationDate": "2024-04-16", "expirationDate": "2029-04-15", "system": "SpaceShip", "systemURL": "https://www.spaceship.com/zh" },
  { "domain": "hello.xyz", "registrationDate": "2024-07-17", "expirationDate": "2025-07-16", "system": "SpaceShip", "systemURL": "https://www.spaceship.com/zh" }
]
```

## 致谢
[ypq123456789](https://github.com/ypq123456789/domainkeeper)
