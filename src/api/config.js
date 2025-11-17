// src/api/config.js

import { getConfig } from '../utils';

export async function onRequest(context) {
    const { env } = context;
    const config = getConfig(env);
    
    // 只返回前端需要的配置，避免泄露敏感信息（如 password, tgtoken, apiKey）
    const clientConfig = {
        siteName: config.siteName,
        siteIcon: config.siteIcon,
        bgimgURL: config.bgimgURL,
        githubURL: config.githubURL,
        blogURL: config.blogURL,
        blogName: config.blogName,
        days: config.days,
    };

    return new Response(JSON.stringify(clientConfig), {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400' // 配置信息可以缓存
        }
    });
}
