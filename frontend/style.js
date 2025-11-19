export const HTML_CSS = `

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
    /*margin-bottom: 20px;*/
}
.action-btn {
    padding: 10px 15px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
}
.export-btn, .import-btn { background-color: #1eaf5b; color: white; }
.export-btn:hover, .import-btn:hover { background-color: #1c914d; }
.add-btn { background-color: #186db3; color: white; }
.add-btn:hover { background-color: #1c5a8a; }

/* 概览样式 */
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
    -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
    padding: 15px 20px;
    border-radius: 8px;
    text-align: center;
    flex-grow: 1;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border-left: 5px solid var(--color);
}
.summary-card.active {
    background-color: var(--color); 
    color: white; 
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
    transition: all 0.3s ease;
}
.summary-card.active h3, .summary-card.active p { color: white; }
.summary-card h3 { margin: 0 0 5px 0; font-size: 1.1rem; color: var(--color); }
.summary-card p { margin: 0; font-size: 2rem; font-weight: bold; color: var(--color); }

/* 控制区和搜索 */
.controls-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-radius: 8px;
    max-width: 1200px;
    margin: 0 auto;
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}
.tabs-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-left: 20px;
}
.tab-btn {
    padding: 8px 15px;
    background-color: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
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
    -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
    padding: 5px 10px;
    margin-right: 20px;
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* 横排3个或更多 */
    max-width: 1200px;
    margin: 0 auto;
    gap: 20px;
    padding: 0 0 20px 0;
}
.domain-card {
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    display: flex;
    flex-direction: column;
}
.domain-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.15);
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 2px solid var(--border-color); /* 状态颜色 */
    padding-bottom: 10px;
}
.card-domain {
    font-size: 1.2rem;
    font-weight: bold;
    color: #000000;
    cursor: pointer;
}
.card-status {
    padding: 5px 10px;
    border-radius: 8px;
    color: white;
    font-size: 0.85rem;
    background-color: var(--status-color); /* 状态颜色 */
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
    color: #186db3;
    text-decoration: none;
}
.card-info a:hover {
    text-decoration: underline;
}
.card-footer {
    margin-top: auto;
    padding-top: 15px;
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
    background-color: var(--status-color); /* 状态颜色 */
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
    -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
    padding: 8px 12px;
    margin: 0 4px;
    cursor: pointer;
    border-radius: 8px;
}
.page-btn.active {
    background-color: #186db3;
    color: white;
}
.edit-icon, .delete-icon {
    cursor: pointer;
    margin-left: 10px;
    color: #186db3;
    transition: color 0.2s;
}
.delete-icon {
    color: #e74c3c;
}
.edit-icon:hover { color: #1c5a8a; }
.delete-icon:hover { color: #c0392b; }

/* Modal 样式 (与 login 样式类似，但用于表单) */
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
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 500px;
    border-radius: 8px;
    position: relative;
}
.form-group { display: flex; }
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
.modal-content input[type="url"] {
    width: 100%;
    padding: 10px;
    margin: 5px 0 15px 0;
    display: inline-block;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
}
.form-warning {
    font-size: 0.85rem;
    color: #f39c12;
    margin-bottom: 10px;
    min-height: 18px;
}
.modal-content button[type="submit"] {
    background-color: #186db3;
    color: white;
    padding: 14px 20px;
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
    padding: 16px 0;
    margin-bottom: 10px;
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

/* --- 移动端优化 (Media Queries) --- */
@media (max-width: 768px) {
    /* 核心布局约束 */
    .header,
    .summary-container,
    .controls-container,
    .domain-grid,
    .pagination {
        max-width: 95%; /* 适应屏幕，两侧留出小边距 */
        margin: 0 auto;
    }

    /* 头部区域 */
    .header {
        flex-direction: column; /* 垂直堆叠 */
    }
    .header h1 {
        font-size: 1.5rem;
        margin-bottom: 10px;
    }
    .action-buttons { margin-top: 10px; }

    /* 概览卡片 */
    .summary-container {
        flex-direction: column; /* 垂直堆叠 */
        padding: 12px 0;
        gap: 10px;
    }
    .summary-card {
        padding: 10px 15px;
    }
    .summary-card p {
        font-size: 1.5rem;
    }

    /* 控制区 (Tabs & Search) */
    .controls-container {
        flex-direction: column; /* 垂直堆叠 */
        padding: 12px 0;
        margin-bottom: 12px;
    }
    .tabs-container {
        width: auto;
        padding: 0 12px;
        margin: 0;
        justify-content: center;
    }
    .tab-btn {
        flex-grow: 1; /* 按钮平均分配宽度 */
        font-size: 0.9rem;
    }
    .search-container {
        width: auto;
        align-self: stretch;
        margin: 10px 12px 0 12px;
        padding: 5px 12px;
    }

    /* 域名卡片网格 */
    .domain-grid {
        /* 在小屏幕上，让网格自动调整，至少显示一个大卡片 */
        grid-template-columns: repeat(auto-fill, minmax(95%, 1fr)); 
        gap: 12px;
    }
    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
    .card-domain {
        font-size: 1.1rem;
        word-break: break-all;
    }
    .card-status {
        align-self: flex-start;
    }

    /* 模态框 */
    .modal-content {
        margin: 5% auto;
        width: 90%;
        padding: 15px;
    }

    /* 页脚 */
    .footer p {
        font-size: 0.7rem;
        gap: 6px;
    }
}
`;
