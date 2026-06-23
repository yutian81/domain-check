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