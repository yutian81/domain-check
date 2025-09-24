# domain-check
这是一个简洁高效的域名可视化展示面板，基于Cloudflare Workers构建。它提供了一个直观的界面，让用户能够一目了然地查看他们域名的状态、注册商、注册日期、过期日期和使用进度，并可在到期前通过TG机器人向用户推送通知。

**DEMO**：<https://domain.yuzong.nyc.mn/>  

## 更新记录

- [x] 2025-04-14：通过 whois 服务自动查询域名到期时间（对二级域名无效）
- [x] 2025-07-27：增加鉴权系统，需要输入密码方可访问
- [x] 2025-07-27：允许个性化自定义站点LOGO、背景图、仓库链接、博客链接

## 先部署 whois 域名查询 API
- 文件`whois-api.js`
- 变量
  - API_KEY：自行设置，调用 API 需要用到，`如：abcabc`
  - CACHE_HOURS：缓存时间（单位：小时），默认为24小时，`如：24`
- 绑定域名（因为worker被墙，建议绑定域名）
- 得到API接口地址：`https://<worker项目地址>/api/` （**末尾的/必须保留**）

### whois API 调用
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

## 再部署域名到期监控
- 文件`domain-auto.js`
- 变量

| 变量名   | 默认值              | 示例说明                       | 是否必须 |
| ------- | ----------- | ----------------------------- | ------- |
| DOMAINS | 无          | json 文件直链地址：`https://gist.githubusercontent.com/用户名/gistID/raw/domains.json` | 是 |
| TGID    | 无          | TG 机器人 ID：`5868334288`   | 是   |
| TGTOKEN | 无          | TG 机器人 token：`9194882369:xxxxxxfwCD8vdtt0jyESsgL2-xxxxxx`      | 是 |
| DAYS    | 7           | 到期前几天提醒        | 否 | 
| API_URL | 无          | 自部署 whois api 接口：`https://whois.example.com/api/github.com`     | 是 |
| API_KEY | 无          | 自部署 whois api TOKEN     | 是 |
| PASSWORD | 123123     | 主页访问密码     | 是 |
| SITENAME | 域名到期监控    | 自定义站点名称    | 否 |
| ICON | `https://pan.811520.xyz/icon/domain.png` | 自定义站点LOGO，**必须是png格式**    | 否 |
| BGIMG | `https://pan.811520.xyz/icon/back.webp` | 自定义站点背景图    | 否 |
| GITHUB_URL | `https://github.com/yutian81/domain-check` | 页脚自定义github仓库地址   | 否 |
| BLOG_URL | `https://blog.811520.xyz/post/2025/04/domain-autocheck/` | 页脚自定义博客地址   | 否 |
| BLOG_NAME | 青云志 Blog    | 页脚自定义博客名称   | 否 |

- DOMAINS变量json格式示例
```json
[
  { "domain": "cfcdn.best" },
  { "domain": "811520.xyz" },
  { "domain": "cfedt.site" },
  { "domain": "aaa.dpdns.org", "registrationDate": "2024-05-31", "expirationDate": "2026-05-31", "system": "DigitalPlat", "systemURL": "https://dash.domain.digitalplat.org" },
  { "domain": "bbb.dpdns.org", "registrationDate": "2024-05-31", "expirationDate": "2026-05-31", "system": "DigitalPlat", "systemURL": "https://dash.domain.digitalplat.org" }
]
```

- 绑定域名（因worker被墙，建议绑定域名）
- 访问绑定的域名，输入设定的 `PASSWORD` 密码，进入主页

## 完整部署教程
https://blog.811520.xyz/post/2025/04/domain-autocheck/

## 鸣谢

感谢 [Netjett](https://netjett.com/index.php) 提供的免费服务器

Thanks to [Netjett](https://netjett.com/index.php) for the free server


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
