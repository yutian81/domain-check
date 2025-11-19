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
        tgtoken: env.TGTOKEN || env.TG_BOT_TOKEN,
        apiUrl: env.WHOIS_API_URL,
        apiKey: env.WHOIS_API_KEY
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

// WHOIS API 调用函数
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
        
        const data = await response.json();
        if (!data.creationDate || !data.expiryDate) {
             console.error("WHOIS API返回数据缺少 creationDate 或 expiryDate 字段。");
             return null;
        }

        // 成功并返回数据
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
