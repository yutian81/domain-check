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

        // 续费弹窗事件
        const renewOverlay = document.getElementById('renewOverlay');
        if (renewOverlay) {
            document.getElementById('renewCancelBtn').addEventListener('click', closeRenewModal);
            document.getElementById('renewConfirmBtn').addEventListener('click', submitRenew);
            renewOverlay.addEventListener('click', (event) => {
                if (event.target === renewOverlay) closeRenewModal();
            });
        }

        // 分组标签输入事件
        const groupsInput = document.getElementById('groupsInput');
        if (groupsInput) {
            groupsInput.addEventListener('focus', () => {
                showGroupsDropdown(groupsInput.value);
            });
            groupsInput.addEventListener('input', (e) => {
                showGroupsDropdown(e.target.value);
            });
            groupsInput.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === ',') {
                    e.preventDefault();
                    const val = e.target.value.replace(/,/g, '').trim();
                    if (val) {
                        addGroupTag(val);
                        e.target.value = '';
                        hideGroupsDropdown();
                    }
                }
                if (e.key === 'Enter') {
                    const val = e.target.value.trim();
                    if (val) {
                        e.preventDefault();
                        addGroupTag(val);
                        e.target.value = '';
                        hideGroupsDropdown();
                    }
                }
                if (e.key === 'Backspace' && !e.target.value) {
                    const tags = getCurrentGroupTags();
                    if (tags.length > 0) removeGroupTag(tags[tags.length - 1]);
                }
            });
            groupsInput.addEventListener('blur', () => {
                setTimeout(hideGroupsDropdown, 200);
            });
            // 点击下拉选项
            document.getElementById('groupsDropdown').addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-dropdown-item');
                if (item) {
                    addGroupTag(item.dataset.group);
                    groupsInput.value = '';
                    hideGroupsDropdown();
                    groupsInput.focus();
                }
            });
        }

        // 注册商名称下拉事件
        const systemInput = document.getElementById('system');
        if (systemInput) {
            systemInput.addEventListener('focus', () => showAutocompleteDropdown('system', 'systemDropdown', getAllExistingSystems));
            systemInput.addEventListener('input', () => showAutocompleteDropdown('system', 'systemDropdown', getAllExistingSystems));
            systemInput.addEventListener('blur', () => setTimeout(() => hideAutocompleteDropdown('systemDropdown'), 200));
            document.getElementById('systemDropdown').addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-dropdown-item');
                if (item) {
                    systemInput.value = item.dataset.value;
                    hideAutocompleteDropdown('systemDropdown');
                    systemInput.focus();
                }
            });
        }

        // 注册商地址下拉事件
        const systemURLInput = document.getElementById('systemURL');
        if (systemURLInput) {
            systemURLInput.addEventListener('focus', () => showAutocompleteDropdown('systemURL', 'systemURLDropdown', getAllExistingSystemURLs));
            systemURLInput.addEventListener('input', () => showAutocompleteDropdown('systemURL', 'systemURLDropdown', getAllExistingSystemURLs));
            systemURLInput.addEventListener('blur', () => setTimeout(() => hideAutocompleteDropdown('systemURLDropdown'), 200));
            document.getElementById('systemURLDropdown').addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-dropdown-item');
                if (item) {
                    systemURLInput.value = item.dataset.value;
                    hideAutocompleteDropdown('systemURLDropdown');
                    systemURLInput.focus();
                }
            });
        }

        // 注册账号下拉事件
        const registerAccountInput = document.getElementById('registerAccount');
        if (registerAccountInput) {
            registerAccountInput.addEventListener('focus', () => showAutocompleteDropdown('registerAccount', 'registerAccountDropdown', getAllExistingRegisterAccounts));
            registerAccountInput.addEventListener('input', () => showAutocompleteDropdown('registerAccount', 'registerAccountDropdown', getAllExistingRegisterAccounts));
            registerAccountInput.addEventListener('blur', () => setTimeout(() => hideAutocompleteDropdown('registerAccountDropdown'), 200));
            document.getElementById('registerAccountDropdown').addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-dropdown-item');
                if (item) {
                    registerAccountInput.value = item.dataset.value;
                    hideAutocompleteDropdown('registerAccountDropdown');
                    registerAccountInput.focus();
                }
            });
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