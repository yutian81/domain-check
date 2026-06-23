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

    summaryEl.innerHTML = `
        <div class="summary-card ${currentStatusFilter === '全部' ? 'active' : ''}" style="--color: #186db3;" data-filter="全部">
            <h3><i class="fa fa-list-ol"></i> 全部</h3>
            <p>${total}</p>
        </div>
        <div class="summary-card ${currentStatusFilter === '正常' ? 'active' : ''}" style="--color: #1dab58;" data-filter="正常">
            <h3><i class="fa fa-check"></i> 正常</h3>
            <p>${usableCount}</p>
        </div>
        <div class="summary-card ${currentStatusFilter === '将到期' ? 'active' : ''}" style="--color: #f39c12;" data-filter="将到期">
            <h3><i class="fa fa-exclamation-triangle"></i> 将到期</h3>
            <p>${expiringCount}</p>
        </div>
        <div class="summary-card ${currentStatusFilter === '已到期' ? 'active' : ''}" style="--color: #e74c3c;" data-filter="已到期">
            <h3><i class="fa fa-times"></i> 已到期</h3>
            <p>${expiredCount}</p>
        </div>
    `;

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
        html += `<button class="tab-btn ${currentGroup === g ? 'active' : ''}" data-group="${g}">${g}</button>`;
    });

    customGroups.forEach(g => {
        if (!existingGroups.includes(g)) {
             html += `<button class="tab-btn ${currentGroup === g ? 'active' : ''}" data-group="${g}">${g}</button>`;
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
    const checkboxHTML = IS_ADMIN ? `<input type="checkbox" class="card-checkbox" data-domain="${info.domain}">` : '';
    const actionsHTML = IS_ADMIN ? `
        <div class="card-actions">
            ${checkboxHTML}
            <div class="card-action-icons">
                <i class="fas fa-copy card-action-icon copy-icon" data-domain="${info.domain}" title="克隆此卡片"></i>
                <i class="fas fa-edit card-action-icon edit-icon" data-domain="${info.domain}" title="编辑"></i>
                <i class="fas fa-trash-alt card-action-icon delete-icon" data-domain="${info.domain}" title="删除"></i>
            </div>
        </div>` : '';

    return `
        <div class="domain-card" style="--status-color: ${statusColor}; --border-color: ${statusColor};">
            <div class="card-header">
                <span class="${domainClass}" data-domain="${IS_ADMIN ? info.domain : ''}">${displayDomain}</span>
                <span class="card-status">${statusText}</span>
            </div>
            <div class="card-info">
                <p><strong><i class="fa fa-registered"></i> 注册商: </strong> <a href="${info.systemURL}" target="_blank" title="点击直达">${info.system || 'N/A'}</a></p>
                <p><strong><i class="fa fa-user"></i> 注册账号: </strong> ${displayAccount}</p>
                <p><strong><i class="fa fa-calendar"></i> 注册时间: </strong> ${info.registrationDate || 'N/A'}</p>
                <p><strong><i class="fa fa-calendar"></i> 到期时间: </strong> ${info.expirationDate || 'N/A'}</p>
                <p><strong><i class="fa fa-folder"></i> 所属分组: </strong> ${info.groups || '无'}</p>
            </div>
            <div class="card-footer">
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%;"></div>
                    <span class="progress-percent-display">${progressPercentText}</span>
                </div>
                <div class="progress-text">已使用 ${elapsedText} | 剩余 ${remainingText}</div>
                ${actionsHTML}
            </div>
        </div>
    `;
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
                showAlert(`已复制域名: ${e.target.dataset.domain}`);
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
                if (await showConfirm(`确定要删除域名 ${domain} 吗？`)) {
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
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-arrow-left"></i></button>`;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (startPage > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) html += `<span class="page-dots">...</span>`;
    }
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`;
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i class="fas fa-arrow-right"></i></button>`;

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