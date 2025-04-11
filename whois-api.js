async function handleRequest(request, env, ctx) {
  try {
    // 从URL路径中获取域名（例如 /api/dpdns.org -> dpdns.org）
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const domain = pathSegments[2];

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "未提供域名，请使用格式 /api/<域名>" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          } 
        }
      );
    }

    // 基础域名格式验证
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return new Response(
        JSON.stringify({ error: "域名格式无效" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          } 
        }
      );
    }

    // 检查缓存
    const cacheKey = new Request(`https://whois-cache/${domain}`, request);
    const cached = await caches.default.match(cacheKey);
    
    // 如果有缓存且未过期，直接返回缓存
    if (cached) {
      const cachedDate = new Date(cached.headers.get('x-cache-date'));
      const cacheAgeHours = (Date.now() - cachedDate.getTime()) / (1000 * 60 * 60);
      
      if (cacheAgeHours < 24) {
        // 克隆响应以避免修改原始缓存
        const cachedResponse = new Response(cached.body, cached);
        cachedResponse.headers.set('x-cache-status', 'HIT');
        return cachedResponse;
      }
    }

    // 查询 WHOIS 信息
    const response = await fetch(`https://ip.sb/whois/${encodeURIComponent(domain)}`);
    const html = await response.text();

    // 提取关键字段
    const domainNameMatch = html.match(/Domain Name:\s*([^\n]+)/i);
    const domainName = domainNameMatch 
      ? domainNameMatch[1].trim().toLowerCase() 
      : null;
    const creationDateMatch = html.match(/Creation Date:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const updatedDateMatch = html.match(/Updated Date:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const expiryDateMatch = html.match(/Registry Expiry Date:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const registrarUrlMatch = html.match(/Registrar URL:\s*([^\n]+)/i)?.[1]?.trim() || null;
    const nameServers = html.match(/Name Server:\s*([^\n]+)/gi) || [];
    const formattedNameServers = [...new Set(nameServers.map(ns => 
        ns.replace(/Name Server:\s*/i, '').trim().toLowerCase())
    )];
    // const nameServers = html.match(/Name Server:\s*([\s\S]*?)(?=\n\S|$)/gi) || [];
    // const formattedNameServers = [...new Set(nameServers.map(ns => 
    //     ns.replace(/Name Server:\s*/i, '').replace(/\s+/g, ' ').trim().toLowerCase())
    // )];

    // 返回结构化数据
    const result = {
      domain: domainName,
      creationDate: creationDateMatch,
      updatedDate: updatedDateMatch,
      expiryDate: expiryDateMatch,
      registrarUrl: registrarUrlMatch,
      nameServers: formattedNameServers,
    };

    const responseData = new Response(JSON.stringify(result, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400", // 24小时缓存
        "x-cache-date": new Date().toUTCString(), // 记录缓存时间
        "x-cache-status": "MISS" // 标记为未命中缓存
      },
    });

    // 存储缓存（异步操作，不影响响应）
    ctx.waitUntil(caches.default.put(cacheKey, responseData.clone()));
    return responseData;

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    );
  }
}

export default { fetch: handleRequest };
