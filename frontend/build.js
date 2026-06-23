// frontend/build.js — 将 src/ 模块构建为 script.js
// 用法: node frontend/build.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT = path.join(__dirname, 'script.js');

// 模块加载顺序（按依赖）
const MODULES = [
    '00-config.js',
    '01-utils.js',
    '07-modal.js',
    '02-api.js',
    '03-ui.js',
    '04-form.js',
    '05-filters.js',
    '06-init.js',
];

// 构建 JS 内容
let combined = '';
for (const file of MODULES) {
    const filePath = path.join(SRC_DIR, file);
    if (!fs.existsSync(filePath)) {
        console.error(`⚠️  未找到模块: ${filePath}`);
        continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    combined += content.trimEnd() + '\n\n';
}

// 转义模板字符串中的特殊字符
const escaped = combined
    .replace(/\\/g, '\\\\')   // 反斜杠优先转义
    .replace(/`/g, '\\`')     // 反引号
    .replace(/\$\{/g, '\\${'); // 模板插值

const output = `export const HTML_JS = \`\n${escaped}\`;\n`;
fs.writeFileSync(OUTPUT, output, 'utf-8');
console.log(`✅ 前端构建完成: ${OUTPUT} (${combined.split('\n').length} 行)`);