import { HTML_CSS } from './style';
import { HTML_JS } from './script';

export const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>域名到期监控</title>
    <link id="faviconLink" rel="icon" href="https://pan.811520.xyz/icon/domain-check.png" type="image/png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    <style>${HTML_CSS}</style>
</head>
<body>
    <div class="header">
        <h1 id="siteTitle"><i class="fas fa-clock"></i></h1>
        <div class="action-buttons">
            <button id="addDomainBtn" class="action-btn add-btn"><i class="fas fa-plus"></i> 添加域名</button>
            <button id="exportDataBtn" class="action-btn export-btn"><i class="fas fa-file-export"></i> 导出数据</button>
            <button id="importDataBtn" class="action-btn import-btn"><i class="fas fa-file-import"></i> 导入数据</button>
            <input type="file" id="importFileInput" accept=".json" style="display: none;">
        </div>
    </div>

    <div id="domainFormModal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>添加/编辑域名</h2>
            <form id="domainForm">
                <input type="hidden" id="editOriginalDomain">
                <label for="domain"><i class="fa fa-globe"></i> 域名</label>

                <input type="text" id="domain" required>
                <div id="domainFillWarning" class="form-warning"></div>

                <label for="registrationDate"><i class="fa fa-calendar"></i> 注册时间 (YYYY-MM-DD)</label>
                <input type="date" id="registrationDate" required>

                <label for="expirationDate"><i class="fa fa-calendar"></i> 到期时间 (YYYY-MM-DD)</label>
                <input type="date" id="expirationDate" required>

                <label for="system"><i class="fa fa-registered"></i> 注册商名称</label>
                <input type="text" id="system" required>

                <label for="systemURL"><i class="fa fa-link"></i> 注册商地址</label>
                <input type="url" id="systemURL" required>

                <label for="registerAccount"><i class="fa fa-user"></i> 注册账号</label>
                <input type="text" id="registerAccount">

                <label for="groups"><i class="fa fa-tags"></i> 分组 (多个分组用英文逗号分隔)</label>
                <input type="text" id="groups" placeholder="例如: 主要, 个人, 待续费">

                <button type="submit"><i class="fa fa-save"></i> 保存</button>
            </form>
        </div>
    </div>

    <div id="summary" class="summary-container">
        </div>

    <div class="controls-container">
        <div id="groupTabs" class="tabs-container">
            <button class="tab-btn active" data-group="全部">全部</button>
            <button class="tab-btn" data-group="一级域名">一级域名</button>
            <button class="tab-btn" data-group="二级域名">二级域名</button>
            <button class="tab-btn" data-group="未分组">未分组</button>
            </div>
        <div class="search-container">
            <i class="fas fa-search"></i>
            <input type="text" id="searchBox" placeholder="搜索域名...">
        </div>
    </div>

    <div id="domainList" class="domain-grid"></div>
    <div id="pagination" class="pagination"></div>
    <div id="footer"></div>

    <script>${HTML_JS}</script>
</body>
</html>
`;
