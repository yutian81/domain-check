import { HTML_CSS } from './style';
import { HTML_JS } from './script';

// 导出背景样式函数
export function generateBgStyle(bgimgURL) {
    if (!bgimgURL) return '';
    return `
    body { 
        background-color: #e9eceb;
        background-image: url('${bgimgURL}'); 
        background-size: cover; 
        background-attachment: fixed; 
        background-position: center;
    }`;
}

// 导出页脚生成函数
export function generateFooter(githubURL, blogURL, blogName) {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const yearText = currentYear === startYear 
        ? `Copyright © ${startYear}`
        : `Copyright © ${startYear}-${currentYear}`;
    
    return `
        <div class="footer">
            <p><span>${yearText} Yutian81</span><span>|</span>
                <a href="${githubURL}" target="_blank"><i class="fab fa-github"></i> Github</a><span>|</span>
                <a href="${blogURL}" target="_blank"><i class="fas fa-blog"></i> ${blogName}</a>
            </p>
        </div>
    `;
}

function generatePublicHeader(siteName) {
    return `
    <div class="header">
        <h1 id="siteTitle"><i class="fas fa-clock"></i> ${siteName}</h1>
        <div class="action-buttons">
            <button id="loginBtn" class="action-btn login-btn"><i class="fas fa-sign-in-alt"></i> 登录</button>
        </div>
    </div>`;
}

function generateAdminHeader(siteName) {
    return `
    <div class="header">
        <h1 id="siteTitle"><i class="fas fa-clock"></i> ${siteName}</h1>
        <div class="action-buttons">
            <button id="addDomainBtn" class="action-btn add-btn"><i class="fas fa-plus"></i> 添加</button>
            <button id="selectAllBtn" class="action-btn select-btn"><i class="fas fa-check-square"></i> 全选</button>
            <button id="batchDeleteBtn" class="action-btn del-btn"><i class="fas fa-trash"></i> 删除</button>
            <button id="exportDataBtn" class="action-btn export-btn"><i class="fas fa-download"></i> 导出</button>
            <button id="importDataBtn" class="action-btn import-btn"><i class="fas fa-upload"></i> 导入</button>
            <input type="file" id="importFileInput" accept=".json" style="display: none;">
            <button id="logoutBtn" class="action-btn logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</button>
        </div>
    </div>`;
}

function generateFormModal() {
    return `
    <div id="domainFormModal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>添加/编辑域名</h2>
            <form id="domainForm">
                <input type="hidden" id="editOriginalDomain">
                <label for="domain"><i class="fa fa-globe"></i> 域名</label>
                <input type="text" id="domain" placeholder="例如: example.com 或 sub.example.com" required>

                <div id="domainFillWarning" class="form-warning"></div>

                <label for="registrationDate"><i class="fa fa-calendar"></i> 注册时间 (YYYY-MM-DD)</label>
                <input type="date" id="registrationDate" required>

                <label for="renewalPeriod"><i class="fas fa-history"></i> 续费周期 (可选)</label>
                <div class="renewal-group">
                    <input type="number" id="renewalPeriod" min="1" max="100" placeholder="例如: 1, 填写后会自动计算到期时间" value="">
                    <select id="renewalUnit">
                        <option value="year">年</option>
                        <option value="month">月</option>
                    </select>
                </div>

                <label for="expirationDate"><i class="fa fa-calendar"></i> 到期时间 (YYYY-MM-DD)</label>
                <input type="date" id="expirationDate" required>

                <label for="system"><i class="fa fa-registered"></i> 注册商名称</label>
                <div class="autocomplete-field">
                    <input type="text" id="system" placeholder="例如: cloudflare" autocomplete="off">
                    <i class="fas fa-chevron-down autocomplete-arrow"></i>
                    <div class="autocomplete-dropdown" id="systemDropdown"></div>
                </div>

                <label for="systemURL"><i class="fa fa-link"></i> 注册商地址</label>
                <div class="autocomplete-field">
                    <input type="url" id="systemURL" placeholder="例如: https://dash.cloudflare.com" autocomplete="off">
                    <i class="fas fa-chevron-down autocomplete-arrow"></i>
                    <div class="autocomplete-dropdown" id="systemURLDropdown"></div>
                </div>

                <label for="registerAccount"><i class="fa fa-user"></i> 注册账号 (可选)</label>
                <input type="text" id="registerAccount" placeholder="例如: admin@example.com">

                <label for="groups"><i class="fa fa-tags"></i> 分组 (可选)</label>
                <div class="groups-field">
                    <div class="groups-tag-list" id="groupsTagList"></div>
                    <div class="groups-input-wrap">
                        <input type="text" id="groupsInput" placeholder="输入分组名称或选择已有分组" autocomplete="off">
                        <i class="fas fa-chevron-down groups-arrow"></i>
                        <div class="groups-dropdown" id="groupsDropdown"></div>
                    </div>
                    <input type="hidden" id="groups" value="">
                </div>

                <button type="submit"><i class="fa fa-save"></i> 保存</button>
            </form>
        </div>
    </div>`;
}

