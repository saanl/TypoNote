import { Note, ThemeColors, TranslationMap, Snippet } from './types';

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const createNewNote = (initialContent = ''): Note => ({
  id: generateId(),
  title: 'Untitled Note',
  content: initialContent,
  updatedAt: Date.now(),
});

export const formatDate = (ms: number, lang: 'en'|'zh' = 'en') => {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(ms));
};

export const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const generateRandomTheme = (): ThemeColors => {
  const isDark = Math.random() > 0.5;
  
  return {
    name: 'Random ' + Math.floor(Math.random() * 1000),
    bgPrimary: getRandomColor(Math.random() * 0.2 + 0.8),
    bgSecondary: getRandomColor(Math.random() * 0.2 + 0.8),
    textPrimary: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#cccccc' : '#333333',
    accent: getRandomColor(1),
    border: getRandomColor(0.5),
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const extractDominantColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                resolve(`rgb(${r}, ${g}, ${b})`);
            } else {
                resolve('#000000');
            }
        };
        img.onerror = () => resolve('#000000');
    });
};

// --- SNIPPETS ---
export const DEFAULT_SNIPPETS: Snippet[] = [
    { id: 's_success', label: 'Success', icon: 'CheckCircle', content: '<span class="success">${}</span>' },
    { id: 's_info', label: 'Info', icon: 'Info', content: '<span class="info">${}</span>' },
    { id: 's_warning', label: 'Warning', icon: 'AlertTriangle', content: '<span class="warning">${}</span>' },
    { id: 's_error', label: 'Error', icon: 'AlertCircle', content: '<span class="error">${}</span>' },
    { id: 's_active', label: 'Active', icon: 'Zap', content: '<span class="active">${}</span>' },
];

// --- CONTENT TEMPLATES ---

export const DEFAULT_CUSTOM_CSS = `/* Default Utility Classes for HTML Rendering */

.success {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 2px 6px;
  border-radius: 4px;
}

.error {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 2px 6px;
  border-radius: 4px;
}

.warning {
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 2px 6px;
  border-radius: 4px;
}

.info {
  color: #0c5460;
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  padding: 2px 6px;
  border-radius: 4px;
}

.active {
  color: white;
  background-color: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
}

.inactive {
  color: #6c757d;
  background-color: #e2e3e5;
  padding: 2px 6px;
  border-radius: 4px;
  text-decoration: line-through;
}
`;

