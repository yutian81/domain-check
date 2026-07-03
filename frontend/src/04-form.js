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
        initGroupsTags(domainInfo.groups || '');
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
        initGroupsTags('');
    }
    
    updateFormRequiredStatus(document.getElementById('domain').value);
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
    initGroupsTags(domainInfo.groups || '');

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

// ===== 分组标签管理 =====

// 获取所有已有分组（去重）
function getAllExistingGroups() {
    const groups = new Set();
    allDomains.forEach(d => {
        (d.groups || '').split(',').map(g => g.trim()).filter(g => g).forEach(g => groups.add(g));
    });
    return Array.from(groups).sort();
}

// 获取当前已选标签
function getCurrentGroupTags() {
    return Array.from(document.querySelectorAll('#groupsTagList .group-tag')).map(t => t.dataset.group);
}

// 更新隐藏 input
function updateGroupsHiddenInput() {
    const tags = getCurrentGroupTags();
    document.getElementById('groups').value = tags.join(', ');
}

// 添加一个分组标签
function addGroupTag(name) {
    name = name.trim();
    if (!name) return;
    const current = getCurrentGroupTags();
    if (current.includes(name)) return;

    const tagList = document.getElementById('groupsTagList');
    const tag = document.createElement('span');
    tag.className = 'group-tag';
    tag.dataset.group = name;
    tag.innerHTML = `${name}<span class="group-tag-remove" data-group="${name}">&times;</span>`;
    tagList.appendChild(tag);

    tag.querySelector('.group-tag-remove').addEventListener('click', () => removeGroupTag(name));
    tagList.classList.add('has-tags');
    updateGroupsHiddenInput();
}

// 删除一个分组标签
function removeGroupTag(name) {
    const tag = document.querySelector(`#groupsTagList .group-tag[data-group="${name}"]`);
    if (tag) tag.remove();
    const tagList = document.getElementById('groupsTagList');
    if (!tagList.querySelector('.group-tag')) tagList.classList.remove('has-tags');
    updateGroupsHiddenInput();
}

// 初始化分组标签
function initGroupsTags(groupsStr) {
    const tagList = document.getElementById('groupsTagList');
    tagList.innerHTML = '';
    tagList.classList.remove('has-tags');
    if (groupsStr) {
        groupsStr.split(',').map(g => g.trim()).filter(g => g).forEach(g => addGroupTag(g));
    }
    updateGroupsHiddenInput();
}

// 显示分组下拉列表
function showGroupsDropdown(filter) {
    const dropdown = document.getElementById('groupsDropdown');
    const allGroups = getAllExistingGroups();
    const currentTags = getCurrentGroupTags();
    const filtered = filter
        ? allGroups.filter(g => g.includes(filter) && !currentTags.includes(g))
        : allGroups.filter(g => !currentTags.includes(g));

    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.innerHTML = filtered.map(g =>
        `<div class="autocomplete-dropdown-item" data-group="${g}">${g}</div>`
    ).join('');
    dropdown.style.display = 'block';
}

// 隐藏分组下拉列表
function hideGroupsDropdown() {
    document.getElementById('groupsDropdown').style.display = 'none';
}

// ===== 注册商下拉 =====

// 获取所有已有注册商名称
function getAllExistingSystems() {
    const systems = new Set();
    allDomains.forEach(d => {
        if (d.system) systems.add(d.system);
    });
    return Array.from(systems).sort();
}

// 获取所有已有注册商地址
function getAllExistingSystemURLs() {
    const urls = new Set();
    allDomains.forEach(d => {
        if (d.systemURL) urls.add(d.systemURL);
    });
    return Array.from(urls).sort();
}

// 获取所有已有注册账号
function getAllExistingRegisterAccounts() {
    const accounts = new Set();
    allDomains.forEach(d => {
        if (d.registerAccount) accounts.add(d.registerAccount);
    });
    return Array.from(accounts).sort();
}

// 显示注册商下拉
function showAutocompleteDropdown(inputId, dropdownId, dataFn) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const allItems = dataFn();
    const filter = input.value.toLowerCase();
    const filtered = filter
        ? allItems.filter(item => item.toLowerCase().includes(filter))
        : allItems;

    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.innerHTML = filtered.map(item =>
        `<div class="autocomplete-dropdown-item" data-value="${item}">${item}</div>`
    ).join('');
    dropdown.style.display = 'block';
}

// 隐藏注册商下拉
function hideAutocompleteDropdown(dropdownId) {
    document.getElementById(dropdownId).style.display = 'none';
}