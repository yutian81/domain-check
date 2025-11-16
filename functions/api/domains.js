// functions/api/domains.js

import { isPrimaryDomain, fetchDomainFromAPI } from '../utils';

const KV_KEY = 'DOMAIN_LIST';

async function getDomainsFromKV(env) {
    if (!env.DOMAIN_KV) {
        throw new Error('KV namespace DOMAIN_KV not configured. Please check your wrangler configuration.');
    }
    const data = await env.DOMAIN_KV.get(KV_KEY, { type: 'json' });
    return Array.isArray(data) ? data : [];
}

async function setDomainsToKV(env, domains) {
    if (!env.DOMAIN_KV) {
        throw new Error('KV namespace DOMAIN_KV not configured. Please check your wrangler configuration.');
    }
    await env.DOMAIN_KV.put(KV_KEY, JSON.stringify(domains));
}

/**
 * 验证和处理单个域名数据的 POST 请求
 * @param {Request} request 
 * @param {Env} env 
 */
async function handlePostDomain(request, env) {
    let newDomainData;
    try {
        newDomainData = await request.json();
        if (!newDomainData || !newDomainData.domain) {
            return new Response('Invalid domain data payload.', { status: 400 });
        }
    } catch (e) {
        return new Response('Invalid JSON format.', { status: 400 });
    }

    try {
        const domainName = newDomainData.domain;
        const originalDomainName = newDomainData.originalDomain || domainName;
        const allDomains = await getDomainsFromKV(env);
        const isPrimary = isPrimaryDomain(domainName);
        const isEdit = allDomains.some(d => d.domain === originalDomainName);
        
        // --- WHOIS 自动填充逻辑 ---
        // 条件：一级域名 (isPrimary) 且用户未手动输入关键信息 (expirationDate 缺失)
        if (isPrimary && !newDomainData.expirationDate) {
            console.log(`一级域名 ${domainName} 缺少到期日期，尝试 WHOIS 自动填充...`);
            const apiData = await fetchDomainFromAPI(env, domainName);

            if (apiData) {
                // 自动填充 WHOIS 查到的信息
                newDomainData.registrationDate = apiData.registrationDate;
                newDomainData.expirationDate = apiData.expirationDate;
                newDomainData.system = apiData.system;
                newDomainData.systemURL = apiData.systemURL;
                console.log(`WHOIS 填充成功: 到期日期 ${apiData.expirationDate}`);
            } else if (!isEdit) {
                // 如果是新增，且 WHOIS 查询失败，则要求手动输入 (尽管前端会检查)
                return new Response('WHOIS查询失败，请手动输入注册信息。', { status: 422 });
            }
        } else if (!isPrimary) {
            // 二级域名或一级域名但用户已手动输入，则进行缺失字段检查
            if (!newDomainData.expirationDate || !newDomainData.registrationDate || !newDomainData.system) {
                return new Response('二级域名或手动输入时，注册/到期时间、注册商名称为必填项。', { status: 422 });
            }
        }
        
        // --- KV 更新逻辑 ---
        delete newDomainData.originalDomain;

        let updatedDomains;

        if (isEdit) {
            // 编辑：先检查是否与其他域名冲突
            const hasConflict = allDomains.some(d => d.domain === domainName && d.domain !== originalDomainName);
            if (hasConflict) {
                return new Response('域名已存在！', { status: 409 });
            }

            updatedDomains = allDomains.map(d =>
                d.domain === originalDomainName ? { ...d, ...newDomainData } : d
            );
        } else {
            // 新增：检查重复
            if (allDomains.some(d => d.domain === domainName)) {
                return new Response('域名已存在！', { status: 409 });
            }
            updatedDomains = [...allDomains, newDomainData];
        }

        await setDomainsToKV(env, updatedDomains);

        return new Response(JSON.stringify({ success: true, domain: newDomainData.domain }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in handlePostDomain:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const { request, env } = context;

    try {
        if (request.method === 'GET') {
            const domains = await getDomainsFromKV(env);
            return new Response(JSON.stringify(domains), {
                headers: { 'Content-Type': 'application/json' }
            });
        } 
        
        if (request.method === 'POST') {
            // 用于添加或编辑单个域名
            return handlePostDomain(request, env);
        }
        
        // 我们保留 PUT 请求，以便前端可以实现批量操作，但 POST 才是主要提交方式
        if (request.method === 'PUT') {
            // 接收完整的新列表并替换旧列表 (主要用于前端批量保存或删除后的全量更新)
            let newDomains;
            try {
                newDomains = await request.json();
                if (!Array.isArray(newDomains)) throw new Error('Input must be an array.');
            } catch (e) {
                return new Response('Invalid JSON format or not an array.', { status: 400 });
            }
            await setDomainsToKV(env, newDomains);
            return new Response(JSON.stringify({ success: true, count: newDomains.length }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Method Not Allowed', { status: 405 });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