export const GUIDE_CONTENT = `# 👋 Welcome to TypoNote / 欢迎使用

TypoNote is a modern, feature-rich Markdown editor designed for efficiency and aesthetics.
TypoNote 是一个现代化的、功能丰富且设计精美的 Markdown 编辑器。

---

## ✨ Core Features / 核心功能

### 1. 📝 Versatile View Modes / 多样化视图
- **Edit Mode**: Focused writing experience.
- **Split Mode**: Real-time preview with **draggable divider**.
- **View Mode**: Clean reading interface with centered layout.
- **WYSIWYG Mode**: Live editing where markdown renders instantly, click to edit source.
- **编辑模式**：专注写作。
- **分栏模式**：实时预览，支持**拖拽调整宽度**。
- **阅读模式**：居中布局，沉浸式阅读。
- **所见即所得**：实时渲染，点击段落即可编辑源码。

### 2. 🤖 AI Integration / AI 智能集成
- **Multi-Model**: Support for **Gemini**, **DeepSeek**, **ChatGPT**, and **Qwen**.
- **Assist**: Ask AI to write content, summarize text, or translate.
- **Agent Mode**: Tell the AI to rewrite or format your document, and it **updates automatically**.
- **多模型支持**：支持主流大模型接入。
- **智能Agent**：指示 AI 重写、润色或格式化文档，内容**自动更新**。

### 3. 🎨 Advanced Theming / 高级主题定制
- **Presets**: Built-in themes like Morandi, Draco, Solarized.
- **Granular Customization**: 
  - Set specific backgrounds for **Sidebars**, **Toolbar**, and **Content**.
  - Support **Images**, **Solid Colors**, and **Transparency/Glassmorphism**.
  - **Magic Palette**: Auto-extract accent colors from your uploaded images.
- **精细化定制**：分区域设置背景（图片/颜色/透明度），支持从图片提取配色。

### 4. ⚡ Productivity Tools / 效率工具
- **Custom Shortcuts**: Create buttons with templates (e.g., \`\${}\` variables).
- **Icon Support**: Choose icons for your custom shortcuts.
- **File Management**: Multi-tab switching, auto-save, and PDF export.
- **自定义快捷键**：支持图标与模板变量。

### 5. 🏷️ HTML & CSS / HTML 与 CSS 支持
- **HTML Rendering**: Toggle in settings to render raw HTML tags.
- **Custom CSS**: Define your own classes like \`<span class="success">Success</span>\`.
- **Presets**: Includes \`.success\`, \`.error\`, \`.warning\`, \`.info\`, \`.active\`, \`.inactive\`.
- **HTML 渲染**：支持在 Markdown 中直接使用 HTML 标签。
- **自定义 CSS**：编写 CSS 样式，例如 \`<span class="success">成功</span>\`。

---

## 🚀 How to Use / 使用指南

**Format Text / 格式化**
> Use the top toolbar or Markdown syntax (e.g., \`**bold**\`, \`# Header\`).
> 使用顶部工具栏或 Markdown 语法。

**Manage Files / 文件管理**
> Click <kbd>📄</kbd> (bottom-left) to toggle the file list. Click <kbd>+</kbd> to create new notes.
> 点击左下角 <kbd>📄</kbd> 展开文件列表，点击 <kbd>+</kbd> 新建笔记。

**Settings / 设置**
> Click <kbd>⚙️</kbd> (bottom-right) to change fonts, themes, or configure AI keys.
> 点击右下角 <kbd>⚙️</kbd> 更改字体、主题或配置 AI。

**AI Agent / AI 助手**
> Enable AI in settings. Use the "✨" button to let the AI rewrite your document automatically.
> 在设置中开启 AI。点击输入框旁的 "✨" 按钮，让 AI 自动重写你的文档。
`;

export const RESUME_SIMPLE = `# 张三 (San Zhang)

> 📧 zhangsan@email.com | 📱 138-0000-0000 | 📍 北京

## 👨‍💻 个人简介
拥有 3 年前端开发经验，热衷于构建高性能、用户体验优秀的 Web 应用。善于沟通，具备良好的团队协作能力。

## 💼 工作经历

### 🚀 某科技创新有限公司 | 前端开发工程师
*2021.06 - 至今*
*   负责公司核心 SaaS 平台的前端重构，将首屏加载时间降低 **40%**。
*   建立前端组件库，提升团队开发效率 **30%**。
*   配合后端完成接口联调，确保系统稳定性。

### 🌱 某初创公司 | 实习开发
*2020.06 - 2021.05*
*   参与小程序开发与维护。
*   负责官网响应式页面制作。

## 🛠 技能清单
*   **核心**: HTML5, CSS3, JavaScript (ES6+), TypeScript
*   **框架**: React, Vue.js, Tailwind CSS
*   **工具**: Git, Webpack, Figma
`;

export const RESUME_ENGLISH = `# Alex Chen

> 📩 alex.chen@dev.com | 🔗 github.com/alexc | 🌍 Shanghai, China

## Summary
Full Stack Developer with a passion for cloud-native architecture and distributed systems. 5+ years of experience in designing scalable backend services.

## Experience

### **Global Tech Solutions** | Senior Backend Engineer
*Aug 2019 – Present*
- Architected a microservices-based payment gateway handling **1M+ transactions/day**.
- Optimized database queries, reducing latency by **200ms** on average.
- Mentored junior developers and conducted code reviews.

### **Creative Studio** | Web Developer
*May 2017 – July 2019*
- Developed interactive websites for diverse clients using React and Node.js.
- Implemented CI/CD pipelines using Jenkins and Docker.

## Skills
- **Languages**: Go, Java, Python, JavaScript
- **Infrastructure**: Kubernetes, AWS (EC2, S3, RDS), Docker
- **Database**: PostgreSQL, Redis, MongoDB
`;

