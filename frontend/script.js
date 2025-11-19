export const HTML_JS = `

const DOMAINS_API = '/api/domains';
const CONFIG_API = '/api/config';
const ITEMS_PER_PAGE = 12; // 3 * 4
let allDomains = []; // 存储所有域名数据
let currentFilteredDomains = []; // 存储当前过滤和搜索后的数据
let currentPage = 1;
let currentGroup = '全部';
let currentSearchTerm = '';
let currentStatusFilter = '全部';
let globalConfig = { daysThreshold: 30 }; // 默认30天

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
    const domainRegex = /^(?!-)(?!.*--)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;
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

// 异步获取全局配置
async function fetchConfig() {
    try {
        const response = await fetch(CONFIG_API);
        if (response.ok) {
            const config = await response.json();
            
            // 更新全局配置
            globalConfig = {
                ...globalConfig,
                ...config,
                daysThreshold: config.days || globalConfig.daysThreshold // 使用后端定义的提醒天数
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
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = \`domain_list_backup_\${date}.json\`;
        
        // 模拟点击下载
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('域名数据已成功导出为 JSON 文件！');
    } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败: ' + error.message);
    }
}

// 导入数据: PUT /api/domains
function importData() {
    const fileInput = document.getElementById('importFileInput');
    if (!fileInput) return;
    fileInput.click(); // 触发文件选择框
    
    // 监听文件选择事件
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!confirm(\`确定要导入文件 \${file.name} 吗？\n警告: 这将替换所有现有域名数据!\`)) {
            fileInput.value = '';
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const jsonContent = e.target.result;
                    const domainsToImport = JSON.parse(jsonContent);
                    
                    if (!Array.isArray(domainsToImport)) {
                        throw new Error('JSON 文件格式错误，期望一个域名数组。');
                    }

                    // 调用 PUT API 替换所有数据
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
                    alert(\`数据导入成功！共导入 \${result.count} 个域名\`);
                    await fetchDomains(); // 重新加载数据
                } catch (jsonError) {
                    console.error('导入文件处理失败:', jsonError);
                    alert('导入文件处理失败: ' + jsonError.message);
                } finally {
                    fileInput.value = '';
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('读取文件失败:', error);
            alert('读取文件失败: ' + error.message);
            fileInput.value = '';
        }
    };
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
    let statusColor = '#2ecc71'; // 绿色

    if (daysRemaining <= 0) {
        statusText = '已到期';
        statusColor = '#e74c3c'; // 红色
    } else if (daysRemaining <= globalConfig.daysThreshold) {
        statusText = '将到期';
        statusColor = '#f39c12'; // 黄色
    }

    return { statusText, statusColor, daysRemaining };
}

// 渲染域名信息概览
function renderSummary() {
    const summaryEl = document.getElementById('summary');
    if (!summaryEl) return;

    const total = allDomains.length;
    let normalCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    allDomains.forEach(domain => {
        const { statusText } = getDomainStatus(domain.expirationDate);
        if (statusText === '正常') {
            normalCount++;
        } else if (statusText === '将到期') {
            expiringCount++;
        } else if (statusText === '已到期') {
            expiredCount++;
        }
    }); 

    const usableCount = normalCount + expiringCount; // 状态“正常”和“将到期”的域名都视为“可用”

    summaryEl.innerHTML = \`
        <div class="summary-card" style="--color: #186db3;" data-filter="全部">
            <h3><i class="fa fa-list-ol"></i> 全部</h3>
            <p>\${total}</p>
        </div>
        <div class="summary-card" style="--color: #1dab58;" data-filter="正常">
            <h3><i class="fa fa-check"></i> 正常</h3>
            <p>\${usableCount}</p>
        </div>
        <div class="summary-card" style="--color: #f39c12;" data-filter="将到期">
            <h3><i class="fa fa-exclamation-triangle"></i> 将到期</h3>
            <p>\${expiringCount}</p>
        </div>
        <div class="summary-card" style="--color: #e74c3c;" data-filter="已到期">
            <h3><i class="fa fa-times"></i> 已到期</h3>
            <p>\${expiredCount}</p>
        </div>
    \`;

    // 绑定点击事件
    summaryEl.querySelectorAll('.summary-card').forEach(card => {
        card.addEventListener('click', handleSummaryClick);
    });
}

// 处理概览卡片点击事件
function handleSummaryClick(e) {
    const clickedCard = e.currentTarget;
    const filterValue = clickedCard.dataset.filter;

    document.querySelectorAll('#summary .summary-card').forEach(card => {
        card.classList.remove('active');
    }); // 移除所有卡片的 active 状态

    clickedCard.classList.add('active'); // 为当前点击的卡片添加 active 状态
    currentStatusFilter = filterValue; // 1. 更新状态筛选变量
    currentGroup = '全部'; // 将分组筛选重置为“全部”

    document.querySelectorAll('#groupTabs .tab-btn').forEach(tab => {
        tab.classList.remove('active');
    }); // 移除分组标签的 active 状态

    const allTab = document.querySelector('#groupTabs .tab-btn[data-group="全部"]'); // 重新激活 "全部" 标签
    if (allTab) {
        allTab.classList.add('active');
    }

    currentPage = 1; // 重置页码并应用新的筛选
    applyFiltersAndSearch();
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
    // 渲染固定标签
    existingGroups.forEach(g => {
        html += \`<button class="tab-btn \${currentGroup === g ? 'active' : ''}" data-group="\${g}">\${g}</button>\`;
    });

    // 渲染自定义标签
    customGroups.forEach(g => {
        if (!existingGroups.includes(g)) {
             html += \`<button class="tab-btn \${currentGroup === g ? 'active' : ''}" data-group="\${g}">\${g}</button>\`;
        }
    });

    tabsEl.innerHTML = html;
    
    tabsEl.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentGroup = e.target.dataset.group;
            currentPage = 1;
            applyFiltersAndSearch();
        });
    });
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
    currentStatusFilter = '全部';
    const allSummaryCards = document.querySelectorAll('#summary .summary-card');
    allSummaryCards.forEach(card => {
        card.classList.remove('active');
    });

    // 更新全局变量并应用筛选
    currentGroup = clickedTab.dataset.group;
    currentPage = 1; // 切换分组后回到第一页
    applyFiltersAndSearch();
}

// 生成单个域名卡片的 HTML
function createDomainCard(info) {
    // 确保 info.expirationDate 存在，否则 getDomainStatus 会返回“信息缺失”
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
         progressPercentText = progressPercentage.toFixed(1) + '%'; // 计算百分比文本
         const elapsedDays = Math.floor(daysElapsed); // 已使用天数取整数
         elapsedText = elapsedDays > 0 ? elapsedDays + ' 天' : '0 天';
         remainingText = daysRemaining > 0 ? daysRemaining + ' 天' : '已到期';
         if (daysRemaining <= 0) { elapsedText = Math.floor(totalDays) + ' 天'; }
    } else {
        // 如果信息缺失，进度条显示 N/A
        progressPercentage = 0;
        remainingText = 'N/A';
        elapsedText = 'N/A';
        progressPercentText = 'N/A';
    }

    // 根据状态调整边框颜色
    let borderColor = statusColor;
    
    return \`
        <div class="domain-card" style="--status-color: \${statusColor}; --border-color: \${borderColor};">
            <div class="card-header">
                <span class="card-domain" data-domain="\${info.domain}">\${info.domain}</span>
                <span class="card-status">\${statusText}</span>
            </div>
            <div class="card-info">
                <p><strong><i class="fa fa-certificate"></i> 注册商: </strong> <a href="$\{info.systemURL || '#!'}" target="_blank">\${info.system || 'N/A'}</a></p>
                <p><strong><i class="fa fa-user"></i> 注册账号: </strong> \${info.registerAccount || 'N/A'}</p>
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
                <div style="text-align: right; margin-top: 10px;">
                    <i class="fas fa-edit edit-icon" data-domain="\${info.domain}" title="编辑"></i>
                    <i class="fas fa-trash-alt delete-icon" data-domain="\${info.domain}" title="删除"></i>
                </div>
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
    
    // 绑定复制事件
    listEl.querySelectorAll('.card-domain').forEach(el => {
        el.addEventListener('click', (e) => {
            navigator.clipboard.writeText(e.target.dataset.domain);
            alert(\`已复制域名: \${e.target.dataset.domain}\`);
        });
    });
    
    // 绑定编辑事件
    listEl.querySelectorAll('.edit-icon').forEach(el => {
        el.addEventListener('click', (e) => {
            const domain = e.target.dataset.domain;
            const domainInfo = allDomains.find(d => d.domain === domain);
            if (domainInfo) openDomainForm(domainInfo);
        });
    });
    
    // 绑定删除事件
    listEl.querySelectorAll('.delete-icon').forEach(el => {
        el.addEventListener('click', async (e) => {
            const domain = e.target.dataset.domain;
            if (confirm(\`确定要删除域名 \${domain} 吗？\`)) {
                await deleteDomain(domain);
            }
        });
    });
    
    renderPagination();
}

// 渲染分页控件
function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    const totalPages = Math.ceil(currentFilteredDomains.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '';
    
    // 上一页
    html += \`<button class="page-btn" \${currentPage === 1 ? 'disabled' : ''} data-page="\${currentPage - 1}"><i class="fas fa-arrow-left"></i></button>\`;

    // 页码按钮 (简单显示)
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


    // 下一页
    html += \`<button class="page-btn" \${currentPage === totalPages ? 'disabled' : ''} data-page="\${currentPage + 1}"><i class="fas fa-arrow-right"></i></button>\`;

    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('.page-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // 确保点击的是按钮本身或其直接的子元素
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

// 应用状态、分组、搜索过滤、状态筛选
function applyFiltersAndSearch() {
    currentFilteredDomains = allDomains.filter(domain => {

        // 1. 状态过滤
        const { statusText } = getDomainStatus(domain.expirationDate);
        let statusMatch = true;

        if (currentStatusFilter !== '全部') {
            if (currentStatusFilter === '正常') {
                statusMatch = (statusText === '正常' || statusText === '将到期');
            } else {
                statusMatch = (statusText === currentStatusFilter);
            }
        }
        if (!statusMatch) return false;

        // 2. 分组过滤
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

        // 2. 搜索过滤
        const searchTerm = currentSearchTerm.toLowerCase();
        if (searchTerm) {
            return (
                domain.domain.toLowerCase().includes(searchTerm) ||
                (domain.system || '').toLowerCase().includes(searchTerm) ||
                (domain.registerAccount || '').toLowerCase().includes(searchTerm)
            );
        }

        return true;
    });

    renderDomainCards();
}

// --- 数据操作函数 ---

// 从 API 获取所有域名数据
async function fetchDomains() {
    try {
        const response = await fetch(DOMAINS_API);
        if (!response.ok) throw new Error('获取域名失败');
        const data = await response.json();

        allDomains = data.map(d => ({
            ...d,
        })).sort((a, b) => {
            // 排序逻辑：先按级别，后按注册商首字母
            const levelA = getDomainLevel(a.domain);
            const levelB = getDomainLevel(b.domain);
            const isPrimaryA = levelA === '一级域名';
            const isPrimaryB = levelB === '一级域名';
            if (isPrimaryA && !isPrimaryB) { return -1; } // A (一级) 在前
            if (!isPrimaryA && isPrimaryB) { return 1; } // B (一级) 在前
            const systemA = a.system || '';  // 按注册商首字母升序
            const systemB = b.system || '';
            return systemA.localeCompare(systemB);
        });
            
        renderSummary();
        renderGroupTabs();
        applyFiltersAndSearch(); // 首次渲染
        currentStatusFilter = '全部';
        currentGroup = '全部';
        
    } catch (error) {
        console.error('获取域名失败:', error);
        alert('无法加载域名数据, 请检查API连接或登录状态。');
    }
}

// 提交 (添加/编辑) 域名
async function submitDomainForm(e) {
    e.preventDefault();
    const modal = document.getElementById('domainFormModal');
    const domainValue = document.getElementById('domain').value.trim();
    // 验证域名格式
    if (!isValidDomainFormat(domainValue)) {
        alert('请输入有效的域名格式，例如: example.com 或 sub.example.com');
        return;
    }
    
    const isPrimary = isPrimaryDomain(domainValue);
    let newDomainData = {
        // 使用一个唯一标识，确保编辑时提交的还是同一个域名
        originalDomain: document.getElementById('editOriginalDomain').value || domainValue,
        domain: domainValue,
        registrationDate: document.getElementById('registrationDate').value,
        expirationDate: document.getElementById('expirationDate').value,
        system: document.getElementById('system').value,
        systemURL: document.getElementById('systemURL').value,
        registerAccount: document.getElementById('registerAccount').value,
        groups: document.getElementById('groups').value,
    };
    
    // 如果是一级域名且字段为空，则删除这些键，让后端进行 WHOIS 查询和填充
    if (isPrimary) {
        ['registrationDate', 'expirationDate', 'system', 'systemURL'].forEach(key => {
            if (!newDomainData[key]) {
                newDomainData[key] = ""; // 确保后端接收到该键，值为空字符串
            }
        });
    }

    try {
        const response = await fetch(DOMAINS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDomainData),
        });

        // 尝试解析 JSON 响应，即使状态码不是 2xx
        let responseData = {};
        try {
            responseData = await response.json();
        } catch (e) {
            // 忽略 JSON 解析错误，如果响应体为空
        }
        
        if (response.status === 409) {
            alert('域名已存在，请勿重复添加。');
            return;
        }
        if (response.status === 422) {
            throw new Error(responseData.error || '信息不完整，请检查必填项');
        }
        if (!response.ok) {
            throw new Error(responseData.error || response.statusText || '保存失败');
        }
        
        modal.style.display = 'none';
        alert(\`域名 \${newDomainData.domain} 保存成功！\`);
        await fetchDomains(); // 重新加载数据
    } catch (error) {
        console.error('保存域名失败:', error);
        alert('保存域名失败: ' + error.message);
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
            // 忽略 JSON 解析错误
        }

        if (response.status === 404) {
             alert(\`域名 \${domain} 未找到或已被删除\`);
        } else if (!response.ok) {
            throw new Error(responseData.error || response.statusText || '删除失败');
        }
        
        // 使用后端返回的统计信息
        const deletedCount = responseData.deletedCount || domainsToDelete.length;
        alert(\`域名 \${domain} 已删除 (\${deletedCount} 个记录被移除)\`);
        
        await fetchDomains(); // 重新加载数据
    } catch (error) {
        console.error('删除域名失败:', error);
        alert('删除域名失败: ' + error.message);
    }
}

// 打开添加/编辑表单 (原始代码中的函数，已合并)
function openDomainForm(domainInfo = null) {
    const modal = document.getElementById('domainFormModal');
    const form = document.getElementById('domainForm');
    const title = modal.querySelector('h2');
    const warningEl = document.getElementById('domainFillWarning');
    form.reset();

    // 打开模态框时隐藏域名级别提示
    if (warningEl) {
        warningEl.style.display = 'none';
    }
    
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
        document.getElementById('domain').disabled = false; // 编辑时允许修改域名
    } else {
        title.textContent = '添加域名';
        document.getElementById('editOriginalDomain').value = '';
        document.getElementById('domain').disabled = false;
    }
    
    // 调用状态更新函数，根据当前域名值显示提示和必填项
    updateFormRequiredStatus(document.getElementById('domain').value); 
    modal.style.display = 'block';
}

// 动态切换表单必填项的提示
function updateFormRequiredStatus(domainValue) {
    // 检查返回值是否为 '一级域名' 来进行布尔判断
    const isPrimary = isPrimaryDomain(domainValue);
    const requiredFields = ['registrationDate', 'expirationDate', 'system', 'systemURL'];
    const warningEl = document.getElementById('domainFillWarning');

    // 判断是否显示域名级别提示
    if (!domainValue || domainValue.trim() === '') {
        if (warningEl) {
            warningEl.style.display = 'none';
        }
        // 域名为空时，保留原始的 required 属性，以确保二级域名验证正常
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.required = true; // 默认为必填，直到判断为一级域名
                el.placeholder = '必填';
            }
        });
        return;
    } else {
        // 域名不为空时，显示提示
        if (warningEl) {
            warningEl.style.display = 'block';
        }
    }
    
    if (isPrimary) {
        // 一级域名：提示 WHOIS 自动填充
        if (warningEl) {
            warningEl.textContent = '检测为一级域名，可不填写日期和注册商，将使用 WHOIS API 自动获取';
            warningEl.style.color = '#f39c12';
        }
        
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.required = false;
                el.placeholder = '一级域名可留空';
            }
        });
    } else {
        // 二级域名：所有字段必填
        if (warningEl) {
            warningEl.textContent = '检测为二级域名，日期和注册商为必填项, 无法使用 WHOIS API 自动获取';
            warningEl.style.color = '#e74c3c';
        }
        
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.required = true;
                el.placeholder = '二级域名必填';
            }
        });
    }
}

// --- 事件监听和初始化 ---
window.onload = async () => {
    await fetchConfig();  // 加载全局配置

    // 监听搜索框输入
    document.getElementById('searchBox').addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.trim();
        currentPage = 1;
        applyFiltersAndSearch();
    });

    // 监听标签页点击事件，并使用事件委托
    const groupTabsContainer = document.getElementById('groupTabs');
    if (groupTabsContainer) {
        groupTabsContainer.addEventListener('click', handleTabClick);
    }

    // 监听域名输入，动态切换必填状态和提示
    document.getElementById('domain').addEventListener('input', (e) => {
        updateFormRequiredStatus(e.target.value);
    });

    // 监听添加按钮
    document.getElementById('addDomainBtn').addEventListener('click', () => openDomainForm(null));
    // 监听导出按钮
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    // 监听导入按钮
    document.getElementById('importDataBtn').addEventListener('click', importData);
    
    // 监听表单提交
    document.getElementById('domainForm').addEventListener('submit', submitDomainForm);
    
    // 监听模态框关闭
    const modal = document.getElementById('domainFormModal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });
    }

    fetchDomains(); // 初始化数据加载
};

`;
