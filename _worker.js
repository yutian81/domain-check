// 定义外部变量
let sitename = "域名监控"; //变量名SITENAME，自定义站点名称，默认为“域名监控”
let domains = ""; //变量名DOMAINS，填入域名信息json文件直链，必须设置的变量
let tgid = ""; //变量名TGID，填入TG机器人ID，不需要提醒则不填
let tgtoken = ""; //变量名TGTOKEN，填入TG的TOKEN，不需要提醒则不填
let days = "7"; //变量名DAYS，提前几天发送TG提醒，默认为7天，必须为大于0的整数

async function sendtgMessage(message, tgid, tgtoken) {
  const url = `https://api.telegram.org/bot${tgtoken}/sendMessage`;
  const params = {
    chat_id: tgid,
    text: message,
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export default {
    async fetch(request, env) {
      sitename = env.SITENAME || sitename;
      domains = env.DOMAINS || domains;
      tgid = env.TGID || tgid;
      tgtoken = env.TGTOKEN || tgtoken;
      days = env.DAYS || days;
      
      // 读取变量DOMAINS中的域名数据，格式为json
      if (!domains) {
        return new Response("DOMAINS 环境变量未设置", { status: 500 });
      }
  
      try {
        const response = await fetch(domains);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        domains = await response.json();
        if (!Array.isArray(domains)) {
          throw new Error('JSON 数据格式不正确');
        }
  
        // 检查即将过期的域名并发送 Telegram 消息
        for (const domain of domains) {
          const expirationDate = new Date(domain.expirationDate);
          const today = new Date();
          const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
  
          if (daysRemaining > 0 && daysRemaining <= days) {
            const message = `域名 ${domain.domain} 将在 ${daysRemaining} 天后过期。过期日期：${domain.expirationDate}`;
            await sendtgMessage(message, tgid, tgtoken);
          }
        }
  
        // 正确处理 generateHTML 的返回值
        const htmlContent = await generateHTML(domains, sitename);
        return new Response(htmlContent, {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (error) {
        console.error("Fetch error:", error);
        return new Response("无法获取或解析 domains.json 文件", { status: 500 });
      }
    }
};

async function generateHTML(domains, SITENAME) {
  //const faviconURL = "https://example.com/favicon.ico";  // 如果不会修改svg图标，可删除107行svg代码，下载一个ico或png格式的图标上传到你的仓库，修改本行图标文件的链接
  const rows = await Promise.all(domains.map(async info => {
    const registrationDate = new Date(info.registrationDate);
    const expirationDate = new Date(info.expirationDate);
    const today = new Date();
    const totalDays = (expirationDate - registrationDate) / (1000 * 60 * 60 * 24);
    const daysElapsed = (today - registrationDate) / (1000 * 60 * 60 * 24);
    const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    const isExpired = today > expirationDate;
    const statusColor = isExpired ? '#e74c3c' : '#2ecc71';
    const statusText = isExpired ? '已过期' : '正常';

    return `
      <tr>
        <td><span class="status-dot" style="background-color: ${statusColor};" title="${statusText}"></span></td>
        <td>${info.domain}</td>
        <td><a href="${info.systemURL}" target="_blank">${info.system}</a></td>
        <td>${info.registrationDate}</td>
        <td>${info.expirationDate}</td>
        <td>${isExpired ? '已过期' : daysRemaining + ' 天'}</td>
        <td>
          <div class="progress-bar">
            <div class="progress" style="width: ${progressPercentage}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }));

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${SITENAME}</title>
      <link rel="icon" href="data:image/<svg t="1724230751675" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4434" width="200" height="200"><path d="M441.344 642.048h-256V279.552h497.152v87.552s70.656-4.096 106.496 8.704V281.6s-2.048-113.152-108.544-113.152H192c0 2.048-106.496 10.752-106.496 119.296v347.648s-6.656 115.2 104.448 115.2 170.496 2.048 170.496 2.048 10.752 34.304-66.048 51.2c-80.896 14.848-153.6 14.848-164.352 70.656h431.104S435.2 782.848 441.344 642.048z" fill="#FF6A00" p-id="4435"></path><path d="M725.504 418.304c-125.952 0-228.352 102.4-228.352 228.352s102.4 228.352 228.352 228.352 228.352-102.4 228.352-228.352-102.912-228.352-228.352-228.352z m-36.352 55.296c10.752-2.048 23.552-4.096 34.304-4.096 12.8 0 25.6 2.048 38.4 4.096l-2.048 2.048c12.8 36.352 21.504 70.656 25.6 104.448-45.056 6.144-85.504 4.096-117.248 0 4.096-34.304 12.8-68.096 25.6-104.448l-4.608-2.048z m-138.752 206.848c-2.048-10.752-4.096-21.504-4.096-34.304 0-19.456 4.096-38.4 10.752-57.344 19.456 10.752 40.448 16.896 59.904 23.552-2.048 27.648-2.048 55.296 2.048 87.552-43.008-8.704-68.608-19.456-68.608-19.456z m21.504 51.2c19.456 6.144 38.4 12.8 55.296 16.896 4.096 16.896 8.704 34.304 14.848 53.248-29.696-14.848-55.296-39.936-70.144-70.144z m51.2-162.304c-25.6-6.144-42.496-14.848-47.104-16.896 16.896-27.648 40.448-49.152 68.096-64-8.192 21.504-16.896 49.152-20.992 80.896z m136.192 249.856c-10.752 2.048-23.552 4.096-34.304 4.096-10.752 0-21.504-2.048-31.744-2.048 0-2.048-10.752-25.6-19.456-64 38.4 4.096 72.704 4.096 104.448 0-8.192 34.304-16.896 55.296-18.944 61.952z m25.6-111.104c-45.056 6.656-85.504 4.096-119.296 0-2.048-25.6-4.096-53.248-2.048-82.944 47.104 8.704 89.6 6.144 125.952 0 0 29.696 0 57.344-4.608 82.944z m89.6-153.6c-14.848 6.656-29.696 10.752-45.056 14.848-6.656-31.744-12.8-57.344-19.456-76.8 26.112 15.36 49.664 36.352 64.512 61.952z m-64 245.248c6.144-16.896 10.752-34.304 14.848-51.2 21.504-4.096 38.4-10.752 53.248-16.896-14.336 30.208-37.888 53.248-68.096 68.096z m87.552-119.296c-21.504 8.704-42.496 14.848-64 19.456 4.096-31.744 4.096-59.904 2.048-87.552 31.744-10.752 53.248-21.504 57.344-23.552 6.144 16.896 10.752 36.352 10.752 57.344-2.048 12.8-4.096 23.552-6.144 34.304z" fill="#FF6A00" p-id="4436"></path></svg>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          color: #333;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .container {
          flex: 1;
          width: 95%;
          max-width: 1200px;
          margin: 20px auto;
          background-color: #fff;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
          overflow: hidden;
        }
        h1 {
          background-color: #3498db;
          color: #fff;
          padding: 20px;
          margin: 0;
        }
        .table-container {
          width: 100%;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #2ecc71;
        }
        .progress-bar {
          width: 100%;
          min-width: 100px;
          background-color: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress {
          height: 20px;
          background-color: #3498db;
        }
        .footer {
          text-align: center;
          padding: 10px;
          background-color: #3498db;
          color: #fff;
          margin-top: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${SITENAME}</h1>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>状态</th>
                <th>域名</th>
                <th>域名注册商</th>
                <th>注册时间</th>
                <th>过期时间</th>
                <th>剩余天数</th>
                <th>使用进度</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="footer">
        Powered by yutian81 | <a href="https://github.com/yutian81/domain-check">作者的 GITHUB</a>
      </div>
    </body>
    </html>
  `;
}
