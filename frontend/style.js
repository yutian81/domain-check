export const HTML_CSS = `

* {
    font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, 
                 "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", 
                 sans-serif;
}

/* 顶部标题和操作按钮 */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 0 0 0;
    max-width: 1200px;
    margin: 0 auto;
    color: white;
}
.header h1 {
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    gap: 8px;
}
#siteTitle { margin: 0; }
.action-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}
.action-btn {
    padding: 10px 15px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    box-shadow: 2px 4px 4px rgba(0,0,0,0.2);
    transition: background-color 0.3s;
}
.export-btn, .import-btn { background-color: #1eaf5b; color: white; }
.export-btn:hover, .import-btn:hover { background-color: #1c914d; }
.add-btn { background-color: #186db3; color: white; }
.add-btn:hover { background-color: #1c5a8a; }
.login-btn { background-color: #186db3; color: white; }
.login-btn:hover { background-color: #1c5a8a; }
.logout-btn { background-color: #e74c3c; color: white; }
.logout-btn:hover { background-color: #c0392b; }
.select-btn { background-color: #8e44ad; color: white; }
.select-btn:hover { background-color: #7d3c9a; }
.del-btn { background-color: #e74c3c; color: white; }
.del-btn:hover { background-color: #c0392b; }

/* 概览卡片样式 */
.summary-container {
    display: flex;
    justify-content: space-around;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 0;
    gap: 15px;
}
.summary-card {
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-left: 5px solid var(--color);
    padding: 15px 20px;
    border-radius: 8px;
    text-align: center;
    flex-grow: 1;
    box-shadow: 2px 4px 4px rgba(0,0,0,0.2);
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
}
.summary-card.active {
    background-color: var(--color); 
    color: white; 
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: 2px 4px 4px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
}
.summary-card:hover { transform: translateY(-3px); box-shadow: 0 0 8px rgba(0,0,0,0.25); }
.summary-card h3 { margin: 0 0 5px 0; font-size: 1.1rem; color: var(--color); text-shadow: 0.5px 0.5px 4px rgba(255, 255, 255, 0.3); }
.summary-card.active h3 { color: white; text-shadow: 0.5px 0.5px 4px rgba(0, 0, 0, 0.6); }
.summary-card p { margin: 0; font-size: 2rem; font-weight: bold; color: var(--color); text-shadow: 1px 1px 4px rgba(255, 255, 255, 0.3); }
.summary-card.active p { color: white; text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6); }

/* 控制区分组标签和搜索 */
.controls-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-radius: 8px;
    max-width: 1160px;
    margin: 0 auto;
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 2px 4px 4px rgba(0,0,0,0.2);
    margin-bottom: 20px;
}
.tabs-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.tab-btn {
    padding: 8px 15px;
    background-color: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s, border-color 0.3s;
    border: none;
}
.tab-btn.active { background-color: #186db3; color: white; }
.search-container {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 5px 10px;
}
#searchBox {
    border: none;
    outline: none;
    padding: 5px;
    font-size: 1rem;
    background-color: transparent;
}

/* 域名卡片网格 */
.domain-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    max-width: 1200px;
    margin: 0 auto;
    gap: 20px;
    padding: 0 0 20px 0;
}
.domain-card {
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 2px 4px 4px rgba(0,0,0,0.2);
    transition: transform 0.3s, box-shadow 0.3s;
    display: flex;
    flex-direction: column;
    position: relative;
}
.domain-card:hover { transform: translateY(-3px); box-shadow: 0 0 8px rgba(0,0,0,0.25); }
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 2px solid rgba(24, 109, 179, 0.3);
    padding-bottom: 10px;
}
.card-domain {
    font-size: 1.1rem;
    font-weight: bold;
    color: #186db3;
    cursor: pointer;
    word-break: break-all;
    transition: color 0.3s ease;
}
.card-domain:hover { color: #1c5a8a; }
.card-domain-masked {
    font-size: 1.1rem;
    font-weight: bold;
    color: #555;
    word-break: break-all;
}
.card-status {
    padding: 4px 8px;
    margin-left: 8px;
    border-radius: 50px;
    color: white;
    font-size: 0.8rem;
    line-height: 0.95;
    background-color: var(--status-color);
}
.group-tag {
    display: inline-block;
    padding: 2px 7px;
    margin: 1px 2px;
    border-radius: 50px;
    color: #015193;
    font-size: 0.72rem;
    line-height: 1.4;
    background-color: rgba(24, 109, 179, 0.20);
    white-space: nowrap;
}
.group-tag.tag-ungrouped {
    background-color: rgba(150, 150, 150, 0.25);
    color: #494949;
}
.group-tags-container {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px;
}
.card-info p {
    margin: 5px 0;
    font-size: 0.8rem;
}
.card-info strong {
    color: #333;
    font-weight: normal;
}
.card-info a {
    color: inherit;
    text-decoration: none;
}
.card-info a:hover {
    text-decoration: underline;
}
.card-footer {
    margin-top: auto;
    padding-top: 8px;
}
.progress-bar-container {
    background-color: rgba(255, 255, 255, 0.35);
    border-radius: 5px;
    overflow: hidden;
    height: 15px;
    position: relative;
}
.progress-bar {
    height: 100%;
    background-color: var(--status-color);
    transition: width 0.5s ease;
}
.progress-percent-display {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    color: #333;
    line-height: 1;
    z-index: 2;
}
.progress-text {
    font-size: 0.8rem;
    text-align: center;
    margin-top: 5px;
    font-weight: bold;
    color: #555;
}

/* 卡片操作按钮区域 */
.card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
}
.card-action-icons {
    display: flex;
    gap: 8px;
}
.card-action-icon {
    cursor: pointer;
    font-size: 1rem;
    padding: 4px 6px;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
}
.card-action-icon:hover {
    background-color: rgba(0,0,0,0.1);
}
.card-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #186db3;
    flex-shrink: 0;
}
.edit-icon { color: #186db3; }
.edit-icon:hover { color: #1c5a8a; }
.renew-icon { color: #27ae60; }
.renew-icon:hover { color: #1e8449; }
.delete-icon { color: #e74c3c; }
.delete-icon:hover { color: #c0392b; }
.copy-icon { color: #8e44ad; }
.copy-icon:hover { color: #7d3c9a; }

/* 分页样式 */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 0;
}
.page-btn {
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 8px 12px;
    margin: 0 4px;
    cursor: pointer;
    border-radius: 8px;
}
.page-btn.active {
    background-color: #186db3;
    color: white;
}

/* Modal 样式 */
.modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.4);
    display: none;
}
.modal-content {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    margin: 5% auto;
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.3);
    width: 80%;
    max-width: 500px;
    border-radius: 8px;
    position: relative;
}
.close-btn {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}
.close-btn:hover,
.close-btn:focus {
    color: #000;
    text-decoration: none;
    cursor: pointer;
}
.modal-content label { display: block; margin-top: 5px; font-weight: bold; }
.modal-content input[type="text"],
.modal-content input[type="date"],
.modal-content input[type="url"],
.renewal-group input[type="number"],
.renewal-group select {
    width: 100%;
    padding: 10px;
    margin: 5px 0 15px 0;
    display: inline-block;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
}
.renewal-group { display: flex; gap: 10px; }
.renewal-group input[type="number"] { flex-grow: 1; }
.renewal-group select { width: 120px; flex-shrink: 0; cursor: pointer; }
.form-warning {
    font-size: 0.85rem;
    color: #f39c12;
    margin-bottom: 10px;
    min-height: 18px;
}

/* 分组标签选择器 */
.groups-field {
    margin: 5px 0 15px 0;
}
.groups-tag-list {
    display: none;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
    min-height: 0;
}
.groups-tag-list.has-tags {
    display: flex;
    margin-bottom: 6px;
}
.groups-tag-list .group-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px 2px 8px;
    margin: 0;
    font-size: 0.75rem;
    background-color: rgba(24, 109, 179, 0.20);
    border-radius: 50px;
    color: #015193;
    line-height: 1.5;
}
.group-tag-remove {
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    opacity: 0.8;
    transition: opacity 0.2s;
}
.group-tag-remove:hover {
    opacity: 1;
}
.groups-input-wrap {
    position: relative;
}
.groups-input-wrap input[type="text"] {
    width: 100%;
    padding: 8px 10px;
    margin: 0;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.9rem;
    box-sizing: border-box;
    outline: none;
}
.groups-input-wrap input[type="text"]:focus {
    border-color: #186db3;
}
.groups-arrow, .autocomplete-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #999;
    font-size: 0.7rem;
}

/* 注册商下拉选择器 */
.autocomplete-field {
    position: relative;
    margin: 5px 0 15px 0;
}
.autocomplete-field input[type="text"],
.autocomplete-field input[type="url"] {
    width: 100%;
    padding: 10px 30px 10px 10px !important;
    margin: 0 !important;
    box-sizing: border-box;
}
.autocomplete-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 160px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    z-index: 10;
}
.autocomplete-dropdown-item {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #333;
    line-height: 1.3;
    transition: background-color 0.15s;
}
.autocomplete-dropdown-item:hover {
    background-color: #e8f0fe;
    color: #186db3;
}

.groups-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 160px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    z-index: 10;
}
.groups-dropdown-item {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #333;
    line-height: 1.3;
    transition: background-color 0.15s;
}
.groups-dropdown-item:hover {
    background-color: #e8f0fe;
    color: #186db3;
}

.modal-content button[type="submit"] {
    background-color: #186db3;
    font-size: 16px;
    color: white;
    padding: 10px 20px;
    margin: 8px 0;
    border: none;
    cursor: pointer;
    width: 100%;
    border-radius: 8px;
}

.footer {
    background-color: none;
    color: #333333;
    font-size: 0.8rem;
    width: 100%;
    text-align: center;
    padding: 10px 0;
    margin-bottom: 20px;
}
.footer p {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin: 0;
}
.footer a {
    color: #333333;
    text-decoration: none;
    transition: color 0.3s ease;
    white-space: nowrap;
}
.footer a:hover {
    color: #186db3;
}

/* --- 自定义提示框（替换 alert/confirm） --- */
.toast-overlay {
    display: none;
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.35);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    justify-content: center;
    align-items: center;
}
.toast-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    padding: 30px 35px 25px;
    max-width: 400px;
    width: 85%;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    animation: toastFadeIn 0.25s ease;
}
@keyframes toastFadeIn {
    from { opacity: 0; transform: scale(0.92) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
.toast-icon {
    font-size: 3rem;
    margin-bottom: 12px;
    line-height: 1;
}
.toast-message {
    font-size: 1rem;
    color: #333;
    margin-bottom: 20px;
    line-height: 2;
    word-break: break-word;
    white-space: pre-line;
}
.toast-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}
.toast-btn {
    padding: 10px 28px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    transition: background-color 0.2s, transform 0.1s;
}
.toast-btn:active {
    transform: scale(0.97);
}
.toast-btn-primary {
    background-color: #186db3;
    color: white;
}
.toast-btn-primary:hover {
    background-color: #1c5a8a;
}
.toast-btn-cancel {
    background-color: #e0e0e0;
    color: #555;
}
.toast-btn-cancel:hover {
    background-color: #ccc;
}

/* 续费弹窗两行布局 */
.renew-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    font-size: 1rem;
    color: #333;
}
.renew-line:last-child {
    margin-bottom: 20px;
}
.renew-line #renewDomainName {
    font-weight: bold;
}
.renew-line input[type="number"] {
    width: 160px;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.95rem;
    text-align: center;
}
.renew-line select {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.95rem;
    cursor: pointer;
}

/* --- 移动端优化 --- */
@media (max-width: 768px) {
    .header, .summary-container, .controls-container, .domain-grid, .pagination { max-width: 95%; margin: 0 auto; }
    .header { flex-direction: column; }
    .header h1 { font-size: 1.8rem; margin-bottom: 10px; }
    .action-buttons { width: 100%; margin-top: 10px; justify-content: center; }
    .action-btn { flex-grow: 1; text-align: center; font-size: 0.85rem; padding: 8px 10px; }

    .summary-container { flex-direction: column; padding: 12px 0; gap: 10px; }
    .summary-card { padding: 10px 15px; }
    .summary-card p { font-size: 1.5rem; }

    .controls-container { flex-direction: column; padding: 12px 0; margin-bottom: 12px; }
    .tabs-container { width: auto; padding: 0 12px; margin: 0; justify-content: center; }
    .tab-btn { flex-grow: 1; font-size: 0.9rem; }
    .search-container { width: auto; align-self: stretch; margin: 10px 12px 0 12px; padding: 5px 12px; }

    .domain-grid { grid-template-columns: repeat(auto-fill, minmax(95%, 1fr));  gap: 12px; }
    .card-header { align-items: flex-start; gap: 5px; }
    .card-status { align-self: flex-start; }

    .modal-content { margin: 5% auto; width: 80%; padding: 15px; }
    .toast-card { width: 80%; }

    .footer p { font-size: 0.7rem; gap: 6px; }
}
`;