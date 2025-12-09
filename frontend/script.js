渲染 Summary 和 DomainCards
        
    } catch (error) {
        console.error('获取域名失败:', error);
        alert('无法加载域名数据, 请检查API连接或登录状态');
    }
}

// 提交 (添加/编辑) 域名
async function submitDomainForm(e) {
    e.preventDefault();
    const modal = document.getElementById('domainFormModal');
    const domainValue = document.getElementById('domain').value.trim();
    
    if (!isValidDomainFormat(domainValue)) { // 验证域名格式
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
        renewalPeriod: document.getElementById('renewalPeriod').value ? parseInt(document.getElementById('renewalPeriod').value) : null,
        renewalUnit: document.getElementById('renewalUnit').value || null,
    };
    
    // 如果是一级域名且字段为空，则删除这些键，让后端进行 WHOIS 查询和填充
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

        // 尝试解析 JSON 响应，即使状态码不是 2xx
        let responseData = {};
        try {
            responseData = await response.json();
        } catch (e) {
            // 忽略 JSON 解析错误，如果响应体为空
        }
        
        if (response.status === 409) { throw new Error('域名已存在，无需重复添加'); }
        if (response.status === 422) { throw new Error(responseData.error || '信息不完整，请检查必填项'); }
        if (!response.ok) { throw new Error(responseData.error || response.statusText || '保存失败'); }
        
        modal.style.display = 'none';
        alert(\`域名 \${newDomainData.domain} 保存成功！\`);
        lastOperatedDomain = newDomainData.domain; // 设置最近操作的域名，用于临时置顶
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

        currentPage = 1; // 删除后重置页码到第一页
        await fetchDomains(); // 重新加载数据
    } catch (error) {
        console.error('删除域名失败:', error);
        alert('删除域名失败: ' + error.message);
    }
}

// 打开添加/编辑表单
function openDomainForm(domainInfo = null) {
    const modal = document.getElementById('domainFormModal');
    const form = document.getElementById('domainForm');
    const title = modal.querySelector('h2');
    const warningEl = document.getElementById('domainFillWarning');
    const renewalPeriodEl = document.getElementById('renewalPeriod');
    const renewalUnitEl = document.getElementById('renewalUnit');
    const expirationDateEl = document.getElementById('expirationDate');
    form.reset();

    if (warningEl) { warningEl.style.display = 'none'; } // 打开模态框时隐藏域名级别提示
    
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
        renewalPeriodEl.value = domainInfo.renewalPeriod || ''; // 续费周期
        renewalUnitEl.value = domainInfo.renewalUnit || 'year'; // 周期单位
        document.getElementById('domain').disabled = false; // 编辑时允许修改域名
    } else {
        title.textContent = '添加域名';
        document.getElementById('editOriginalDomain').value = '';
        document.getElementById('domain').disabled = false;
        renewalPeriodEl.value = '';
        renewalUnitEl.value = 'year';
        expirationDateEl.value = ''; 
    }
    
    // 调用状态更新函数，根据当前域名值显示提示和必填项
    updateFormRequiredStatus(document.getElementById('domain').value); 
    // 如果是编辑模式且有续费周期信息，则触发一次计算
    if (domainInfo && domainInfo.renewalPeriod && domainInfo.renewalUnit) { calculateExpirationDate(); }
    modal.style.display = 'block';
}

// 动态切换表单必填项的提示
function updateFormRequiredStatus(domainValue) {
    const isPrimary = isPrimaryDomain(domainValue); // 当前输入是否为一级域名
    const requiredFields = ['registrationDate', 'expirationDate', 'system', 'systemURL']; // 二级域名必填表单字段
    const warningEl = document.getElementById('domainFillWarning'); // 获取动态警告或提示的元素
    const domainValueTrimmed = domainValue.trim(); // 获取当前输入的域名
    const originalDomain = document.getElementById('editOriginalDomain').value; // 获取编辑模式下的原域名
    const domainExists = allDomains.some(d => d.domain === domainValueTrimmed && d.domain !== originalDomain); // 检查当前域名是否存在

    // 处理域名为空的情况
    if (!domainValueTrimmed) {
        if (warningEl) { warningEl.style.display = 'none'; }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = true; el.placeholder = '二级域名必填'; }
        });
        return;
    }

    // 处理域名已存在的情况 (仅在新增模式下或域名被修改为已存在的域名时触发)
    if (domainExists) {
        if (warningEl) {
            warningEl.textContent = '操作失败：域名已存在，无需添加或修改';
            warningEl.style.color = '#e74c3c'; 
            warningEl.style.display = 'block';
        }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = false; el.placeholder = '域名已存在，无需填写'; }
        });
        return; 
    }

    // 处理域名不存在的情况 (一级/二级域名分别判断)
    if (warningEl) { warningEl.style.display = 'block'; }
    if (isPrimary) {
        // 一级域名：提示 WHOIS 自动填充
        if (warningEl) {
            warningEl.textContent = '检测为一级域名，可不填写日期和注册商，将使用 WHOIS API 自动获取';
            warningEl.style.color = '#f39c12';
        }
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = false; el.placeholder = '一级域名可留空'; }
        });
    } else {
        // 二级域名：所有字段必填
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

// --- 事件监听和初始化 ---
window.addEventListener('load', async () => {
    await fetchConfig(); // 获取配置
    await fetchDomains(); // 获取域名数据

    // 绑定按钮（添加、导出、导入）
    document.getElementById('addDomainBtn').addEventListener('click', () => openDomainForm());
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);

    // 绑定模态框表单关闭和提交事件
    const modal = document.getElementById('domainFormModal');
    modal.querySelector('.close-btn').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    document.getElementById('domainForm').addEventListener('submit', submitDomainForm);

    // 绑定搜索事件 (输入停止 300ms 后进行搜索)
    let searchTimeout;
    document.getElementById('searchBox').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = e.target.value.trim();
            currentPage = 1;
            applyFiltersAndSearch();
        }, 300);
    });

    // 绑定分组标签点击事件
    document.getElementById('groupTabs').addEventListener('click', handleTabClick);

    // 绑定注册日期和续费周期变动事件，触发到期日期计算
    const registrationDateEl = document.getElementById('registrationDate');
    const renewalPeriodEl = document.getElementById('renewalPeriod');
    const renewalUnitEl = document.getElementById('renewalUnit');
    const domainEl = document.getElementById('domain');
    const calculationElements = [registrationDateEl, renewalPeriodEl, renewalUnitEl];
    calculationElements.forEach(el => {
        el.addEventListener('change', calculateExpirationDate);
        el.addEventListener('input', calculateExpirationDate);
    });

    // 监听域名输入，动态切换必填状态和提示
    domainEl.addEventListener('input', (e) => {
        updateFormRequiredStatus(e.target.value);
    });
});

`;
