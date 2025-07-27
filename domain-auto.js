// 定义外部变量
let sitename = "域名到期监控"; //变量名SITENAME，自定义站点名称，默认为“域名到期监控”
let domains = ""; //变量名DOMAINS，填入域名信息json文件直链，必须设置的变量
let tgid = ""; //变量名TGID，填入TG机器人ID，不需要提醒则不填
let tgtoken = ""; //变量名TGTOKEN，填入TG的TOKEN，不需要提醒则不填
let days = 7; //变量名DAYS，提前几天发送TG提醒，默认为7天，必须为大于0的整数
let apiUrl = ""; //变量名API_URL，WHOIS API接口地址，部署 whois-api.js 获取
let apiKey = ""; //变量名API_KEY，API接口密钥，部署 whois-api.js 获取

// 格式化日期为北京时间 YYYY-MM-DD
function formatDateToBeijing(dateStr) {
  const date = new Date(dateStr);
  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().split('T')[0];
}

// 判断是否为一级域名
function getPrimaryDomain(domain) {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join('.');
}

// 调用WHOIS API获取域名信息
async function fetchDomainFromAPI(domainName) {
  try {
    const response = await fetch(`${apiUrl}${domainName}`, {
      headers: { 'X-API-KEY': apiKey }
    });
    if (!response.ok) throw new Error('API请求失败');
    const data = await response.json();
    return {
      domain: domainName,
      registrationDate: formatDateToBeijing(data.creationDate),
      expirationDate: formatDateToBeijing(data.expiryDate),
      system: data.registrar,
      systemURL: data.registrarUrl
    };
  } catch (error) {
    console.error(`获取域名 ${domainName} 信息失败:`, error);
    return null;
  }
}

// TG通知函数
async function sendtgMessage(message, tgid, tgtoken) {
  if (!tgid || !tgtoken) return;
  const url = `https://api.telegram.org/bot${tgtoken}/sendMessage`;
  const params = {
    chat_id: tgid,
    text: message,
    parse_mode: "HTML"
  };
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (error) {
    console.error('Telegram 消息推送失败:', error);
  }
}

// 获取域名信息并发出即将到期的TG通知
async function checkDomains(env) {
    domains = env.DOMAINS || domains;
    tgid = env.TGID || tgid;
    tgtoken = env.TGTOKEN || tgtoken;
    days = Number(env.DAYS || days);
    apiUrl = env.API_URL || apiUrl;
    apiKey = env.API_KEY || apiKey;
  
    if (!domains) {
      console.error("DOMAINS 环境变量未设置");
      return;
    }
  
    try {
      // 获取原始域名列表
      const response = await fetch(domains);
      if (!response.ok) throw new Error('Network response was not ok');
      let domainsData = await response.json();
      if (!Array.isArray(domainsData)) throw new Error('JSON 数据格式不正确');
      const today = new Date().toISOString().split('T')[0];
      const processedDomains = [];
  
      // 处理每个域名
      for (const domain of domainsData) {
        let domainInfo = {...domain};
        const primaryDomain = getPrimaryDomain(domain.domain);
        if (primaryDomain === domain.domain) {
          const apiData = await fetchDomainFromAPI(domain.domain);
          if (apiData) {
            domainInfo = {
              ...domainInfo,
              registrationDate: apiData.registrationDate,
              expirationDate: apiData.expirationDate,
              system: apiData.system,
              systemURL: apiData.systemURL
            };
          }
        }
        
        processedDomains.push(domainInfo);
        const expirationDate = new Date(domainInfo.expirationDate);
        const daysRemaining = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
  
        if (daysRemaining > 0 && daysRemaining <= days) {
          const message = `
<b>🚨 域名到期提醒 🚨</b>
          
域名: <code>${domainInfo.domain}</code>
将在 <b>${daysRemaining} 天</b>后过期！
📅 过期日期: ${domainInfo.expirationDate}
🔗 前往续期: <a href="${domainInfo.systemURL}">${domainInfo.system}</a>`;

          const lastSentDate = await env.DOMAINS_TG_KV.get(domainInfo.domain);
          if (lastSentDate !== today) {
            await sendtgMessage(message, tgid, tgtoken);
            await env.DOMAINS_TG_KV.put(domainInfo.domain, today);
          }
        }
      }
      return processedDomains;
    } catch (error) {
      console.error("检查域名时出错:", error);
      throw error;
    }
}

