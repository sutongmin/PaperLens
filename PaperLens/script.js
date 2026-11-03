
// ==================================
// PaperLens 论文速读助手
// 核心功能模块
// ==================================

const paperInput = document.getElementById("paperInput");
const wordCount = document.getElementById("wordCount");
const analyzeBtn = document.getElementById("analyzeBtn");

const keywordsBox = document.getElementById("keywords");
const summaryBox = document.getElementById("summary");
const readingTimeBox = document.getElementById("readingTime");

// 中文停用词
const stopWords = new Set([
    "我们", "你们", "他们", "这个", "那个",
    "以及", "通过", "进行", "可以", "能够",
    "对于", "因为", "所以", "但是", "如果",
    "其中", "一种", "一个", "这些", "那些",
    "研究", "本文", "结果", "方法", "分析",
    "the", "and", "for", "with", "that",
    "this", "from", "are", "was", "were",
    "have", "has", "been", "into", "using",
    "based", "their", "which", "will"
]);

// 1. 统计文本字数
function countWords(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g) || []).length;
    const numbers = (text.match(/\d+/g) || []).length;

    return chineseChars + englishWords + numbers;
}

// 输入内容时自动更新字数
paperInput.addEventListener("input", function () {
    const count = countWords(paperInput.value);
    wordCount.textContent = count + " 字";
});

// 2. 提取中英文关键词
function extractKeywords(text) {
    const cleanText = text.toLowerCase();

    const words = cleanText.match(
        /[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g
    ) || [];

    const frequency = {};

    words.forEach(word => {
        if (stopWords.has(word)) return;

        if (/^[a-z]+$/.test(word) && word.length < 4) return;

        frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(item => item[0]);
}

// 3. 生成论文内容概览
function generateSummary(text) {
    const sentences = text
        .replace(/([。！？.!?])/g, "$1|")
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 8);

    if (sentences.length === 0) {
        return "暂时无法生成概览，请输入更多论文内容。";
    }

    return sentences.slice(0, 3).join(" ");
}

// 4. 估算阅读时间
function calculateReadingTime(text) {
    const count = countWords(text);

    // 按每分钟约300个计数单位估算
    const minutes = Math.max(1, Math.ceil(count / 300));

    return minutes + " 分钟";
}

// 5. 开始分析
analyzeBtn.addEventListener("click", function () {
    const text = paperInput.value.trim();

    if (!text) {
        alert("请先输入论文内容！");
        return;
    }

    const keywords = extractKeywords(text);
    const summary = generateSummary(text);
    const readingTime = calculateReadingTime(text);

    // 显示关键词
    if (keywords.length > 0) {
        keywordsBox.innerHTML = keywords.map(word =>
            `<span class="keyword-tag">${escapeHTML(word)}</span>`
        ).join(" ");
    } else {
        keywordsBox.textContent = "暂未提取到明显关键词。";
    }

    // 显示概览
    summaryBox.textContent = summary;

    // 显示阅读时间
    readingTimeBox.textContent = readingTime;
        // 保存本次分析记录
    saveHistory({
        time: new Date().toLocaleString("zh-CN"),
        count: countWords(text),
        keywords: keywords,
        summary: summary,
        readingTime: readingTime
    });
});


// ==================================
// 6. 论文历史记录功能
// ==================================

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// 从浏览器读取历史记录
function getHistory() {
    return JSON.parse(
        localStorage.getItem("paperLensHistory") || "[]"
    );
}

// 保存历史记录
function saveHistory(record) {
    const history = getHistory();

    history.unshift(record);

    // 最多保存20条
    localStorage.setItem(
        "paperLensHistory",
        JSON.stringify(history.slice(0, 20))
    );

    renderHistory();
}

// 显示历史记录
function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML =
            '<p class="empty-history">暂无分析记录</p>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <h3>论文分析记录</h3>
            <p>分析时间：${escapeHTML(item.time)}</p>
            <p>字数：${item.count} 字</p>
            <p>关键词：${item.keywords.map(escapeHTML).join("、")}</p>
            <p>阅读时间：${escapeHTML(item.readingTime)}</p>
        </div>
    `).join("");
}

// 清空历史记录
clearHistoryBtn.addEventListener("click", function () {
    if (confirm("确定要清空所有历史记录吗？")) {
        localStorage.removeItem("paperLensHistory");
        renderHistory();
    }
});


// 页面打开时自动加载记录
renderHistory();


// 安全处理关键词文本
function escapeHTML(text) {
    return text.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}
