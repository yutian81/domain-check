// functions/utils.js

// 从环境变量读取配置
export function getConfig(env) {
    return {
        siteName: env.SITENAME || "域名到期监控",
        siteIcon: env.ICON || 'https://pan.811520.xyz/icon/domain-check.png',
        bgimgURL: env.BGIMG || 'https://pan.811520.xyz/icon/bg_light.webp',
        githubURL: env.GITHUB_URL || 'https://github.com/yutian81/domain-check',
        blogURL: env.BLOG_URL || 'https://blog.811520.xyz/post/2025/04/domain-autocheck/',
        blogName: env.BLOG_NAME || 'QingYun Blog',
        password: env.PASSWORD || "123123",
        days: Number(env.DAYS || 30), // 用于前端即将到期判断
        tgid: env.TGID,
        tgtoken: env.TGTOKEN,
        apiUrl: env.API_URL,
        apiKey: env.API_KEY
    };
}

// 格式化日期为 YYYY-MM-DD
export function formatDateToBeijing(dateStr) {
    const date = new Date(dateStr);
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime.toISOString().split('T')[0];
}

// 判断是否为一级域名（返回布尔值）
export function isPrimaryDomain(domain) {
    const parts = domain.split('.');
    return parts.length <= 2;
}

// --- WHOIS API 调用函数 ---
export async function fetchDomainFromAPI(env, domainName) {
    const config = getConfig(env);
    
    if (!config.apiUrl || !config.apiKey) {
        console.error("API_URL 或 API_KEY 未配置，无法进行 WHOIS 查询。");
        return null;
    }

    try {
        // 请求 URL 格式： <API_URL>/<域名>
        const apiUrl = config.apiUrl.endsWith('/') 
            ? `${config.apiUrl}${domainName}`
            : `${config.apiUrl}/${domainName}`;

        const response = await fetch(apiUrl, {
            headers: { 'X-API-KEY': config.apiKey }
        });

        if (!response.ok) {
            let errorDetail = '';
            try {
                const errorJson = await response.json(); // 尝试解析 JSON 错误体
                errorDetail = errorJson.error || JSON.stringify(errorJson);
            } catch (e) {
                errorDetail = await response.text(); // 如果解析失败，回退到原始文本
            }
            console.error(`WHOIS API请求失败 (${domainName})，状态码: ${response.status}. 详情: ${errorDetail}`);
            return null;
        }
        
        // --- 成功响应处理 ---
        const data = await response.json();
        // 校验返回数据是否包含必要字段
        if (!data.creationDate || !data.expiryDate) {
             console.error("WHOIS API返回数据缺少 creationDate 或 expiryDate 字段。");
             return null;
        }

        return {
            domain: domainName,
            registrationDate: formatDateToBeijing(data.creationDate),
            expirationDate: formatDateToBeijing(data.expiryDate),
            system: data.registrar || '未知',
            systemURL: data.registrarUrl || '未知'
        };
    } catch (error) {
        console.error(`获取域名 ${domainName} 信息时发生网络或解析错误:`, error);
        return null;
    }
}

// TG通知函数
export async function sendtgMessage(message, tgid, tgtoken) {
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

// 生成登录页面HTML (与原代码相同，为简洁，仅展示函数签名)
export function generateLoginPage(showError = false, siteName, siteIcon, bgimgURL, githubURL, blogURL, blogName) {
  const currentYear = new Date().getFullYear();
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>登录 - ${siteName}</title>
      <link rel="icon" href="${siteIcon}" type="image/png">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>
        body, html {
          height: 100%;
          margin: 0;
          padding: 10px;
          font-family: Arial, sans-serif;
          background-image: url('${bgimgURL}');
          background-position: center;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .login-container {
          background-color: rgba(255, 255, 255, 0.5);
          padding: 25px 25px 10px 25px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          width: 400px;
          text-align: center;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 15px rgba(0,0,0,0.15),
            inset 0 0 10px rgba(255,255,255,0.1);
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
          color: #186db3;
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
          border-radius: 8px;
          box-sizing: border-box;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input[type="password"]:focus {
          border-color: #186db3;
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 115, 179, 0.2);
        }
        button {
          width: 100%;
          padding: 12px;
          background-color: #186db3;
          color: white;
          border: none;
          border-radius: 8px;
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
        .footer {
          background-color: none;
          color: #333333;
          font-size: 0.8rem;
          width: 100%;
          text-align: center;
          padding: 16px 0;
          margin-top: 10px;
        }
        .footer p {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin: 0;
        }
        .footer a {
          color: #333333;
          text-decoration: none;
          transition: color 0.3s ease;
          white-space: nowrap;
        }
        .footer a:hover {
          color: #186db3;
        }
        @media (max-width: 768px) {
          .footer p {
            line-height: 0.9;
            font-size: 0.75rem;
          }
          .login-container {
            width: 90%;
          }
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
        <div class="footer">
          <p>
            <span>Copyright © ${currentYear} Yutian81</span><span>|</span>
            <a href="${githubURL}" target="_blank">
              <i class="fab fa-github"></i> Github</a><span>|</span>
            <a href="${blogURL}" target="_blank">
              <i class="fas fa-blog"></i> ${blogName}</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