export default {
  // 手动触发器
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const siteName = env.SITENAME || sitename;
    const siteIcon = env.ICON || 'https://pan.811520.xyz/icon/domain.png';
    const bgimgURL = env.BGIMG || 'https://pan.811520.xyz/icon/back.webp';
    const githubURL = env.GITHUB_URL || 'https://github.com/yutian81/domain-check';
    const blogURL = env.BLOG_URL || 'https://blog.811520.xyz/';
    const blogName = env.BLOG_NAME || '青云志 Blog';
    
    // 处理登录路由
    if (path === '/login') {
      if (request.method === 'GET') {
        // 显示登录页面
        return new Response(generateLoginPage(false, siteName, siteIcon, bgimgURL), {
          headers: { 'Content-Type': 'text/html' },
        });
      } else if (request.method === 'POST') {
        // 处理登录请求
        const formData = await request.formData();
        const password = formData.get('password');
        const correctPassword = env.PASSWORD || "123123"; // 从环境变量获取正确密码
        
        // 检查密码是否正确
        if (password === correctPassword) {
          // 设置cookie，有效期1周
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          
          const headers = new Headers();
          headers.set('Location', '/');
          headers.set('Set-Cookie', `auth=${password}; Expires=${expires.toUTCString()}; HttpOnly; Path=/; Secure; SameSite=Lax`);
          
          return new Response(null, {
            status: 302,
            headers: headers
          });
        } else {
          // 密码错误，显示错误信息
          return new Response(generateLoginPage(true, siteName, siteIcon, bgimgURL), {
            headers: { 'Content-Type': 'text/html' },
          });
        }
      }
    }
    
    // 检查cookie中的认证信息
    const cookie = request.headers.get('Cookie');
    let authToken = null;
    if (cookie) {
      const match = cookie.match(/auth=([^;]+)/);
      if (match) authToken = match[1];
    }
    
    const correctPassword = env.PASSWORD;
    
    // 如果未认证且不是登录页面，重定向到登录页面
    if (!correctPassword || authToken === correctPassword) {
      // 已认证，显示主页面
      try {
        const processedDomains = await checkDomains(env);
        const htmlContent = await generateHTML(processedDomains, siteName, siteIcon, bgimgURL, githubURL, blogURL, blogName);
        return new Response(htmlContent, {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (error) {
        return new Response("无法获取或解析域名的 json 文件", { status: 500 });
      }
    } else {
      // 未认证，重定向到登录页面
      const headers = new Headers();
      headers.set('Location', '/login');
      return new Response(null, {
        status: 302,
        headers: headers
      });
    }
  },
  
  // 定时触发器
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      checkDomains(env).catch(err => {
        console.error('定时任务执行失败:', err);
      })
    );
  }
};

