// src/_middleware.js

import { getConfig } from './utils';

// 认证逻辑
export async function authenticate(request, env) {
    const config = getConfig(env);
    const cookie = request.headers.get('Cookie');
    let authToken = null;
    if (cookie) {
        const match = cookie.match(/auth=([^;]+)/);
        if (match) authToken = match[1];
    }
    const isAuthenticated = authToken === config.password;
    if (isAuthenticated) return null; 

    return Response.redirect(new URL('/login', request.url), 302);
}

// 登录处理逻辑
export async function handleLogin(request, env) {
    const config = getConfig(env);
    if (request.method === 'GET') {
        const html = generateLoginPage(false, config.siteName, config.siteIcon, config.bgimgURL, config.githubURL, config.blogURL, config.blogName);
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } else if (request.method === 'POST') {
        let password;
        const contentType = request.headers.get('content-type') || '';
        try {
            const formData = await request.formData();
            password = formData.get('password');
            if (password === config.password) {
                const expires = new Date();
                expires.setDate(expires.getDate() + 7);
                const headers = new Headers();
                headers.set('Location', '/');
                headers.set('Set-Cookie', `auth=${password}; Expires=${expires.toUTCString()}; HttpOnly; Path=/; Secure; SameSite=Lax`);
                return new Response(null, { status: 302, headers: headers });
            } else {
                const html = generateLoginPage(true, config.siteName, config.siteIcon, config.bgimgURL, config.githubURL, config.blogURL, config.blogName);
                return new Response(html, { headers: { 'Content-Type': 'text/html' } });
            }
        } catch (error) {
            return new Response('Bad Request', { status: 400 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
}

// 生成登录页面HTML
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
          background-color: rgba(255, 255, 255, 0.3);
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
          background-color: rgba(255, 255, 255, 0.35);
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
