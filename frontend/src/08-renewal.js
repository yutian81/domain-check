// 08-renewal.js — 续费模态框逻辑

// 打开续费模态框
function openRenewModal(domainInfo) {
    const overlay = document.getElementById('renewOverlay');
    if (!overlay) return;

    // 设置域名显示
    document.getElementById('renewDomainName').textContent = domainInfo.domain;

    // 默认值：续费1年
    document.getElementById('renewDuration').value = 1;
    document.getElementById('renewUnitSelect').value = 'year';

    // 存储当前操作的域名数据
    overlay.dataset.domain = domainInfo.domain;

    overlay.style.display = 'flex';
}

// 关闭续费模态框
function closeRenewModal() {
    const overlay = document.getElementById('renewOverlay');
    if (overlay) overlay.style.display = 'none';
}

// 提交续费
async function submitRenew() {
    const overlay = document.getElementById('renewOverlay');
    const domain = overlay.dataset.domain;
    const duration = parseInt(document.getElementById('renewDuration').value);
    const unit = document.getElementById('renewUnitSelect').value;

    if (!domain) return;

    if (!duration || duration < 1) {
        showAlert('请输入有效的续费时长');
        return;
    }

    try {
        const result = await renewDomain(domain, duration, unit);
        closeRenewModal();

        const unitLabel = unit === 'year' ? '年' : '月';
        showSuccess(`${domain} 已续费${duration}${unitLabel}\n到期时间：${result.newExpirationDate}`);

        lastOperatedDomain = domain;
        await fetchDomains();
    } catch (error) {
        showError('续费失败: ' + error.message);
    }
}