export const RESUME_PROFESSIONAL = `# 李四 - 资深运营专家

## 📌 核心竞争力
*   **数据驱动**: 精通 SQL 与 Excel，善于通过数据分析挖掘业务增长点。
*   **全域营销**: 拥有 5 年以上跨平台（微信、抖音、小红书）内容运营经验。
*   **团队管理**: 曾带领 10 人团队完成年度千万级 GMV 目标。

## 🏢 工作经历

### **某知名电商集团** | 运营总监
*2020 - 至今*
1.  **用户增长体系搭建**: 设计并落地会员积分系统，使用户复购率提升 **25%**。
2.  **大促活动统筹**: 负责 "双11" 营销策划，协调产研与市场部门，实现销售额 **200%** 增长。

### **某内容平台** | 内容主管
*2017 - 2020*
*   从 0 到 1 孵化百万粉丝账号矩阵。
*   策划多起现象级刷屏活动，单次活动曝光量超 5000 万。

## 🎓 教育背景
**某重点大学** | 市场营销 | 硕士
`;

export const RESUME_GEEK = `# /usr/bin/geek_resume

\`\`\`json
{
  "name": "David Wang",
  "role": "DevOps Engineer",
  "status": "Open to work",
  "tags": ["Linux", "Automation", "Security"]
}
\`\`\`

## 🖥 Tech Stack
> "Automate everything that can be automated."

*   **OS**: \`Arch Linux\`, \`Ubuntu\`, \`CentOS\`
*   **Scripting**: \`Bash\`, \`Python\`, \`Go\`
*   **Cloud**: *AWS*, *Google Cloud*, *Aliyun*
*   **Tools**: \`Terraform\`, \`Ansible\`, \`Prometheus\`, \`Grafana\`

## 🏗 Projects

### 🛡 **Project Aegis**
*An automated security auditing tool for Kubernetes clusters.*
*   Written in **Go**.
*   Integrated with CI/CD pipelines to block insecure deployments.
*   [View on GitHub](#)

### ☁ **CloudScaler**
*Serverless auto-scaling engine.*
*   Reduced cloud costs by **35%** using spot instances.

## 📜 Certifications
*   CKA (Certified Kubernetes Administrator)
*   AWS Certified Solutions Architect
`;

export const RESUME_RUSTIC = `# 王五的简历

---
我想寻找一份 **平面设计** 或 **插画师** 的工作。

**联系我**
*   电话：139-9999-8888
*   作品集：dribbble.com/wangwu

**关于我**
我是一个喜欢安静创作的人。我不追求复杂的头衔，只希望能用色彩和线条传达情感。在过去的四年里，我为三家独立杂志绘制过封面，也为街角的咖啡店设计过菜单。

**我擅长**
*   手绘插画（水彩/板绘）
*   品牌视觉识别 (VI) 设计
*   书籍装帧设计

**经历**
*   **2019 - 2023**: 自由插画师，与多家出版社长期合作。
*   **2015 - 2019**: 美术学院，视觉传达专业。

> "设计不是为了装饰，而是为了交流。"
`;

export const TEMPLATE_GITHUB_README = `# Project Title

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

> A brief description of your project.

## 📦 Installation

\`\`\`bash
npm install my-project
\`\`\`

## 🚀 Usage

\`\`\`javascript
const myProject = require('my-project');
myProject.start();
\`\`\`

## 🤝 Contributing
1. Fork it
2. Create your feature branch (\`git checkout -b feature/fooBar\`)
3. Commit your changes (\`git commit -am 'Add some fooBar'\`)
4. Push to the branch (\`git push origin feature/fooBar\`)
5. Create a new Pull Request
`;

export const TEMPLATE_PRODUCT_MANUAL = `# Product Name - User Manual / 用户手册

## 📖 Table of Contents
1. [Safety Warnings / 安全警告](#safety)
2. [Getting Started / 快速开始](#start)
3. [Features / 功能介绍](#features)
4. [Troubleshooting / 故障排除](#trouble)

---

## ⚠️ Safety Warnings <a name="safety"></a>
*   Do not expose to water or moisture.
*   Keep away from heat sources.
*   请勿将设备暴露在水中或潮湿环境中。
*   请远离热源。

## 🏁 Getting Started <a name="start"></a>
1.  **Power On**: Hold the button for 3 seconds.
    *   **开机**：长按按钮 3 秒。
2.  **Pairing**: Enable Bluetooth and select "Device-X".
    *   **配对**：开启蓝牙并选择 "Device-X"。

## ⚡ Features <a name="features"></a>
| Feature | Description |
| :--- | :--- |
| **Smart Sleep** | Auto turn off after 5 mins of inactivity. |
| **Fast Charge** | 50% battery in 30 minutes. |

## 🔧 Troubleshooting <a name="trouble"></a>
> **Q: Device gets hot?**
> A: Normal during charging.
`;