// 生成登录页面HTML
function generateLoginPage(showError = false, siteName, siteIcon, bgimgURL) { 
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>登录 - ${siteName}</title>
      <link rel="icon" href="${siteIcon}" type="image/png">
      <style>
        body, html {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-image: url('${bgimgURL}');
          background-position: center;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .login-container {
          background-color: rgba(255, 255, 255, 0.75);
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          width: 320px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 15px;
          background-image: url('${siteIcon}');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
        h1 {
          color: #2573b3;
          margin: 0 0 20px 0;
          font-size: 1.8rem;
        }
        .input-group {
          margin-bottom: 20px;
          text-align: left;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #333;
        }
        input[type="password"] {
          width: 100%;
          padding: 12px;
          background-color: rgba(255, 255, 255, 0.75);
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input[type="password"]:focus {
          border-color: #2573b3;
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 115, 179, 0.2);
        }
        button {
          width: 100%;
          padding: 12px;
          background-color: #2573b3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #1c5a8a;
        }
        .error {
          color: #e74c3c;
          margin-top: 15px;
          padding: 10px;
          background-color: rgba(231, 76, 60, 0.1);
          border-radius: 4px;
          display: ${showError ? 'block' : 'none'};
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>${siteName}</h1>
        <form id="loginForm" action="/login" method="POST">
          <div class="input-group">
            <label for="password">访问密码</label>
            <input type="password" id="password" name="password" required autocomplete="current-password">
          </div>
          <button type="submit">登录系统</button>
          <div id="errorMessage" class="error">密码错误，请重试</div>
        </form>
      </div>
    </body>
    </html>
  `;
}

async function generateHTML(domains, siteName, siteIcon, bgimgURL, githubURL, blogURL, blogName) {
  const rows = await Promise.all(domains.map(async info => {
    const registrationDate = new Date(info.registrationDate);
    const expirationDate = new Date(info.expirationDate);
    const today = new Date();
    const totalDays = (expirationDate - registrationDate) / (1000 * 60 * 60 * 24);
    const daysElapsed = (today - registrationDate) / (1000 * 60 * 60 * 24);
    const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    const isExpired = today > expirationDate;
    const statusColor = isExpired ? '#e74c3c' : '#2ecc71';
    const statusText = isExpired ? '已过期' : '正常';

    return `
      <tr>
        <td><span class="status-dot" style="background-color: ${statusColor};" title="${statusText}"></span></td>
        <td>${info.domain}</td>
        <td><a href="${info.systemURL}" target="_blank">${info.system}</a></td>
        <td>${info.registrationDate}</td>
        <td>${info.expirationDate}</td>
        <td>${isExpired ? '已过期' : daysRemaining + ' 天'}</td>
        <td>
          <div class="progress-bar">
            <div class="progress" style="width: ${progressPercentage}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }));

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${siteName}</title>
      <link rel="icon" href="${siteIcon}" type="image/png">
      <style>
        body, html {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden; /* 禁止整个页面滚动 */
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        body {
          background-image: url('${bgimgURL}');
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
        }
        .container {
          flex: 1;
          width: 95%;
          max-width: 1200px;
          margin: 20px auto;
          background-color: rgba(255, 255, 255, 0.7);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: calc(100% - 40px); /* 减去上下margin */
        }
        h1 {
          background-color: #2573b3;
          color: #fff;
          padding: 10px 35px;
          margin: 0;
          flex-shrink: 0; /* 防止标题被压缩 */
        }
        .table-container {
          flex: 1;
          overflow: auto; /* 仅在容器内滚动 */
        }
        table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
          table-layout: auto;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          white-space: nowrap;
        }
        th {
          background-color: rgba(242, 242, 242, 0.7);
          font-weight: bold;
          position: sticky;
          top: 0; /* 固定表头 */
        }
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #2ecc71;
        }
        .progress-bar {
          width: 100%;
          min-width: 100px;
          background-color: rgba(224, 224, 224, 0.6);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress {
          height: 20px;
          background-color: #2573b3;
        }
        .footer {
          text-align: center;
          padding: 0;
          background-color: #2573b3;
          font-size: 0.9rem;
          color: #fff;
          flex-shrink: 0; /* 防止页脚被压缩 */
        }
        .footer a {
          color: white;
          text-decoration: none;
          margin-left: 10px;
          transition: color 0.3s ease;
        }
        .footer a:hover {
          color: #f1c40f;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${siteName}</h1>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>状态</th>
                <th>域名</th>
                <th>域名注册商</th>
                <th>注册时间</th>
                <th>过期时间</th>
                <th>剩余天数</th>
                <th>使用进度</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="footer">
        <p>
          Copyright © 2025 Yutian81&nbsp;&nbsp;&nbsp;| 
          <a href="${githubURL}" target="_blank">GitHub Repo</a>&nbsp;&nbsp;&nbsp;| 
          <a href="${blogURL}" target="_blank">${blogName}</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
