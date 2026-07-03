# 域名到期监控系统

基于 Cloudflare Worker 和 Worker KV 构建的域名到期监控仪表盘，支持自动 WHOIS 查询（含 RDAP 回退）、分组管理、到期提醒等功能。

- 界面预览

<img width="1894" height="879" alt="image" src="https://b2qq.24811213.xyz/2025-11/1763455544-image.webp" />

## 功能特性

- ✅ **双模式访问**：`/` 公开页面（只读、域名脱敏）和 `/admin` 管理页面（需密码、完整操作）
- ✅ **域名管理**：支持一级和二级域名的添加、编辑、删除、克隆
- ✅ **批量操作**：复选框多选、全选、批量删除
- 🔍 **WHOIS 自动查询**：一级域名自动获取注册和到期信息（主源 ip.sb + 备用 RDAP）
- 📊 **可视化仪表盘**：域名状态概览、进度条、分组展示
- 🔐 **密码保护**：Cookie 鉴权，7 天有效期，退出登录不删除 Cookie
- 💾 **KV 存储**：每个域名独立 key 存储，无并发竞态
- 💾 **数据备份**：支持数据的导出和导入
- 📱 **Telegram 通知**：定时检查并推送即将到期提醒
- 🎨 **响应式设计**：支持移动端和桌面端访问
- 🖼️ **精美模态框**：替换浏览器原生 alert/confirm，毛玻璃效果

## 🆕 更新日志

### 2025-07-04
- ✨ **新增续期功能**：域名卡片新增「续期」按钮，支持年/月续费，自动更新到期时间并记录续费周期
- 💎 **全面毛玻璃化**：所有模态框（编辑弹窗、续费弹窗、消息弹窗）统一半透明毛玻璃效果，降低透明度
- 🏷️ **分组标签系统**：域名卡片分组显示为彩色标签；编辑弹窗分组改为标签选择器（下拉选择+自定义输入+空格添加+标签删除）
- 🔽 **智能下拉选择**：注册商名称、注册商地址、注册账号 增加基于已有数据的自动补全下拉选择器
- 📱 **移动端适配**：所有模态框移动端宽度调整为 80%
- 🔧 其他 UI 细节优化：卡片间距、标签间距、续费弹窗布局等

## 路由架构

| 路径 | 权限 | 说明 |
|------|------|------|
| `/` | 🔓 公开 | 域名/账号脱敏展示，不可操作 |
| `/admin` | 🔒 需密码 | 完整管理页面，所有操作按钮 |
| `/login` | 🔓 公开 | 登录页，成功后跳转 `/admin` |
| `/logout` | 🔓 公开 | 跳转回首页，不删除 Cookie |
| `/api/domains` | 🔒 全部需鉴权 | 域名 CRUD API |
| `/api/whois/<domain>` | 🔓 公开 | WHOIS 查询 |
| `/api/config` | 🔓 公开 | 前端配置（非敏感字段） |
| `/cron` | 🔓 公开 | 手动触发到期检查 |

## 公开页 `/` 特性

- 域名用 `*****` 隐藏前缀，只保留后缀（`example.com` → `*****.com`）
- 注册账号用 `***********` 隐藏
- 无任何操作按钮（添加/编辑/删除/导出/导入）
- 右上角「登录」按钮跳转 `/admin`
- 数据由服务端脱敏后直接嵌入 HTML，前端不调用 API

## 管理页 `/admin` 特性

- 域名卡片右上角复选框，支持多选
- 「全选」按钮切换勾选/取消当前页所有卡片
- 「删除」删除所有勾选的域名
- 「克隆」按钮：以该卡片信息预填充添加表单（域名留空），快速添加同注册商域名
- 「导出」「导入」备份域名数据
- 「退出」跳回首页（Cookie 保留 7 天，下次直接进入）

## KV 存储说明

- 每个域名存储为独立 key：`domain:<域名>`
- 旧版单一 key (`DOMAIN_LIST`) 数据在首次访问时**自动迁移**到新格式
- 添加/删除/编辑均为原子操作，无读写竞态

## 部署平台：Cloudflare Workers

> [!TIP]
> 放弃在CF网页管理后台直接链接仓库部署的方式  
> 此对于kv空间绑定和定时触发器的设置完全依赖于 wrangler.toml  
> 如果 wrangler.toml 没有进行配置，则项目在重新部署后会丢失参数，导致kv空间绑定以及定时器丢失  
> 这是CF worker 链接仓库部署一直以来的bug  
> **因此，项目部署方式改为 github action，以确保相关参数配置持久化**  

### 前置条件
- 先给把本项目点个⭐，再 Fork，[点击直达](https://github.com/yutian81/domain-check/fork)
- 在 [Cloudflare](https://dash.cloudflare.com) 创建一个 KV 空间，名称随意，例如：`DOMAIN_KV`
- 创建完KV后，KV名称右侧有一串字符，就是KV的ID值，保存下来备用

### 设置仓库 action

- 点开仓库 `settings` → `Secrets and variables` → `Actions`
- 设置如下 `secrets`:
  - **CF_API_TOKEN**: 必须，需要 worker 和 kv 权限
  - **CF_KV_ID**: 必须，创建KV得到的ID值
  - **PASSWORD**: 必须，访问管理页的密码，默认为 `123123`
  - **TGID**: 可选，tg机器人ID，用于发送tg通知
  - **TGTOKEN**: 可选，tg机器人token，用于发送tg通知
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

## 前端开发

前端代码模块化在 `frontend/src/` 目录下：

```
frontend/
├── build.js        ← 构建脚本
├── index.js        ← HTML 模板
├── style.js        ← CSS 样式
├── script.js       ← 构建产物（不手动编辑）
└── src/
    ├── 00-config.js   — 常量和全局状态
    ├── 01-utils.js    — 工具函数（含脱敏函数）
    ├── 07-modal.js    — 自定义模态框
    ├── 02-api.js      — 数据操作
    ├── 03-ui.js       — 渲染函数
    ├── 04-form.js     — 表单逻辑
    ├── 05-filters.js  — 筛选搜索
    └── 06-init.js     — 初始化事件绑定
```

修改后运行 `node frontend/build.js` 重新生成 `script.js`。

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