export const TEMPLATE_MATH_PAPER = `# On the Properties of Prime Numbers
*关于素数性质的研究*

**Author**: John Doe
**Date**: October 2023

---

## Abstract / 摘要
This paper explores the distribution of prime numbers within specific intervals. We propose a new theorem regarding the density of primes.
本文探讨了特定区间内素数的分布，并提出了关于素数密度的新定理。

## 1. Introduction / 引言
The study of prime numbers dates back to Euclid. Let $P$ be the set of all prime numbers.

## 2. Main Theorem / 主要定理

**Theorem 2.1**: For any integer $n > 1$, there exists a prime $p$ such that $n < p < 2n$.

### Proof / 证明:
Let us assume the contrary... (See Bertrand's postulate).
假设反之……（参见伯特兰公设）。

## 3. Equation Analysis / 公式分析

Using the prime number theorem:

$$ \\pi(x) \\sim \\frac{x}{\\ln x} $$

We can observe that as $x$ approaches infinity, the relative error approaches zero.
当 $x$ 趋于无穷大时，相对误差趋于零。

## 4. Conclusion / 结论
We have demonstrated that the density follows the logarithmic integral function approximation.
`;

export const generateDefaultNotes = (): Note[] => {
    const now = Date.now();
    return [
        { id: generateId(), title: '👋 Welcome / 欢迎使用', content: GUIDE_CONTENT, updatedAt: now },
        { id: generateId(), title: 'Template - GitHub README', content: TEMPLATE_GITHUB_README, updatedAt: now - 500 },
        { id: generateId(), title: 'Template - User Manual (说明书)', content: TEMPLATE_PRODUCT_MANUAL, updatedAt: now - 600 },
        { id: generateId(), title: 'Template - Math Paper (论文)', content: TEMPLATE_MATH_PAPER, updatedAt: now - 700 },
        { id: generateId(), title: 'Resume - Simple (简约)', content: RESUME_SIMPLE, updatedAt: now - 1000 },
        { id: generateId(), title: 'Resume - English', content: RESUME_ENGLISH, updatedAt: now - 2000 },
        { id: generateId(), title: 'Resume - Professional (专业)', content: RESUME_PROFESSIONAL, updatedAt: now - 3000 },
        { id: generateId(), title: 'Resume - Geek (极客)', content: RESUME_GEEK, updatedAt: now - 4000 },
        { id: generateId(), title: 'Resume - Rustic (质朴)', content: RESUME_RUSTIC, updatedAt: now - 5000 },
    ];
};

