// src/utils.js

// 从环境变量读取配置
export function getConfig(env) {
    return {
        siteName: env.SITENAME || "域名到期监控",
        siteIcon: env.ICON || 'https://pan.811520.xyz/icon/domain-check.png',
        bgimgURL: env.BGIMG || 'https://pan.811520.xyz/icon/bg_light.webp',
        githubURL: env.GITHUB_URL || 'https://github.com/yutian81/domain-check',
        blogURL: env.BLOG_URL || 'https://blog.notett.com/post/2025/11/251118-domain-check/',
        blogName: env.BLOG_NAME || 'QingYun Blog',
        password: env.PASSWORD || "123123",
        days: Number(env.DAYS || 30), // 用于前端即将到期判断
        tgid: env.TGID || env.TG_CHAT_ID,
        tgtoken: env.TGTOKEN || env.TG_BOT_TOKEN
    };
}

// 格式化日期为北京时间 YYYY-MM-DD
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
