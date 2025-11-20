// src/api/domains.js

import { isPrimaryDomain } from '../utils';
import { fetchDomainFromAPI } from './whois';

const KV_KEY = 'DOMAIN_LIST';

// 从KV中获取域名列表
export async function getDomainsFromKV(env) {
    if (!env.DOMAIN_KV) {
        throw new Error('未配置KV命名空间 DOMAIN_KV。请检查您的配置');
    }
    const data = await env.DOMAIN_KV.get(KV_KEY, { type: 'json' });
    return Array.isArray(data) ? data : [];
}

// 保存域名信息到KV
export async function setDomainsToKV(env, domains) {
    if (!env.DOMAIN_KV) {
        throw new Error('未配置KV命名空间 DOMAIN_KV。请检查您的配置');
    }
    await env.DOMAIN_KV.put(KV_KEY, JSON.stringify(domains));
}

// 验证和处理单个域名数据的 POST 请求
async function handlePostDomain(request, env) {
    let newDomainData;
    try {
        newDomainData = await request.json();
        if (!newDomainData || !newDomainData.domain) {
            return new Response(JSON.stringify({ error: 'Invalid domain data payload.' }), { status: 400 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON format.' }), { status: 400 });
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
                newDomainData.registrationDate = apiData.creationDate;
                newDomainData.expirationDate = apiData.expiryDate;
                newDomainData.system = apiData.registrar;
                newDomainData.systemURL = apiData.registrarUrl;
                console.log(`WHOIS 填充成功: 到期日期 ${apiData.expiryDate}`);
            } else if (!isEdit) {
                // 如果是新增，且 WHOIS 查询失败，则要求手动输入
                return new Response(JSON.stringify({ error: 'WHOIS查询失败，请手动输入注册信息。' }), { 
                    status: 422,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 必填项检查逻辑 (针对所有未被 WHOIS 成功填充的域名)
        if (!newDomainData.expirationDate) {
            if (!newDomainData.registrationDate || !newDomainData.system || !newDomainData.expirationDate || !newDomainData.systemURL) {
                return new Response(JSON.stringify({ error: '信息不完整：注册/到期时间、注册商名称和URL为必填项。' }), { 
                    status: 422,
                    headers: { 'Content-Type': 'application/json' }
                });
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

// 删除域名
async function handleDeleteDomain(request, env) {
    let deleteData;
    let domainsToDelete = [];
    
    try {
        deleteData = await request.json();
        if (Array.isArray(deleteData)) { // 批量删除
            domainsToDelete = deleteData.filter(d => typeof d === 'string' && d.length > 0);
        } else if (deleteData && deleteData.domain) { // 单个删除
            domainsToDelete = [deleteData.domain];
        } else {
            return new Response(JSON.stringify({ error: '无效的删除请求格式。期望 {"domain": "..."} 或 ["d1", "d2"] 数组。' }), { status: 400 });
        }

        if (domainsToDelete.length === 0) {
            return new Response(JSON.stringify({ error: '未提供有效的域名进行删除。' }), { status: 400 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: '无效的 JSON 格式。' }), { status: 400 });
    }

    try {
        const allDomains = await getDomainsFromKV(env);
        // 过滤掉 domainsToDelete 列表中的所有域名
        const initialLength = allDomains.length;
        const updatedDomains = allDomains.filter(d => !domainsToDelete.includes(d.domain));
        const deletedCount = initialLength - updatedDomains.length;
        
        if (deletedCount === 0) {
            return new Response(JSON.stringify({ success: false, message: `未找到任何要删除的域名。` }), { status: 404 });
        }
        
        await setDomainsToKV(env, updatedDomains);
        return new Response(JSON.stringify({ success: true, message: `成功删除 ${deletedCount} 个域名。`, deletedCount: deletedCount }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('handleDeleteDomain中的错误:', error);
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
            return handlePostDomain(request, env); // 用于添加或编辑单个域名
        }
        
        if (request.method === 'PUT') {
            // 接收完整的新列表并替换旧列表
            let newDomains;
            try {
                newDomains = await request.json();
                if (!Array.isArray(newDomains)) throw new Error('输入必须是数组');
            } catch (e) {
                return new Response('无效的JSON格式或不是数组', { status: 400 });
            }
            await setDomainsToKV(env, newDomains);
            return new Response(JSON.stringify({ success: true, count: newDomains.length }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 删除域名 DELETE 路由处理
        if (request.method === 'DELETE') {
            return handleDeleteDomain(request, env);
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
