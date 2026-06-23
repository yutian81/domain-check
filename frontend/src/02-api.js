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
        a.download = `domain_list_backup_${date}.json`;
        
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
        if (!(await showConfirm(`确定要导入文件 ${file.name} 吗？\n警告: 这将替换所有现有域名数据!`))) {
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
                    showSuccess(`数据导入成功！共导入 ${result.count} 个域名`);
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
    if (!(await showConfirm(`确定要删除选中的 ${domains.length} 个域名吗？`))) return;

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
        showSuccess(`成功删除 ${result.deletedCount || domains.length} 个域名`);
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
        showSuccess(`域名 ${newDomainData.domain} 保存成功！`);
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
             showAlert(`域名 ${domain} 未找到或已被删除`);
        } else if (!response.ok) {
            throw new Error(responseData.error || response.statusText || '删除失败');
        }
        
        const deletedCount = responseData.deletedCount || domainsToDelete.length;
        showSuccess(`域名 ${domain} 已删除 (${deletedCount} 个记录被移除)`);

        currentPage = 1;
        await fetchDomains();
    } catch (error) {
        console.error('删除域名失败:', error);
        showError('删除域名失败: ' + error.message);
    }
}