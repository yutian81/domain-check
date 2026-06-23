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