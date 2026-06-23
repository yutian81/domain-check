// src/api/whois.js

import { isPrimaryDomain } from '../utils';

// ====== 主源：ip.sb WHOIS 服务 ======

async function fetchWhoisData(domain) {
    const whoisUrl = `https://ip.sb/whois/${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(whoisUrl, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (WHOIS API Service)' }
        });
        if (!response.ok) throw new Error(`WHOIS服务返回${response.status}`);
        return await response.text();
    } catch (error) {
        if (error.name === 'AbortError') throw new Error("WHOIS查询超时");
        throw error;
    } finally { 
        clearTimeout(timeout);
    }
}

function extractWhoisData(html) {
    const domainNameMatch = html.match(/Domain Name:\s*([^\n]+)/i);
    const domainName = domainNameMatch ? domainNameMatch[1].trim().toLowerCase() : null;
    const creationDateMatch = html.match(/Creation Date:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const updatedDateMatch = html.match(/Updated Date:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const expiryDateMatch = html.match(/Registry Expiry Date:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const registrarMatch = html.match(/Registrar:\s*([^\s,，]+)/i)?.[1]?.trim() || null;
    const registrarUrlMatch = html.match(/Registrar URL:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const nameServers = html.match(/Name Server:\s*([^\n]+)/gi) || [];
    const formattedNameServers = [...new Set(nameServers.map(ns => 
      ns.replace(/Name Server:\s*/i, '').trim().toLowerCase()
    ))];

    return {
        domain: domainName,
        creationDate: creationDateMatch,
        updatedDate: updatedDateMatch,
        expiryDate: expiryDateMatch,
        registrar: registrarMatch,
        registrarUrl: registrarUrlMatch,
        nameServers: formattedNameServers,
    };
}

// ====== 备用源：RDAP 协议 (RFC 7480) ======

async function fetchRDAPData(domain) {
    const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/rdap+json' }
        });
        if (!response.ok) throw new Error(`RDAP服务返回${response.status}`);
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') throw new Error("RDAP查询超时");
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function extractRDAPData(json, domain) {
    const events = json.events || [];
    const findEvent = (action) => {
        const event = events.find(e => e.eventAction === action);
        return event ? event.eventDate : null;
    };

    // RDAP 实际返回的 entities 中 vcardArray 可能是非标准字符串
    // 尝试从 handle 或 registrar RDAP 链接推断注册商信息
    let registrar = null;
    let registrarUrl = null;

    const entities = json.entities || [];
    for (const entity of entities) {
        if (entity.roles?.includes('registrar')) {
            // 有些 RDAP 返回标准 vcardArray
            const vcard = entity.vcardArray;
            if (Array.isArray(vcard) && vcard[1]) {
                for (const field of vcard[1]) {
                    if (field[0] === 'fn') {
                        registrar = field[3] || null;
                        break;
                    }
                }
            }
            // 如果 vcardArray 不是数组（如 "vcard System.Object[]"），用 handle 作为注册商标识
            if (!registrar && entity.handle) {
                registrar = entity.handle;
            }
        }
    }

    // 提取注册商 URL：从顶层 links 中找 related 链接
    const topLinks = json.links || [];
    for (const link of topLinks) {
        if (link.rel === 'related' && link.href) {
            registrarUrl = link.href;
            break;
        }
    }

    const nameServers = (json.nameservers || []).map(ns => ns.ldhName).filter(Boolean);

    return {
        domain: json.ldhName || domain,
        creationDate: findEvent('registration'),
        updatedDate: findEvent('last changed'),
        expiryDate: findEvent('expiration'),
        registrar,
        registrarUrl,
        nameServers,
    };
}

// ====== 主入口：先尝试主源，失败后尝试备用 ======

export async function fetchDomainFromAPI(env, domain) {
    // 主源：ip.sb WHOIS
    try {
        const html = await fetchWhoisData(domain);
        const data = extractWhoisData(html);
        if (data && data.expiryDate) {
            console.log(`whois.sb 查询成功: ${domain}`);
            return data;
        }
        console.warn(`whois.sb 返回数据不完整 (${domain})，尝试 RDAP 回退...`);
    } catch (err) {
        console.warn(`whois.sb 查询失败 (${domain}): ${err.message}，尝试 RDAP 回退...`);
    }

    // 备用源：RDAP
    try {
        const json = await fetchRDAPData(domain);
        const data = extractRDAPData(json, domain);
        if (data && data.expiryDate) {
            console.log(`RDAP 回退查询成功: ${domain}`);
            return data;
        }
        console.warn(`RDAP 返回数据不完整 (${domain})`);
    } catch (err) {
        console.warn(`RDAP 回退查询失败 (${domain}): ${err.message}`);
    }

    return null;
}

// WHOIS API 路由处理函数 /api/whois/<domain>
export async function onRequest(context, domain) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    
    if (!domain) {
        return new Response(JSON.stringify({ error: '路径格式应为 /api/whois/<域名>' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 仅允许查询一级域名
    if (!isPrimaryDomain(domain)) {
        return new Response(JSON.stringify({ error: '仅支持查询一级域名。' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const whoisData = await fetchDomainFromAPI(env, domain);
 
        if (whoisData) {
            return new Response(JSON.stringify({ success: true, data: whoisData }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=86400' 
                }
            });
        } else {
            return new Response(JSON.stringify({ error: '无法查询到该域名的 WHOIS 信息或信息不完整。' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    
    } catch (error) {
        console.error('WHOIS API 错误:', error);
        return new Response(JSON.stringify({ error: 'WHOIS 查询服务出错。', details: error.message }), { 
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
