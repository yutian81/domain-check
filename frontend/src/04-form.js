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