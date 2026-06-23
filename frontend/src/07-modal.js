// 07-modal.js — 精美模态提示框（替代 browser alert/confirm）

// 全局唯一的提示框容器
let modalToast = null;

function ensureContainer() {
    if (modalToast) return;
    modalToast = document.createElement('div');
    modalToast.id = 'customToastContainer';
    modalToast.innerHTML = `
    <div id="toastOverlay" class="toast-overlay" style="display:none;">
        <div class="toast-card">
            <div class="toast-icon" id="toastIcon"><i class="fas fa-info-circle"></i></div>
            <div class="toast-message" id="toastMessage"></div>
            <div class="toast-actions" id="toastActions">
                <button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modalToast);
}

function getOverlay() {
    ensureContainer();
    return document.getElementById('toastOverlay');
}

function showModal(type, message) {
    return new Promise((resolve) => {
        const overlay = getOverlay();
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        const actions = document.getElementById('toastActions');
        const okBtn = document.getElementById('toastOkBtn');

        msg.textContent = message;
        actions.innerHTML = '';

        if (type === 'alert') {
            icon.innerHTML = '<i class="fas fa-info-circle" style="color:#186db3;"></i>';
            actions.innerHTML = '<button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>';
            const btn = document.getElementById('toastOkBtn');
            btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
        } else if (type === 'confirm') {
            icon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f39c12;"></i>';
            actions.innerHTML = `
                <button class="toast-btn toast-btn-cancel" id="toastCancelBtn">取消</button>
                <button class="toast-btn toast-btn-primary" id="toastConfirmBtn">确定</button>`;
            document.getElementById('toastCancelBtn').onclick = () => { overlay.style.display = 'none'; resolve(false); };
            document.getElementById('toastConfirmBtn').onclick = () => { overlay.style.display = 'none'; resolve(true); };
        } else if (type === 'error') {
            icon.innerHTML = '<i class="fas fa-times-circle" style="color:#e74c3c;"></i>';
            actions.innerHTML = '<button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>';
            const btn = document.getElementById('toastOkBtn');
            btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
        } else if (type === 'success') {
            icon.innerHTML = '<i class="fas fa-check-circle" style="color:#27ae60;"></i>';
            actions.innerHTML = '<button class="toast-btn toast-btn-primary" id="toastOkBtn">确定</button>';
            const btn = document.getElementById('toastOkBtn');
            btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
        }

        overlay.style.display = 'flex';

        // 点击遮罩层不关闭（必须点按钮）
        overlay.onclick = (e) => {
            if (e.target === overlay) return;
        };
    });
}

// 公开 API
function showAlert(message) { return showModal('alert', message); }
function showConfirm(message) { return showModal('confirm', message); }
function showError(message) { return showModal('error', message); }
function showSuccess(message) { return showModal('success', message); }