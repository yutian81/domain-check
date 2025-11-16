// functions/scheduled.js

import { getConfig, sendtgMessage } from './utils';
import { onRequest as domainsApi } from './api/domains'; // 导入 KV API 逻辑

// 封装获取域名列表的函数
async function getDomainsList(env) {
    const request = new Request('https://placeholder/api/domains', { method: 'GET' });
    const response = await domainsApi({ request, env });
    if (response.ok) {
        return response.json();
    }
    return [];
}

// 原始代码中的 checkDomains 核心逻辑 (简化并移除 WHOIS API 调用，因数据已在 KV 中)
async function checkDomainsScheduled(env) {
    const config = getConfig(env);
    const allDomains = await getDomainsList(env);

    if (allDomains.length === 0) {
        console.log("KV中没有域名数据，跳过定时检查。");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const domainInfo of allDomains) {
        // 使用配置中的 DAYS (默认为 30) 来判断
        const maxDaysForAlert = config.days; 
        
        // 确保 expirationDate 是 Date 对象
        const expirationDate = new Date(domainInfo.expirationDate);
        expirationDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // 只对即将到期 (1 < 剩余天数 <= maxDaysForAlert) 的域名发送通知
        if (daysRemaining > 0 && daysRemaining <= maxDaysForAlert) {
            const message = `
<b>🚨 域名到期提醒 🚨</b>
            
域名: <code>${domainInfo.domain}</code>
将在 <b>${daysRemaining} 天</b>后过期！
📅 过期日期: ${domainInfo.expirationDate}
🔗 注册商: <a href="${domainInfo.systemURL}">${domainInfo.system}</a>
👤 注册账号: ${domainInfo.registerAccount || 'N/A'}`;

            // 注意: KV 中没有 DOMAINS_TG_KV 命名空间。
            // 简单起见，我们假设每天运行一次，并发送一次通知。
            // 如果需要防止重复发送，你需要配置另一个 KV 命名空间（比如 DOMAIN_ALERTS_KV）来存储上次发送日期。
            await sendtgMessage(message, config.tgid, config.tgtoken);
            console.log(`已发送 ${domainInfo.domain} 的到期通知.`);
        }
    }
}

export const onScheduled = async (event, env, ctx) => {
    ctx.waitUntil(checkDomainsScheduled(env).catch(err => {
        console.error('定时任务执行失败:', err);
    }));
}