export const TRANSLATIONS: { en: TranslationMap; zh: TranslationMap } = {
  en: {
    // Toolbar
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bold: "Bold",
    italic: "Italic",
    divider: "Divider",
    bulletList: "Bullet List",
    orderedList: "Ordered List",
    quote: "Quote",
    codeBlock: "Code Block",
    table: "Table",
    link: "Link",
    image: "Image",
    addShortcut: "Add Custom Shortcut",
    pdf: "PDF",
    editMode: "Edit Mode",
    splitMode: "Split Mode",
    viewMode: "View Mode",
    wysiwygMode: "WYSIWYG Mode",
    hideToolbar: "Hide Toolbar",
    showToolbar: "Show Toolbar",
    
    // Sidebar - Files
    myNotes: "My Notes",
    createNewNote: "Create New Note",
    untitled: "Untitled",
    deleteNote: "Delete Note",
    importNote: "Import Note",
    importFromFile: "Import from Local File (.md, .txt)",
    importFromUrl: "Import from URL",
    urlPlaceholder: "https://raw.githubusercontent.com/...",
    loading: "Loading...",
    importSuccess: "Imported Successfully",
    importError: "Failed to import.",
    compactMode: "Compact Mode",
    comfortableMode: "Comfortable Mode",

    // Sidebar - Settings
    settingsTitle: "SETTINGS",
    appearance: "APPEARANCE",
    fontFamily: "Font Family",
    uploadFont: "Upload Font (.ttf, .otf)",
    themes: "Themes",
    generateTheme: "Generate Random Theme",
    customizeTheme: "Customize Theme",
    saveTheme: "Save Current Theme",
    customThemes: "Custom Themes",
    language: "LANGUAGE",
    markdownStyle: "Markdown Style",
    enableHtml: "Render HTML Tags",
    enableHtmlDesc: "Enable rendering of raw HTML tags.",
    customCss: "Custom CSS",
    customCssDesc: "Define CSS classes for HTML elements.",
    hideSidebar: "Hide Sidebar",
    
    // Advanced Theme Modal
    advThemeTitle: "Advanced Theme Customization",
    globalColors: "Global Colors",
    sidebarLeft: "Sidebar (Left)",
    sidebarRight: "Sidebar (Right)",
    toolbar: "Toolbar",
    contentArea: "Content Area",
    bgColor: "Background Color",
    bgImage: "Background Image",
    uploadImage: "Upload Image",
    opacity: "Opacity / Alpha",
    textColor: "Text Color",
    accentColor: "Accent Color",
    applyImagePalette: "Apply extracted colors to Accent",
    reset: "Reset",
    exportTheme: "Export Theme",
    importTheme: "Import Theme",
    importThemeSuccess: "Theme imported successfully",
    importThemeError: "Invalid theme file",
    
    // AI
    aiAssistant: "AI AGENT",
    enableAI: "Enable AI Agent",
    aiModel: "Model",
    apiKey: "API Key",
    apiKeyPlaceholder: "Enter your API Key...",
    aiChatPlaceholder: "Instruction (e.g., 'Fix grammar', 'Make it funnier')...",
    send: "Chat",
    autoEdit: "Auto-Write / Agent",
    checkGrammar: "Check Grammar",
    insert: "Insert",
    copy: "Copy",
    aiError: "AI Error: Check key or connection.",
    aiThinking: "Agent is processing document...",
    aiUndo: "Undo Changes",
    aiRestored: "Content restored",
    aiApplied: "AI edits applied automatically.",
    aiKeyMissing: "Please configure your API Key in the settings to start using AI features.",
    openSettings: "Open Settings",

    // Footer
    chars: "chars",
    lines: "lines",
    toggleFileList: "Toggle File List",
    toggleSettings: "Toggle Settings",

    // Modals
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    warning: "Warning: This action cannot be undone.",
    deletePrompt: "Do you want to save a copy of this note to your computer before deleting it?",
    deleteOnly: "Delete Only",
    saveAndDelete: "Save & Delete",
    saveThemeTitle: "Save Custom Theme",
    themeName: "Theme Name",
    themePlaceholder: "e.g., Midnight Blue",
    currentPreview: "Current Preview",
    addShortcutTitle: "Add Custom Shortcut",
    selectIcon: "Select Icon",
    iconTypePreset: "Preset",
    iconTypeEmoji: "Emoji/Text",
    iconTypeImage: "Image URL",
    iconTypeSvg: "SVG Code",
    buttonLabel: "Button Label",
    buttonLabelPlaceholder: "e.g., TODO",
    optionalWithIcon: "(Optional with icon)",
    contentTemplate: "Content Template",
    templateHint: "Use \`\${\}\` to indicate where selected text should go.",
    quickTags: "Quick Tags",
    stylePresets: "Style Presets",
    importTitle: "Import Note",
    selectFile: "Select File",
    or: "OR",
    fetch: "Fetch",
  },
  zh: {
    // Toolbar
    heading1: "一级标题",
    heading2: "二级标题",
    heading3: "三级标题",
    bold: "加粗",
    italic: "斜体",
    divider: "分割线",
    bulletList: "无序列表",
    orderedList: "有序列表",
    quote: "引用",
    codeBlock: "代码块",
    table: "表格",
    link: "链接",
    image: "图片",
    addShortcut: "添加快捷方式",
    pdf: "导出PDF",
    editMode: "编辑模式",
    splitMode: "分栏模式",
    viewMode: "阅读模式",
    wysiwygMode: "所见即所得",
    hideToolbar: "隐藏工具栏",
    showToolbar: "显示工具栏",

    // Sidebar - Files
    myNotes: "我的笔记",
    createNewNote: "新建笔记",
    untitled: "无标题",
    deleteNote: "删除笔记",
    importNote: "导入笔记",
    importFromFile: "导入本地文件 (.md, .txt)",
    importFromUrl: "从 URL 导入",
    urlPlaceholder: "例如: https://raw.githubusercontent.com/...",
    loading: "加载中...",
    importSuccess: "导入成功",
    importError: "导入失败",
    compactMode: "紧凑模式",
    comfortableMode: "舒适模式",

    // Sidebar - Settings
    settingsTitle: "全局设置",
    appearance: "外观设置",
    fontFamily: "字体设置",
    uploadFont: "上传字体 (.ttf, .otf)",
    themes: "主题设置",
    generateTheme: "生成随机主题",
    customizeTheme: "自定义主题",
    saveTheme: "保存当前主题",
    customThemes: "自定义主题",
    language: "语言设置",
    markdownStyle: "Markdown 渲染风格",
    enableHtml: "支持 HTML 标签渲染",
    enableHtmlDesc: "开启后可渲染原始 HTML 标签。",
    customCss: "自定义 CSS",
    customCssDesc: "定义 HTML 元素的 CSS 样式。",
    hideSidebar: "收起侧边栏",
    
     // Advanced Theme Modal
    advThemeTitle: "高级主题自定义",
    globalColors: "全局颜色",
    sidebarLeft: "左侧边栏",
    sidebarRight: "右侧边栏",
    toolbar: "工具栏",
    contentArea: "内容区域",
    bgColor: "背景颜色",
    bgImage: "背景图片",
    uploadImage: "上传图片",
    opacity: "透明度",
    textColor: "文字颜色",
    accentColor: "强调色",
    applyImagePalette: "应用图片色系到强调色",
    reset: "重置",
    exportTheme: "导出主题",
    importTheme: "导入主题",
    importThemeSuccess: "主题导入成功",
    importThemeError: "无效的主题文件",

    // AI
    aiAssistant: "AI 智能 Agent",
    enableAI: "开启 AI Agent",
    aiModel: "模型",
    apiKey: "API Key",
    apiKeyPlaceholder: "输入 API Key...",
    aiChatPlaceholder: "输入指令 (例如: '检查语法', '改写得幽默点')...",
    send: "聊天",
    autoEdit: "Agent 自动重写",
    checkGrammar: "语法检查",
    insert: "插入",
    copy: "复制",
    aiError: "AI 错误：请检查 Key 或网络。",
    aiThinking: "Agent 正在处理文档...",
    aiUndo: "撤销修改",
    aiRestored: "内容已恢复",
    aiApplied: "AI 修改已自动应用。",
    aiKeyMissing: "请在设置中配置 API Key 以开始使用 AI 功能。",
    openSettings: "打开设置",

    // Footer
    chars: "字符",
    lines: "行",
    toggleFileList: "展开/收起文件列表",
    toggleSettings: "展开/收起设置",

    // Modals
    cancel: "取消",
    save: "保存",
    delete: "删除",
    warning: "警告：此操作无法撤销。",
    deletePrompt: "删除前是否需要将此笔记保存到本地？",
    deleteOnly: "仅删除",
    saveAndDelete: "保存并删除",
    saveThemeTitle: "保存自定义主题",
    themeName: "主题名称",
    themePlaceholder: "例如：午夜蓝",
    currentPreview: "当前预览",
    addShortcutTitle: "添加自定义快捷方式",
    selectIcon: "选择图标",
    iconTypePreset: "预设",
    iconTypeEmoji: "Emoji/文本",
    iconTypeImage: "图片链接",
    iconTypeSvg: "SVG代码",
    buttonLabel: "按钮标签",
    buttonLabelPlaceholder: "例如：待办",
    optionalWithIcon: "（若选图标可不填）",
    contentTemplate: "内容模板",
    templateHint: "使用 \`\${\}\` 标记选中文本的位置。",
    quickTags: "快速标签",
    stylePresets: "样式预设",
    importTitle: "导入笔记",
    selectFile: "选择文件",
    or: "或",
    fetch: "获取内容",
  }
};