// src/api/domains.js

import { isPrimaryDomain } from '../utils';
import { fetchDomainFromAPI } from './whois';

const DOMAIN_KEY_PREFIX = 'domain:';

// 从 KV 中列出所有域名 key（分页安全）
async function getAllDomainKeys(env) {
    const keys = [];
    let cursor;
    do {
        const result = await env.DOMAIN_KV.list({ prefix: DOMAIN_KEY_PREFIX, cursor });
        keys.push(...result.keys);
        cursor = result.cursor;
    } while (cursor);
    return keys.map(k => k.name);
}

// 从 KV 中读取单个域名详情
async function getDomainFromKV(env, key) {
    return await env.DOMAIN_KV.get(key, { type: 'json' });
}

// 从 KV 中获取所有域名列表（聚合）
export async function getDomainsFromKV(env) {
    if (!env.DOMAIN_KV) {
        throw new Error('未配置KV命名空间 DOMAIN_KV。请检查您的配置');
    }
    const keys = await getAllDomainKeys(env);

    // ----- 自动迁移：兼容旧版单 key (DOMAIN_LIST) 存储 -----
    if (keys.length === 0) {
        const oldData = await env.DOMAIN_KV.get('DOMAIN_LIST', { type: 'json' });
        if (Array.isArray(oldData) && oldData.length > 0) {
            console.log(`检测到旧版 KV 数据 (DOMAIN_LIST, ${oldData.length} 个域名)，正在迁移...`);
            // 写入新格式：每个域名独立 key
            await Promise.all(oldData.map(d =>
                env.DOMAIN_KV.put(DOMAIN_KEY_PREFIX + d.domain, JSON.stringify(d))
            ));
            // 删除旧 key
            await env.DOMAIN_KV.delete('DOMAIN_LIST');
            console.log('KV 数据迁移完成');
            return oldData; // 直接返回迁移后的数据
        }
        return [];
    }

    // 批量读取每个域名详情
    const results = await Promise.all(keys.map(k => getDomainFromKV(env, k)));
    return results.filter(Boolean); // 过滤掉可能的空值
}

// 将域名列表保存到 KV（全量覆盖 — 仅用于导入/PUT）
export async function setDomainsToKV(env, domains) {
    if (!env.DOMAIN_KV) {
        throw new Error('未配置KV命名空间 DOMAIN_KV。请检查您的配置');
    }

    // 1. 删除旧数据（新格式 + 兼容旧格式）
    const oldKeys = await getAllDomainKeys(env);
    await Promise.all(oldKeys.map(k => env.DOMAIN_KV.delete(k)));
    await env.DOMAIN_KV.delete('DOMAIN_LIST').catch(() => {}); // 兼容旧版单 key

    // 2. 写入新数据
    await Promise.all(domains.map(d =>
        env.DOMAIN_KV.put(DOMAIN_KEY_PREFIX + d.domain, JSON.stringify(d))
    ));
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
        const isEdit = originalDomainName !== domainName || 
                       await env.DOMAIN_KV.get(DOMAIN_KEY_PREFIX + originalDomainName, { type: 'json' }) !== null;
        const isPrimary = isPrimaryDomain(domainName);
        
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
        // 外层已确保 !expirationDate，内层不再重复检查
        if (!newDomainData.expirationDate) {
            if (!newDomainData.registrationDate || !newDomainData.system || !newDomainData.systemURL) {
                return new Response(JSON.stringify({ error: '信息不完整：注册/到期时间、注册商名称和URL为必填项。' }), { 
                    status: 422,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // --- KV 更新逻辑 ---
        // 拷贝一份再删除，避免修改传入的 request body 对象
        const { originalDomain, ...domainData } = newDomainData;

        // 编辑时先删除旧 key，再写新 key（域名可能被改名）
        if (isEdit && originalDomainName !== domainName) {
            await env.DOMAIN_KV.delete(DOMAIN_KEY_PREFIX + originalDomainName);
        }

        // 检查新 key 是否已存在（编辑且域名不变时不检查自身）
        const existingKey = DOMAIN_KEY_PREFIX + domainName;
        if (isEdit && originalDomainName === domainName) {
            // 编辑且域名未变：直接覆盖写入
            await env.DOMAIN_KV.put(existingKey, JSON.stringify(domainData));
        } else {
            const existing = await env.DOMAIN_KV.get(existingKey, { type: 'json' });
            if (existing) {
                return new Response('域名已存在！', { status: 409 });
            }
            await env.DOMAIN_KV.put(existingKey, JSON.stringify(domainData));
        }

        return new Response(JSON.stringify({ success: true, domain: domainData.domain }), {
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
        // 直接删除每个域名对应的 KV key，无需读取全量列表
        const deleteResults = await Promise.allSettled(
            domainsToDelete.map(d => env.DOMAIN_KV.delete(DOMAIN_KEY_PREFIX + d))
        );
        const deletedCount = deleteResults.filter(r => r.status === 'fulfilled').length;
        
        if (deletedCount === 0) {
            return new Response(JSON.stringify({ success: false, message: `未找到任何要删除的域名。` }), { status: 404 });
        }
        
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

// 续费域名处理: PATCH /api/domains
async function handlePatchDomain(request, env) {
    let data;
    try {
        data = await request.json();
        if (!data || !data.domain || !data.duration || !data.unit) {
            return new Response(JSON.stringify({ error: '缺少必填字段: domain, duration, unit' }), { status: 400 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: '无效的 JSON 格式' }), { status: 400 });
    }

    const domainName = data.domain;
    const duration = parseInt(data.duration);
    const unit = data.unit;

    if (duration < 1) {
        return new Response(JSON.stringify({ error: '续费时长必须大于0' }), { status: 400 });
    }

    if (unit !== 'year' && unit !== 'month') {
        return new Response(JSON.stringify({ error: '续费单位必须是 year 或 month' }), { status: 400 });
    }

    try {
        const key = DOMAIN_KEY_PREFIX + domainName;
        const existing = await env.DOMAIN_KV.get(key, { type: 'json' });

        if (!existing) {
            return new Response(JSON.stringify({ error: `域名 ${domainName} 未找到` }), { status: 404 });
        }

        // 计算新到期时间 = 当前到期时间 + 续费时长
        const currentExpDate = new Date(existing.expirationDate);
        if (isNaN(currentExpDate.getTime())) {
            return new Response(JSON.stringify({ error: '域名到期日期格式无效' }), { status: 400 });
        }

        const newExpDate = new Date(currentExpDate);
        if (unit === 'year') {
            newExpDate.setFullYear(currentExpDate.getFullYear() + duration);
        } else {
            newExpDate.setMonth(currentExpDate.getMonth() + duration);
        }

        // 格式化为 YYYY-MM-DD
        const year = newExpDate.getFullYear();
        const month = String(newExpDate.getMonth() + 1).padStart(2, '0');
        const day = String(newExpDate.getDate()).padStart(2, '0');
        const newExpirationDate = `${year}-${month}-${day}`;

        // 同时更新到期时间和续费周期
        existing.expirationDate = newExpirationDate;
        existing.renewalPeriod = duration;
        existing.renewalUnit = unit;

        // 写入 KV
        await env.DOMAIN_KV.put(key, JSON.stringify(existing));

        return new Response(JSON.stringify({
            success: true,
            domain: domainName,
            newExpirationDate: newExpirationDate,
            renewedDuration: duration,
            renewedUnit: unit,
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in handlePatchDomain:', error);
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

        // 续费域名 PATCH 路由处理
        if (request.method === 'PATCH') {
            return handlePatchDomain(request, env);
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
