// src/index.js
//
// 路由架构：
//   /         → 公开页面（只读展示，服务端脱敏注入，无 API 调用）
//   /admin    → 管理页面（需密码鉴权，可操作）
//   /login    → 登录页（POST 成功后跳转 /admin）
//   /logout   → 清除 Cookie，跳转回 /
//   /api/*    → 全部 API 均需鉴权（公开页不调用 API）
//   /cron     → 手动触发定时检查（公开）

import { getConfig } from './utils';
import { HTML_TEMPLATE } from '../frontend/index';
import { onRequest as configApi } from './api/config';
import { onRequest as domainsApi } from './api/domains';
import { onRequest as whoisApi } from './api/whois';
import { checkDomainsScheduled } from './cron';
import { authenticate, handleLogin } from './auth';
import { getDomainsFromKV } from './api/domains';

/** 脱敏域名：只保留 TLD，其余用 ***** 替换 */
function maskDomain(domain) {
    const parts = domain.split('.');
    if (parts.length < 2) return domain;
    const tld = parts.pop();
    const masked = parts.map(() => '*****');
    return [...masked, tld].join('.');
}

/** 脱敏注册账号 */
function maskAccount(account) {
    return account ? '***********' : '';
}

/** 为公开页生成脱敏后的域名列表 */
async function getMaskedDomains(env) {
    const domains = await getDomainsFromKV(env);
    return domains.map(d => ({
        ...d,
        domain: maskDomain(d.domain),
        registerAccount: maskAccount(d.registerAccount),
    }));
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        const config = getConfig(env);
        
        // ----- 公开端点（无需鉴权） -----
        
        // 登录页
        if (pathname === '/login') {
            return handleLogin(request, env, '/admin');
        }

        // 退出登录：清除登录 Cookie，跳转回首页
        if (pathname === '/logout') {
            const headers = new Headers();
            headers.set('Location', '/');
            headers.set('Set-Cookie', 'auth=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/; Secure; SameSite=Lax');
            return new Response(null, { status: 302, headers });
        }

        // 前端配置 API（公开，仅暴露非敏感字段）
        if (pathname === '/api/config') {
            const context = { request, env, ctx, next: () => {} }; 
            return configApi(context);
        }

        // WHOIS 查询（公开，用于管理页添加域名）
        if (pathname.startsWith('/api/whois/')) {
            const context = { request, env, ctx, next: () => {} };
            const domain = pathname.replace('/api/whois/', '');
            return whoisApi(context, domain);
        }

        // 手动触发定时检查
        if (pathname === '/cron') {
            if (request.method !== 'GET' && request.method !== 'POST') {
                return new Response('Method Not Allowed', { status: 405 });
            }
            try {
                const expiringDomains = await checkDomainsScheduled(env); 
                const responseBody = {
                    success: true,
                    message: expiringDomains.length > 0 
                             ? `${expiringDomains.length} 个域名即将到期`
                             : "没有即将到期的域名",
                    expiringCount: expiringDomains.length,
                    domains: expiringDomains
                };
                return new Response(JSON.stringify(responseBody), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error) {
                console.error("手动触发 cron 失败:", error);
                return new Response(JSON.stringify({
                    success: false,
                    error: "cron 任务执行失败",
                    details: error.message
                }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // ----- API 路由（全部需鉴权） -----
        if (pathname.startsWith('/api/')) {
            if (config.password) {
                const authResponse = await authenticate(request, env);
                if (authResponse) return authResponse;
            }
            const context = { request, env, ctx, next: () => {} };
            if (pathname === '/api/domains') { return domainsApi(context); }
            return new Response('API Not Found', { status: 404 });
        }

        // ----- 公开首页：服务端脱敏注入，无需 API 调用 -----
        if (pathname === '/') {
            const maskedDomains = await getMaskedDomains(env);
            return new Response(HTML_TEMPLATE(
                config.siteName, config.siteIcon, config.bgimgURL,
                config.githubURL, config.blogURL, config.blogName,
                false, // isAdmin = false
                maskedDomains // 服务端已脱敏的域名列表
            ), {
                headers: { 
                    'Content-Type': 'text/html;charset=UTF-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        }

        // ----- 管理页面（需鉴权） -----
        if (pathname === '/admin') {
            if (config.password) {
                const authResponse = await authenticate(request, env);
                if (authResponse) return authResponse;
            }
            return new Response(HTML_TEMPLATE(
                config.siteName, config.siteIcon, config.bgimgURL,
                config.githubURL, config.blogURL, config.blogName,
                true // isAdmin = true
            ), {
                headers: { 
                    'Content-Type': 'text/html;charset=UTF-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        }

        return new Response('Not Found', { status: 404 });
    },

    // Cron Triggers 定时任务处理器
    async scheduled(event, env, ctx) {
        ctx.waitUntil(checkDomainsScheduled(env).catch(err => {
            console.error('定时任务执行失败:', err);
        }));
    }
};