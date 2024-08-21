# domain-check
这是一个简洁高效的域名可视化展示面板，基于Cloudflare Workers构建。它提供了一个直观的界面，让用户能够一目了然地查看他们域名的状态、注册商、注册日期、过期日期和使用进度，并可在到期前通过TG机器人像用户推送通知。

## 部署方法

### 1、workers部署
在cf中创建一个workers，复制`_worker.js`中的代码到workers中，点击保存并部署。

### 2、pages部署
fork本仓库，在cf中创建一个pages，链接到你fork的仓库，点击部署

## 变量设置
| 变量名 | 填写示例 | 说明 | 是否必填 | 
| ------ | ------- | ------ | ------ |
| SITENAME | 我的域名监控 | 自定义站点名称，默认为`域名监控` | 否 |
| DOMAINS | `https://raw.githubusercontent.com/用户名/仓库名/main/domains.json` | 域名信息json文件 | 是 |
| TGID | 6522584277 | TG机器人ID | 否 |
| TGTOKEN | 6094768843:BBCrcWzLbXghYU8vdtt0jyESjpL9-uKM7p8 | TG机器人TOKEN | 否 |
| DAYS | 7 | 提前几天发送TG提醒 | 否 |

## 域名信息json文件格式
**示例**
```
[
  { "domain": "223344.best", "registrationDate": "2024-06-16", "expirationDate": "2025-07-15", "system": "SpaceShip" },
  { "domain": "123123.xyz", "registrationDate": "2024-04-16", "expirationDate": "2029-04-15", "system": "SpaceShip" },
  { "domain": "520520.xyz", "registrationDate": "2024-07-17", "expirationDate": "2025-07-16", "system": "SpaceShip" },
  { "domain": "hello.site", "registrationDate": "2024-07-11", "expirationDate": "2025-07-11", "system": "NameCheap" },
  { "domain": "hello.us.kg", "registrationDate": "2024-05-31", "expirationDate": "2025-05-31", "system": "US.KG" }
]
```

## 相关截图
![TG通知.png](https://fastly.jsdelivr.net/gh/yutian81/yutian81.github.io@master/assets/images/1724210502008%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20240821104404.png)

![监控页面.png](https://fastly.jsdelivr.net/gh/yutian81/yutian81.github.io@master/assets/images/17242106551601724210654691.png)

## 致谢
[ypq123456789](https://github.com/ypq123456789/domainkeeper)
