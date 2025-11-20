// src/api/whois.js

import { isPrimaryDomain } from '../utils';

// WHOIS查询模块
async function fetchWhoisData(domain) {
    const whoisUrl = `https://ip.sb/whois/${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8秒超时

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

// WHOIS数据处理模块
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

export async function fetchDomainFromAPI(env, domain) {
    try {
        const html = await fetchWhoisData(domain);
        return extractWhoisData(html);
    } catch (error) {
        console.error(`WHOIS 查询失败 (${domain}):`, error.message);
        return null;
    }
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
        // 调用 WHOIS 查询函数
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
