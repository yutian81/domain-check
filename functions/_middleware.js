// functions/_middleware.js
import { getConfig, generateLoginPage } from './utils';

// 认证逻辑
async function authenticate(request, env) {
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
async function handleLogin(request, env) {
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

export const onRequest = async (context) => {
    const { request, next, env } = context;
    const url = new URL(request.url);
    const config = getConfig(env);

    // /api/config 路由无需认证
    if (url.pathname === '/api/config') { return next(); }
    
    // 处理登录路由
    if (url.pathname === '/login') { return handleLogin(request, env); }

    // 如果未设置密码，跳过认证
    if (!config.password) { return next(); }
    
    // 执行认证
    const authResponse = await authenticate(request, env);
    if (authResponse) { return authResponse; }

    // 认证通过，继续
    return next();
}
