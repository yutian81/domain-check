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