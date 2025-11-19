// src/index.js

// 导入所有动态逻辑模块
import { getConfig } from './utils';
import { HTML_TEMPLATE } from '../frontend/index';
import { onRequest as configApi } from './api/config';
import { onRequest as domainsApi } from './api/domains';
import { checkDomainsScheduled } from './cron';
import { authenticate, handleLogin } from './_middleware';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        if (pathname === '/api/config') {
            const context = { request, env, next: () => {} }; 
            return configApi(context);
        }

        // 处理手动触发 /cron 路由
        if (pathname === '/cron') {
            if (request.method !== 'GET' && request.method !== 'POST') {
                return new Response('Method Not Allowed', { status: 405 });
            }
            
            try {
                const expiringDomains = await checkDomainsScheduled(env); 
                const responseBody = {
                    success: true,
                    message: expiringDomains.length > 0 
                             ? `已找到 ${expiringDomains.length} 个即将到期的域名，Telegram通知已尝试发送。`
                             : "没有即将到期的域名。",
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
        
        if (pathname === '/login') {
            return handleLogin(request, env);
        }
        
        const config = getConfig(env);
        // 定义需要豁免认证的路径
        const authExemptPaths = ['/api/config', '/cron', '/login'];
        const isExempt = authExemptPaths.includes(pathname); 

        // 如果设置了密码，且请求不是豁免路径，则执行认证
        if (config.password && !isExempt) {
            const authResponse = await authenticate(request, env);
            if (authResponse) {
                return authResponse; // 返回 302 重定向到 /login
            }
        }

        // 处理 API 路由
        if (pathname.startsWith('/api/')) {
            const context = { request, env, ctx, next: () => {} };
            if (url.pathname === '/api/domains') {
                return domainsApi(context);
            }
            return new Response('API Not Found', { status: 404 });
        }
 
        // 处理根目录请求
        if (pathname === '/') {
            return new Response(HTML_TEMPLATE(
                config.siteName, 
                config.siteIcon, 
                config.bgimgURL, 
                config.githubURL, 
                config.blogURL, 
                config.blogName
            ), {
                headers: { 
                    'Content-Type': 'text/html;charset=UTF-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        }
        
        return new Response('Not Found', { status: 404 });
    },

    // Cron Triggers 定时任务处理器 (保持不变)
    async scheduled(event, env, ctx) {
        ctx.waitUntil(checkDomainsScheduled(env).catch(err => {
            console.error('定时任务执行失败:', err);
        }));
    }
};
