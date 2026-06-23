// 00-config.js — 常量和全局变量

const DOMAINS_API = '/api/domains';
const CONFIG_API = '/api/config';
const ITEMS_PER_PAGE = 12; // 每页12个域名信息卡
let allDomains = []; // 存储所有域名数据
let currentFilteredDomains = []; // 存储当前过滤和搜索后的数据
let currentPage = 1; // 默认显示第一页
let currentGroup = '全部'; // 默认激活的分组
let currentSearchTerm = ''; // 搜索框默认为空
let currentStatusFilter = ''; // 概览信息卡默认为空
let globalConfig = { daysThreshold: 30 }; // 默认30天内为将到期
let lastOperatedDomain = null; // 存储最近操作的域名，用于临时置顶