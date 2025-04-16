// 鉴权模块
function validateApiKey(request, env) {
  if (!env.API_KEY) return createErrorResponse("未配置环境变量 API Key", 503);
  const apiKey = request.headers.get('X-API-KEY');
  if (!apiKey) return createErrorResponse("需要提供有效的 API Key", 401);
  if (apiKey !== env.API_KEY) return createErrorResponse("无效的 API Key", 403);
  return null;
}

// 域名验证模块
function validateDomain(url) {
  const pathSegments = url.pathname.split('/');
  const domain = pathSegments[2];
  if (pathSegments[1] !== 'api') return { valid: false, error: "路径格式应为 /api/<域名>" };
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return { valid: false, error: "域名格式无效" };
  return { valid: true, domain };
}

// 缓存模块
async function getCachedResponse(cacheKey, env) {
  const cached = await caches.default.match(cacheKey);
  if (!cached) return null;

  const cachedDate = new Date(cached.headers.get('x-cache-date'));
  const cacheAgeHours = (Date.now() - cachedDate.getTime()) / (1000 * 60 * 60);
  const maxAge = env.CACHE_HOURS || 24;

  if (cacheAgeHours < maxAge) {
    const cachedResponse = new Response(cached.body, cached);
    cachedResponse.headers.set('x-cache-status', 'HIT');
    return cachedResponse;
  }
  return null;
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
  // const nameServers = html.match(/Name Server:\s*([\s\S]*?)(?=\n\S|$)/gi) || [];
  // const formattedNameServers = [...new Set(nameServers.map(ns => 
  //     ns.replace(/Name Server:\s*/i, '').replace(/\s+/g, ' ').trim().toLowerCase()
  // ))];

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

// WHOIS查询模块
async function fetchWhoisData(domain) {
  const whoisUrl = `https://ip.sb/whois/${encodeURIComponent(domain)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  
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

// 响应生成模块
function createJsonResponse(data, cacheStatus = 'MISS', env = {}) {
  const CACHE_MAX_AGE = (env.CACHE_HOURS || 24) * 3600;
  return new Response(JSON.stringify(data, null, 2), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      "x-cache-date": new Date().toUTCString(),
      "x-cache-status": cacheStatus
    },
  });
}

function createErrorResponse(message, status = 400, error = null) {
  return new Response(
    JSON.stringify({ error: message, stack: error ? error.stack : null }),
    { 
      status, headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      } 
    }
  );
}

// 主处理函数
async function handleRequest(request, env, ctx) {
  try {
    // API Key 鉴权
    const authError = validateApiKey(request, env);
    if (authError) return authError;

    // 域名验证
    const url = new URL(request.url);
    const domainValidation = validateDomain(url);
    if (!domainValidation.valid) return createErrorResponse(domainValidation.error, 400);
    const domain = domainValidation.domain;

    // 检查缓存
    const cacheKey = new Request(url.toString(), request);
    const cachedResponse = await getCachedResponse(cacheKey, env);
    if (cachedResponse) return cachedResponse;

    // WHOIS 查询
    const html = await fetchWhoisData(domain);
    
    // 提取数据并缓存
    const result = extractWhoisData(html);
    const responseData = createJsonResponse(result);
    ctx.waitUntil(caches.default.put(cacheKey, responseData.clone()));
    return responseData;

  } catch (error) {
    const status = error.message.includes("WHOIS") ? 502 : 500;
    return createErrorResponse(error.message, status, error);
  }
}

export default { fetch: handleRequest };
