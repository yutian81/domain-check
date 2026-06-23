export const HTML_JS = `
// 00-config.js — 常量和全局变量

const DOMAINS_API = '/api/domains';
const CONFIG_API = '/api/config';
const ITEMS_PER_PAGE = 12; // 每页12个域名信息卡
let allDomains = []; // 存储所有域名数据
let currentFilteredDomains = []; // 存储当前过滤和搜索后的数据
let currentPage = 1; // 默认显示第一页
let currentGroup = '全部'; // 默认激活的分组
let currentSearchTerm = ''; // 搜索框默认为空
let currentStatusFilter = ''; // 概览信息卡默认为空
let globalConfig = { daysThreshold: 30 }; // 默认30天内为将到期
let lastOperatedDomain = null; // 存储最近操作的域名，用于临时置顶

// 01-utils.js — 工具函数

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return [year, month, day].join('-');
}

// 简单的域名格式验证
function isValidDomainFormat(domain) {
    const domainRegex = /^(?!-)(?!.*--)([a-zA-Z0-9-]{1,63}\\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain.toLowerCase());
}

// 判断是一级域名还是二级域名
function getDomainLevel(domain) {
    const parts = domain.split('.');
    if (parts.length <= 2) return '一级域名';
    return '二级域名';
}
function isPrimaryDomain(domain) {
    return getDomainLevel(domain) === '一级域名';
}

// 公开模式：用 ***** 隐藏域名前缀，只保留 TLD
function maskDomain(domain) {
    const parts = domain.split('.');
    if (parts.length < 2) return domain;
    // parts = ['sub', 'example', 'com'] → masked = ['*****', '*****'], tld = 'com'
    // parts = ['example', 'com'] → masked = ['*****'], tld = 'com'
    // parts = ['example', 'com', 'ua'] → masked = ['*****', '*****'], tld = 'ua'
    const tld = parts.pop();
    const masked = parts.map(() => '*****');
    return [...masked, tld].join('.');
}

// 公开模式：隐藏注册账号
function maskAccount(account) {
    if (!account) return '';
    return '***********';
}

// 自动计算域名到期日期
function calculateExpirationDate() {
    const registrationDateEl = document.getElementById('registrationDate');
    const renewalPeriodEl = document.getElementById('renewalPeriod');
    const renewalUnitEl = document.getElementById('renewalUnit');
    const expirationDateEl = document.getElementById('expirationDate');
    const regDateStr = registrationDateEl.value;
    const period = parseInt(renewalPeriodEl.value);
    const unit = renewalUnitEl.value;

    // 只有注册日期、续费周期数值和单位都有效时才计算
    if (regDateStr && period > 0 && unit) {
        const regDate = new Date(regDateStr);
        let calculatedExpirationDate = new Date(regDateStr);

        if (unit === 'year') {
            calculatedExpirationDate.setFullYear(regDate.getFullYear() + period);
        } else if (unit === 'month') {
            calculatedExpirationDate.setMonth(regDate.getMonth() + period);
        }
        // 格式化日期为 YYYY-MM-DD
        expirationDateEl.value = formatDate(calculatedExpirationDate);
    }
}

// 获取域名状态信息
function getDomainStatus(expirationDateStr) {
    if (!expirationDateStr) {
        return { statusText: '信息缺失', statusColor: '#95a5a6', daysRemaining: 'N/A' };
    }
    
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const expirationTime = Date.parse(expirationDateStr);
    if (isNaN(expirationTime)) {
        return { statusText: '日期格式错误', statusColor: '#95a5a6', daysRemaining: 'N/A' };
    }
    
    const timeDiff = expirationTime - todayUTC;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    let statusText = '正常';
    let statusColor = '#2ecc71';

    if (daysRemaining <= 0) {
        statusText = '已到期';
        statusColor = '#e74c3c';
    } else if (daysRemaining <= globalConfig.daysThreshold) {
        statusText = '将到期';
        statusColor = '#f39c12';
    }

    return { statusText, statusColor, daysRemaining };
}

// 07-modal.js — 精美模态提示框（替代 browser alert/confirm）

// 全局唯一的提示框容器
let modalToast = null;

function ensureContainer() {
    if (modalToast) return;
    modalToast = document.createElement('div');
    modalToast.id = 'customToastContainer';
    modalToast.innerHTML = \`
    <div id="toastOverlay" class="toast-overlay" style="display:none;">
        <div class="toast-card">
            <div class="toast-icon" id="toastIcon"><i class="fas fa-info-circle"></i></div>
            <div class="toast-message" id="toastMessage"></div>
            <div class="toast-actions" id="toastActions">
                <button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>
            </div>
        </div>
    </div>\`;
    document.body.appendChild(modalToast);
}

function getOverlay() {
    ensureContainer();
    return document.getElementById('toastOverlay');
}

function showModal(type, message) {
    return new Promise((resolve) => {
        const overlay = getOverlay();
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        const actions = document.getElementById('toastActions');
        const okBtn = document.getElementById('toastOkBtn');

        msg.textContent = message;
        actions.innerHTML = '';

        if (type === 'alert') {
            icon.innerHTML = '<i class="fas fa-info-circle" style="color:#186db3;"></i>';
            actions.innerHTML = '<button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>';
            const btn = document.getElementById('toastOkBtn');
            btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
        } else if (type === 'confirm') {
            icon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f39c12;"></i>';
            actions.innerHTML = \`
                <button class="toast-btn toast-btn-cancel" id="toastCancelBtn">取消</button>
                <button class="toast-btn toast-btn-primary" id="toastConfirmBtn">确定</button>\`;
            document.getElementById('toastCancelBtn').onclick = () => { overlay.style.display = 'none'; resolve(false); };
            document.getElementById('toastConfirmBtn').onclick = () => { overlay.style.display = 'none'; resolve(true); };
        } else if (type === 'error') {
            icon.innerHTML = '<i class="fas fa-times-circle" style="color:#e74c3c;"></i>';
            actions.innerHTML = '<button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>';
            const btn = document.getElementById('toastOkBtn');
            btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
        } else if (type === 'success') {
            icon.innerHTML = '<i class="fas fa-check-circle" style="color:#27ae60;"></i>';
            actions.innerHTML = '<button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>';
            const btn = document.getElementById('toastOkBtn');
            btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
        }

        overlay.style.display = 'flex';

        // 点击遮罩层不关闭（必须点按钮）
        overlay.onclick = (e) => {
            if (e.target === overlay) return;
        };
    });
}

// 公开 API
function showAlert(message) { return showModal('alert', message); }
function showConfirm(message) { return showModal('confirm', message); }
function showError(message) { return showModal('error', message); }
function showSuccess(message) { return showModal('success', message); }

// 02-api.js — 数据操作函数

// 异步获取全局配置
async function fetchConfig() {
    try {
        const response = await fetch(CONFIG_API);
        if (response.ok) {
            const config = await response.json();
            globalConfig = {
                ...globalConfig,
                ...config,
                daysThreshold: config.days || globalConfig.daysThreshold
            };
        }
    } catch (error) {
        console.error('获取配置信息失败:', error);
    }
}

// 导出数据: GET /api/domains
async function exportData() {
    try {
        const response = await fetch(DOMAINS_API);
        if (!response.ok) throw new Error('获取数据失败');

        const data = await response.json();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = \`domain_list_backup_\${date}.json\`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess('域名数据已成功导出为 JSON 文件！');
    } catch (error) {
        console.error('导出数据失败:', error);
        showError('导出数据失败: ' + error.message);
    }
}

// 导入数据: PUT /api/domains
function importData() {
    const fileInput = document.getElementById('importFileInput');
    if (!fileInput) return;
    fileInput.click();
    
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!(await showConfirm(\`确定要导入文件 \${file.name} 吗？\\n警告: 这将替换所有现有域名数据!\`))) {
            fileInput.value = '';
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const jsonContent = e.target.result;
                    const domainsToImport = JSON.parse(jsonContent);
                    if (!Array.isArray(domainsToImport)) { throw new Error('JSON 文件格式错误，须为域名数组'); }

                    const response = await fetch(DOMAINS_API, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(domainsToImport),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: '服务器错误' }));
                        throw new Error(errorData.error || response.statusText);
                    }
                    
                    const result = await response.json();
                    showSuccess(\`数据导入成功！共导入 \${result.count} 个域名\`);
                    await fetchDomains();
                } catch (jsonError) {
                    console.error('导入文件处理失败:', jsonError);
                    showError('导入文件处理失败: ' + jsonError.message);
                } finally {
                    fileInput.value = '';
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('读取文件失败:', error);
            showError('读取文件失败: ' + error.message);
            fileInput.value = '';
        }
    };
}

// 批量删除选中的域名
async function batchDeleteDomains(domains) {
    if (!domains || domains.length === 0) {
        showAlert('请先勾选要删除的域名');
        return;
    }
    if (!(await showConfirm(\`确定要删除选中的 \${domains.length} 个域名吗？\`))) return;

    try {
        const response = await fetch(DOMAINS_API, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(domains),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '删除失败' }));
            throw new Error(errorData.error || response.statusText);
        }

        const result = await response.json();
        showSuccess(\`成功删除 \${result.deletedCount || domains.length} 个域名\`);
        currentPage = 1;
        await fetchDomains();
    } catch (error) {
        console.error('批量删除失败:', error);
        showError('批量删除失败: ' + error.message);
    }
}
// 公开页面使用服务端注入的 INITIAL_DOMAINS（已脱敏），不调用 API
async function fetchDomains() {
    // 公开页面：使用服务端注入的脱敏数据
    if (typeof INITIAL_DOMAINS !== 'undefined' && INITIAL_DOMAINS !== null) {
        allDomains = INITIAL_DOMAINS.map(d => ({ ...d })).sort((a, b) => {
            if (lastOperatedDomain) { 
                if (a.domain === lastOperatedDomain) return -1;
                if (b.domain === lastOperatedDomain) return 1;
            }
            const statusA = getDomainStatus(a.expirationDate).statusText;
            const statusB = getDomainStatus(b.expirationDate).statusText;
            const getStatusPriority = (status) => {
                if (status === '已到期') return 1;
                if (status === '将到期') return 2;
                if (status === '正常') return 3;
                return 4;
            };
            const priorityA = getStatusPriority(statusA);
            const priorityB = getStatusPriority(statusB);
            if (priorityA !== priorityB) { return priorityA - priorityB; }
            if (priorityA === 3) {
                const isPrimaryA = isPrimaryDomain(a.domain);
                const isPrimaryB = isPrimaryDomain(b.domain);
                if (isPrimaryA && !isPrimaryB) return -1;
                if (!isPrimaryA && isPrimaryB) return 1;
            }
            const systemA = a.system || '';
            const systemB = b.system || '';
            return systemA.localeCompare(systemB);
        });

        lastOperatedDomain = null; 
        currentStatusFilter = '';
        currentGroup = '全部';
        renderGroupTabs();
        applyFiltersAndSearch();
        return;
    }

    // 管理页面：通过 API 获取原始数据
    try {
        const response = await fetch(DOMAINS_API);
        if (!response.ok) throw new Error('获取域名失败');
        const data = await response.json();

        allDomains = data.map(d => ({
            ...d,
        })).sort((a, b) => {
            if (lastOperatedDomain) { 
                if (a.domain === lastOperatedDomain) return -1;
                if (b.domain === lastOperatedDomain) return 1;
            }
            const statusA = getDomainStatus(a.expirationDate).statusText;
            const statusB = getDomainStatus(b.expirationDate).statusText;
            const getStatusPriority = (status) => {
                if (status === '已到期') return 1;
                if (status === '将到期') return 2;
                if (status === '正常') return 3;
                return 4;
            };
            const priorityA = getStatusPriority(statusA);
            const priorityB = getStatusPriority(statusB);
            if (priorityA !== priorityB) { return priorityA - priorityB; }
            if (priorityA === 3) {
                const isPrimaryA = isPrimaryDomain(a.domain);
                const isPrimaryB = isPrimaryDomain(b.domain);
                if (isPrimaryA && !isPrimaryB) return -1;
                if (!isPrimaryA && isPrimaryB) return 1;
            }
            const systemA = a.system || '';
            const systemB = b.system || '';
            return systemA.localeCompare(systemB);
        });

        lastOperatedDomain = null; 
        currentStatusFilter = '';
        currentGroup = '全部';
        renderGroupTabs();
        applyFiltersAndSearch();
        
    } catch (error) {
        console.error('获取域名失败:', error);
        if (IS_ADMIN) {
            showError('无法加载域名数据, 请检查API连接或登录状态');
        }
    }
}

// 提交 (添加/编辑) 域名
async function submitDomainForm(e) {
    e.preventDefault();
    const modal = document.getElementById('domainFormModal');
    const domainValue = document.getElementById('domain').value.trim();
    
    if (!isValidDomainFormat(domainValue)) {
        showAlert('请输入有效的域名格式，例如: example.com 或 sub.example.com');
        return;
    }
    
    const isPrimary = isPrimaryDomain(domainValue);
    let newDomainData = {
        originalDomain: document.getElementById('editOriginalDomain').value || domainValue,
        domain: domainValue,
        registrationDate: document.getElementById('registrationDate').value,
        expirationDate: document.getElementById('expirationDate').value,
        system: document.getElementById('system').value,
        systemURL: document.getElementById('systemURL').value,
        registerAccount: document.getElementById('registerAccount').value,
        groups: document.getElementById('groups').value,
        renewalPeriod: document.getElementById('renewalPeriod').value ? parseInt(document.getElementById('renewalPeriod').value) : null,
        renewalUnit: document.getElementById('renewalUnit').value || null,
    };
    
    if (isPrimary) {
        ['registrationDate', 'expirationDate', 'system', 'systemURL'].forEach(key => {
            if (!newDomainData[key]) { newDomainData[key] = ""; }
        });
    }

    try {
        const response = await fetch(DOMAINS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDomainData),
        });

        let responseData = {};
        try {
            responseData = await response.json();
        } catch (e) {
        }
        
        if (response.status === 409) { throw new Error('域名已存在，请勿重复添加'); }
        if (response.status === 422) { throw new Error(responseData.error || '信息不完整，请检查必填项'); }
        if (!response.ok) { throw new Error(responseData.error || response.statusText || '保存失败'); }
        
        modal.style.display = 'none';
        showSuccess(\`域名 \${newDomainData.domain} 保存成功！\`);
        lastOperatedDomain = newDomainData.domain;
        await fetchDomains();
    } catch (error) {
        console.error('保存域名失败:', error);
        showError('保存域名失败: ' + error.message);
    }
}

// 删除域名
async function deleteDomain(domain) {
    const domainsToDelete = [domain]; 

    try {
        const response = await fetch(DOMAINS_API, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(domainsToDelete), 
        });

        let responseData = {};
        try {
            responseData = await response.json();
        } catch (e) {
        }

        if (response.status === 404) {
             showAlert(\`域名 \${domain} 未找到或已被删除\`);
        } else if (!response.ok) {
            throw new Error(responseData.error || response.statusText || '删除失败');
        }
        
        const deletedCount = responseData.deletedCount || domainsToDelete.length;
        showSuccess(\`域名 \${domain} 已删除 (\${deletedCount} 个记录被移除)\`);

        currentPage = 1;
        await fetchDomains();
    } catch (error) {
        console.error('删除域名失败:', error);
        showError('删除域名失败: ' + error.message);
    }
}

// 03-ui.js — 渲染函数

// 渲染域名信息概览
function renderSummary(domainsList) {
    const summaryEl = document.getElementById('summary');
    if (!summaryEl) return;

    const total = domainsList.length;
    let normalCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    domainsList.forEach(domain => {
        const { statusText } = getDomainStatus(domain.expirationDate);
        if (statusText === '正常') {
            normalCount++;
        } else if (statusText === '将到期') {
            expiringCount++;
        } else if (statusText === '已到期') {
            expiredCount++;
        }
    }); 

    const usableCount = normalCount + expiringCount;

    summaryEl.innerHTML = \`
        <div class="summary-card \${currentStatusFilter === '全部' ? 'active' : ''}" style="--color: #186db3;" data-filter="全部">
            <h3><i class="fa fa-list-ol"></i> 全部</h3>
            <p>\${total}</p>
        </div>
        <div class="summary-card \${currentStatusFilter === '正常' ? 'active' : ''}" style="--color: #1dab58;" data-filter="正常">
            <h3><i class="fa fa-check"></i> 正常</h3>
            <p>\${usableCount}</p>
        </div>
        <div class="summary-card \${currentStatusFilter === '将到期' ? 'active' : ''}" style="--color: #f39c12;" data-filter="将到期">
            <h3><i class="fa fa-exclamation-triangle"></i> 将到期</h3>
            <p>\${expiringCount}</p>
        </div>
        <div class="summary-card \${currentStatusFilter === '已到期' ? 'active' : ''}" style="--color: #e74c3c;" data-filter="已到期">
            <h3><i class="fa fa-times"></i> 已到期</h3>
            <p>\${expiredCount}</p>
        </div>
    \`;

    summaryEl.querySelectorAll('.summary-card').forEach(card => {
        card.addEventListener('click', handleSummaryClick);
    });
}

// 渲染分组标签
function renderGroupTabs() {
    const tabsEl = document.getElementById('groupTabs');
    const existingGroups = ['全部', '一级域名', '二级域名', '未分组'];
    const customGroups = new Set();
    
    allDomains.forEach(d => {
        const groups = (d.groups || '').split(',').map(g => g.trim()).filter(g => g);
        groups.forEach(g => customGroups.add(g));
    });

    let html = '';
    existingGroups.forEach(g => {
        html += \`<button class="tab-btn \${currentGroup === g ? 'active' : ''}" data-group="\${g}">\${g}</button>\`;
    });

    customGroups.forEach(g => {
        if (!existingGroups.includes(g)) {
             html += \`<button class="tab-btn \${currentGroup === g ? 'active' : ''}" data-group="\${g}">\${g}</button>\`;
        }
    });

    tabsEl.innerHTML = html;
    tabsEl.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
}

// 生成单个域名卡片的 HTML
function createDomainCard(info) {
    const { statusText, statusColor, daysRemaining } = getDomainStatus(info.expirationDate);
    const registrationDate = new Date(info.registrationDate);
    const expirationDate = new Date(info.expirationDate);
    const today = new Date();
    
    let progressPercentage = 0;
    let totalDays = 0;
    let daysElapsed = 0;
    let remainingText = daysRemaining;
    let elapsedText = 'N/A';
    let progressPercentText = 'N/A';

    if (info.registrationDate && info.expirationDate) {
         totalDays = (expirationDate - registrationDate) / (1000 * 60 * 60 * 24);
         daysElapsed = (today - registrationDate) / (1000 * 60 * 60 * 24);
         progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
         progressPercentText = progressPercentage.toFixed(1) + '%';
         const elapsedDays = Math.floor(daysElapsed);
         elapsedText = elapsedDays > 0 ? elapsedDays + ' 天' : '0 天';
         remainingText = daysRemaining > 0 ? daysRemaining + ' 天' : '已到期';
         if (daysRemaining <= 0) { elapsedText = Math.floor(totalDays) + ' 天'; }
    } else {
        progressPercentage = 0;
        remainingText = 'N/A';
        elapsedText = 'N/A';
        progressPercentText = 'N/A';
    }

    // 根据模式构建卡片
    const displayDomain = IS_ADMIN ? info.domain : maskDomain(info.domain);
    const displayAccount = IS_ADMIN ? (info.registerAccount || 'N/A') : (info.registerAccount ? maskAccount(info.registerAccount) : 'N/A');
    const domainClass = IS_ADMIN ? 'card-domain' : 'card-domain-masked';
    const checkboxHTML = IS_ADMIN ? \`<input type="checkbox" class="card-checkbox" data-domain="\${info.domain}">\` : '';
    const actionsHTML = IS_ADMIN ? \`
        <div class="card-actions">
            \${checkboxHTML}
            <div class="card-action-icons">
                <i class="fas fa-copy card-action-icon copy-icon" data-domain="\${info.domain}" title="克隆此卡片"></i>
                <i class="fas fa-edit card-action-icon edit-icon" data-domain="\${info.domain}" title="编辑"></i>
                <i class="fas fa-trash-alt card-action-icon delete-icon" data-domain="\${info.domain}" title="删除"></i>
            </div>
        </div>\` : '';

    return \`
        <div class="domain-card" style="--status-color: \${statusColor}; --border-color: \${statusColor};">
            <div class="card-header">
                <span class="\${domainClass}" data-domain="\${IS_ADMIN ? info.domain : ''}">\${displayDomain}</span>
                <span class="card-status">\${statusText}</span>
            </div>
            <div class="card-info">
                <p><strong><i class="fa fa-registered"></i> 注册商: </strong> <a href="\${info.systemURL}" target="_blank" title="点击直达">\${info.system || 'N/A'}</a></p>
                <p><strong><i class="fa fa-user"></i> 注册账号: </strong> \${displayAccount}</p>
                <p><strong><i class="fa fa-calendar"></i> 注册时间: </strong> \${info.registrationDate || 'N/A'}</p>
                <p><strong><i class="fa fa-calendar"></i> 到期时间: </strong> \${info.expirationDate || 'N/A'}</p>
                <p><strong><i class="fa fa-folder"></i> 所属分组: </strong> \${info.groups || '无'}</p>
            </div>
            <div class="card-footer">
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: \${progressPercentage}%;"></div>
                    <span class="progress-percent-display">\${progressPercentText}</span>
                </div>
                <div class="progress-text">已使用 \${elapsedText} | 剩余 \${remainingText}</div>
                \${actionsHTML}
            </div>
        </div>
    \`;
}

// 渲染当前页的域名卡片
function renderDomainCards() {
    const listEl = document.getElementById('domainList');
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const domainsToRender = currentFilteredDomains.slice(start, end);

    if (domainsToRender.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; font-size: 1rem; color: #555;">没有符合条件的域名记录</p>';
    } else {
        listEl.innerHTML = domainsToRender.map(createDomainCard).join('');
    }

    // 仅管理模式下绑定卡片交互事件
    if (IS_ADMIN) {
        // 复制事件（点击域名复制）
        listEl.querySelectorAll('.card-domain').forEach(el => {
            el.addEventListener('click', (e) => {
                navigator.clipboard.writeText(e.target.dataset.domain);
                showAlert(\`已复制域名: \${e.target.dataset.domain}\`);
            });
        });
        
        // 编辑事件
        listEl.querySelectorAll('.edit-icon').forEach(el => {
            el.addEventListener('click', (e) => {
                const domain = e.target.dataset.domain;
                const domainInfo = allDomains.find(d => d.domain === domain);
                if (domainInfo) openDomainForm(domainInfo);
            });
        });
        
        // 复制新建事件（用该卡片信息预填充表单）
        listEl.querySelectorAll('.copy-icon').forEach(el => {
            el.addEventListener('click', (e) => {
                const domain = e.target.dataset.domain;
                const domainInfo = allDomains.find(d => d.domain === domain);
                if (domainInfo) openDomainFormWithCopy(domainInfo);
            });
        });
        
        // 删除事件
        listEl.querySelectorAll('.delete-icon').forEach(el => {
            el.addEventListener('click', async (e) => {
                const domain = e.target.dataset.domain;
                if (await showConfirm(\`确定要删除域名 \${domain} 吗？\`)) {
                    await deleteDomain(domain);
                }
            });
        });
    }
    
    renderPagination();
}

// 渲染分页控件
function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    const totalPages = Math.ceil(currentFilteredDomains.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    let html = '';
    html += \`<button class="page-btn" \${currentPage === 1 ? 'disabled' : ''} data-page="\${currentPage - 1}"><i class="fas fa-arrow-left"></i></button>\`;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (startPage > 1) {
        html += \`<button class="page-btn" data-page="1">1</button>\`;
        if (startPage > 2) html += \`<span class="page-dots">...</span>\`;
    }
    for (let i = startPage; i <= endPage; i++) {
        html += \`<button class="page-btn \${currentPage === i ? 'active' : ''}" data-page="\${i}">\${i}</button>\`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += \`<span class="page-dots">...</span>\`;
        html += \`<button class="page-btn" data-page="\${totalPages}">\${totalPages}</button>\`;
    }
    html += \`<button class="page-btn" \${currentPage === totalPages ? 'disabled' : ''} data-page="\${currentPage + 1}"><i class="fas fa-arrow-right"></i></button>\`;

    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('.page-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.closest('.page-btn');
            if (!target) return;
            const page = parseInt(target.dataset.page);
            if (page && page >= 1 && page <= totalPages) {
                currentPage = page;
                renderDomainCards();
            }
        });
    });
}

// 04-form.js — 表单逻辑

// 打开添加/编辑表单
function openDomainForm(domainInfo = null) {
    const modal = document.getElementById('domainFormModal');
    if (!modal) return;
    const form = document.getElementById('domainForm');
    const title = modal.querySelector('h2');
    const warningEl = document.getElementById('domainFillWarning');
    const renewalPeriodEl = document.getElementById('renewalPeriod');
    const renewalUnitEl = document.getElementById('renewalUnit');
    const expirationDateEl = document.getElementById('expirationDate');
    form.reset();

    if (warningEl) { warningEl.style.display = 'none'; }
    
    if (domainInfo) {
        title.textContent = '编辑域名';
        document.getElementById('editOriginalDomain').value = domainInfo.domain;
        document.getElementById('domain').value = domainInfo.domain;
        document.getElementById('registrationDate').value = domainInfo.registrationDate || '';
        document.getElementById('expirationDate').value = domainInfo.expirationDate || '';
        document.getElementById('system').value = domainInfo.system || '';
        document.getElementById('systemURL').value = domainInfo.systemURL || '';
        document.getElementById('registerAccount').value = domainInfo.registerAccount || '';
        document.getElementById('groups').value = domainInfo.groups || '';
        renewalPeriodEl.value = domainInfo.renewalPeriod || '';
        renewalUnitEl.value = domainInfo.renewalUnit || 'year';
        document.getElementById('domain').disabled = false;
    } else {
        title.textContent = '添加域名';
        document.getElementById('editOriginalDomain').value = '';
        document.getElementById('domain').disabled = false;
        renewalPeriodEl.value = '';
        renewalUnitEl.value = 'year';
        expirationDateEl.value = ''; 
    }
    
    updateFormRequiredStatus(document.getElementById('domain').value); 
    if (domainInfo && domainInfo.renewalPeriod && domainInfo.renewalUnit) { calculateExpirationDate(); }
    modal.style.display = 'block';
}

// 以某个域名卡片的信息预填充添加表单（用于克隆新建）
function openDomainFormWithCopy(domainInfo) {
    const modal = document.getElementById('domainFormModal');
    if (!modal) return;
    const form = document.getElementById('domainForm');
    const title = modal.querySelector('h2');
    const warningEl = document.getElementById('domainFillWarning');
    form.reset();

    if (warningEl) { warningEl.style.display = 'none'; }

    // 克隆信息，但域名留空（新建模式）
    title.textContent = '克隆域名';
    document.getElementById('editOriginalDomain').value = '';
    document.getElementById('domain').value = '';
    document.getElementById('domain').disabled = false;
    document.getElementById('registrationDate').value = domainInfo.registrationDate || '';
    document.getElementById('expirationDate').value = domainInfo.expirationDate || '';
    document.getElementById('system').value = domainInfo.system || '';
    document.getElementById('systemURL').value = domainInfo.systemURL || '';
    document.getElementById('registerAccount').value = domainInfo.registerAccount || '';
    document.getElementById('groups').value = domainInfo.groups || '';

    // 续费周期信息
    const renewalPeriodEl = document.getElementById('renewalPeriod');
    const renewalUnitEl = document.getElementById('renewalUnit');
    renewalPeriodEl.value = domainInfo.renewalPeriod || '';
    renewalUnitEl.value = domainInfo.renewalUnit || 'year';

    // 聚焦到域名输入框
    document.getElementById('domain').focus();
    updateFormRequiredStatus(''); // 空域名状态下更新提示
    modal.style.display = 'block';
}

// 动态切换表单必填项的提示
function updateFormRequiredStatus(domainValue) {
    const domainValueTrimmed = domainValue.trim();
    const isPrimary = isPrimaryDomain(domainValueTrimmed);
    const requiredFields = ['registrationDate', 'expirationDate', 'system', 'systemURL'];
    const warningEl = document.getElementById('domainFillWarning');
    const originalDomain = document.getElementById('editOriginalDomain').value;
    const domainExists = allDomains.some(d => d.domain === domainValueTrimmed && d.domain !== originalDomain);

    if (!domainValueTrimmed) {
        if (warningEl) { warningEl.style.display = 'none'; }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = true; el.placeholder = '二级域名必填'; }
        });
        return;
    }
    
    if (domainExists) {
        if (warningEl) {
            warningEl.textContent = '域名已存在，请勿重复添加';
            warningEl.style.color = '#e74c3c'; 
            warningEl.style.display = 'block';
        }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = false; el.placeholder = '已存在，无需填写'; }
        });
        return; 
    }

    if (warningEl) { warningEl.style.display = 'block'; }
    if (isPrimary) {
        if (warningEl) {
            warningEl.textContent = '检测为一级域名，可不填写日期和注册商，将使用 WHOIS API 自动获取';
            warningEl.style.color = '#f39c12';
        }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = false; el.placeholder = '一级域名可留空'; }
        });
    } else {
        if (warningEl) {
            warningEl.textContent = '检测为二级域名，日期和注册商为必填项, 无法使用 WHOIS API 自动获取';
            warningEl.style.color = '#e74c3c';
        }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = true; el.placeholder = '二级域名必填'; }
        });
    }
}

// 05-filters.js — 分组、搜索过滤、状态筛选

function applyFiltersAndSearch() {
    const commonFilters = (domain) => {
        // 分组过滤
        const domainGroups = (domain.groups || '').split(',').map(g => g.trim()).filter(g => g);
        const domainLevel = getDomainLevel(domain.domain);
        let groupMatch = true;

        if (currentGroup === '一级域名') {
            groupMatch = domainLevel === '一级域名';
        } else if (currentGroup === '二级域名') {
            groupMatch = domainLevel === '二级域名';
        } else if (currentGroup === '未分组') {
            groupMatch = domainGroups.length === 0;
        } else if (currentGroup !== '全部') {
            groupMatch = domainGroups.includes(currentGroup);
        }
        if (!groupMatch) return false;

        // 搜索过滤
        const searchTerm = currentSearchTerm.toLowerCase();
        if (searchTerm) {
            return (
                domain.domain.toLowerCase().includes(searchTerm) || // 域名
                (domain.system || '').toLowerCase().includes(searchTerm) || // 注册商
                (domain.registerAccount || '').toLowerCase().includes(searchTerm) || // 注册账号
                (domain.groups || '').toLowerCase().includes(searchTerm) // 分组
            );
        }
        return true;
    };
    
    // 计算 domainsForSummary
    const domainsForSummary = allDomains.filter(commonFilters);
    renderSummary(domainsForSummary);

    // 计算 currentFilteredDomains
    currentFilteredDomains = domainsForSummary.filter(domain => {
        const { statusText } = getDomainStatus(domain.expirationDate);
        if (currentStatusFilter === '' || currentStatusFilter === '全部') { return true; }
        if (currentStatusFilter === '正常') {
            return (statusText === '正常' || statusText === '将到期');
        } else {
            return (statusText === currentStatusFilter);
        }
    });

    renderDomainCards();
}

// 处理概览卡片点击事件
function handleSummaryClick(e) {
    const clickedCard = e.currentTarget;
    const filterValue = clickedCard.dataset.filter;

    // 移除所有卡片的 active 状态
    document.querySelectorAll('#summary .summary-card').forEach(card => {
        card.classList.remove('active');
    });

    clickedCard.classList.add('active'); // 为当前点击的卡片添加 active 状态
    currentStatusFilter = filterValue; // 更新状态筛选变量
    currentGroup = '全部'; // 将分组筛选重置为"全部"

    // 移除分组标签的 active 状态
    document.querySelectorAll('#groupTabs .tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    // 重新激活 "全部" 标签
    const allTab = document.querySelector('#groupTabs .tab-btn[data-group="全部"]');
    if (allTab) { allTab.classList.add('active'); }

    currentPage = 1; // 重置页码并应用新的筛选
    applyFiltersAndSearch();
}

// 处理分组标签点击事件
function handleTabClick(e) {
    const clickedTab = e.target;
    if (!clickedTab.classList.contains('tab-btn')) {
        return;
    }

    // 移除所有标签的 active 类
    const allTabs = document.querySelectorAll('#groupTabs .tab-btn');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // 为当前点击的标签添加 active 类
    clickedTab.classList.add('active');

    // 清除概览卡片的筛选状态
    currentStatusFilter = '';
    const allSummaryCards = document.querySelectorAll('#summary .summary-card');
    allSummaryCards.forEach(card => {
        card.classList.remove('active');
    });

    // 更新全局变量并应用筛选
    currentGroup = clickedTab.dataset.group;
    currentPage = 1; // 切换分组后回到第一页
    applyFiltersAndSearch();
}

// 06-init.js — 事件监听和初始化

window.addEventListener('load', async () => {
    await fetchConfig();
    await fetchDomains();

    if (IS_ADMIN) {
        // 管理模式：绑定管理按钮事件
        document.getElementById('addDomainBtn').addEventListener('click', () => openDomainForm());
        document.getElementById('exportDataBtn').addEventListener('click', exportData);
        document.getElementById('importDataBtn').addEventListener('click', importData);

        // 全选按钮：勾选/取消当前页面所有可见卡片
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#domainList .card-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
        });

        // 批量删除按钮
        document.getElementById('batchDeleteBtn').addEventListener('click', () => {
            const checked = document.querySelectorAll('#domainList .card-checkbox:checked');
            const domains = Array.from(checked).map(cb => cb.dataset.domain);
            batchDeleteDomains(domains);
        });

        // 退出登录按钮
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.location.href = '/logout';
        });

        // 模态框事件
        const modal = document.getElementById('domainFormModal');
        if (modal) {
            modal.querySelector('.close-btn').addEventListener('click', () => modal.style.display = 'none');
            window.addEventListener('click', (event) => {
                if (event.target === modal) { modal.style.display = 'none'; }
            });
            document.getElementById('domainForm').addEventListener('submit', submitDomainForm);
        }

        // 绑定注册日期和续费周期变动事件
        const registrationDateEl = document.getElementById('registrationDate');
        const renewalPeriodEl = document.getElementById('renewalPeriod');
        const renewalUnitEl = document.getElementById('renewalUnit');
        const domainEl = document.getElementById('domain');
        const calculationElements = [registrationDateEl, renewalPeriodEl, renewalUnitEl];
        calculationElements.forEach(el => {
            if (el) {
                el.addEventListener('change', calculateExpirationDate);
                el.addEventListener('input', calculateExpirationDate);
            }
        });

        // 监听域名输入，动态切换必填状态
        if (domainEl) {
            domainEl.addEventListener('input', (e) => {
                updateFormRequiredStatus(e.target.value);
            });
        }
    } else {
        // 公开模式：登录按钮跳转 /admin
        document.getElementById('loginBtn').addEventListener('click', () => {
            window.location.href = '/admin';
        });
    }

    // 公共事件：搜索框（两种模式都有）
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        let searchTimeout;
        searchBox.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchTerm = e.target.value.trim();
                currentPage = 1;
                applyFiltersAndSearch();
            }, 300);
        });
    }

    // 公共事件：分组标签（两种模式都有）
    const groupTabs = document.getElementById('groupTabs');
    if (groupTabs) {
        groupTabs.addEventListener('click', handleTabClick);
    }
});

`;