export function HTML_TEMPLATE(siteName, siteIcon, bgimgURL, githubURL, blogURL, blogName, isAdmin = false, initialDomains = null) {
    const bgimgStyle = generateBgStyle(bgimgURL);
    const footerHTML = generateFooter(githubURL, blogURL, blogName);
    const headerHTML = isAdmin ? generateAdminHeader(siteName) : generatePublicHeader(siteName);
    const formModal = isAdmin ? generateFormModal() : '';
    // 公开页面：将服务端脱敏后的域名数据嵌入 HTML（避免前端调用 API 暴露敏感数据）
    const initialDomainsJSON = initialDomains ? JSON.stringify(initialDomains) : 'null';
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteName}</title>
    <link id="faviconLink" rel="icon" href="${siteIcon}" type="image/png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    <style>
        ${bgimgStyle} 
        ${HTML_CSS}
    </style>
</head>
<body>
    <script>
        // 注入前端运行模式
        const IS_ADMIN = ${isAdmin};
        // 公开页面：服务端已脱敏的域名数据，前端直接使用，不调用 API
        const INITIAL_DOMAINS = ${initialDomainsJSON};
    </script>

    ${headerHTML}

    ${formModal}

    <!-- 续费弹窗（复用 toast 样式） -->
    <div id="renewOverlay" class="toast-overlay" style="display:none;">
        <div class="toast-card">
            <div class="toast-icon"><i class="fas fa-sync-alt" style="color:#186db3;"></i></div>
            <div class="renew-line">
                <span id="renewDomainName">test1cn.com</span>
                <span>&nbsp;续费时长</span>
            </div>
            <div class="renew-line">
                <input type="number" id="renewDuration" min="1" value="1">
                <select id="renewUnitSelect">
                    <option value="year">年</option>
                    <option value="month">月</option>
                </select>
            </div>
            <div class="toast-actions">
                <button class="toast-btn toast-btn-cancel" id="renewCancelBtn">取消</button>
                <button class="toast-btn toast-btn-primary" id="renewConfirmBtn">确定</button>
            </div>
        </div>
    </div>

    <div id="summary" class="summary-container"></div>

    <div class="controls-container">
        <div id="groupTabs" class="tabs-container">
            <button class="tab-btn active" data-group="全部">全部</button>
            <button class="tab-btn" data-group="一级域名">一级域名</button>
            <button class="tab-btn" data-group="二级域名">二级域名</button>
            <button class="tab-btn" data-group="未分组">未分组</button>
        </div>
        <div class="search-container">
            <i class="fas fa-search"></i>
            <input type="text" id="searchBox" placeholder="支持全文模糊搜索">
        </div>
    </div>

    <div id="domainList" class="domain-grid"></div>
    <div id="pagination" class="pagination"></div>
    <div id="footer">${footerHTML}</div>

    <script>${HTML_JS}</script>
</body>
</html>
    `;
}