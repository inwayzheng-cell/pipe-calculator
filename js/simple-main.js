/**
 * 極致優化裁切系統 - 10 支最優解整合版
 */
let savedResults = null;
let savedDemands = null;

// --- 1. 核心 DP 引擎 (確保 10 支最優解) ---
function findOptimalCombination(demands, maxLength) {
    if (!demands || demands.length === 0) return { items: [], used: 0 };
    const n = demands.length;
    const dp = new Int32Array(maxLength + 1).fill(0);
    const keep = Array.from({ length: n + 1 }, () => new Uint8Array(maxLength + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
        const len = demands[i - 1];
        for (let w = maxLength; w >= len; w--) {
            const newValue = dp[w - len] + len;
            if (newValue > dp[w]) {
                dp[w] = newValue;
                keep[i][w] = 1;
            }
        }
    }
    
    const selectedItems = [];
    let tempW = dp[maxLength];
    for (let i = n; i > 0 && tempW > 0; i--) {
        if (keep[i][tempW] === 1) {
            selectedItems.push(demands[i - 1]);
            tempW -= demands[i - 1];
        }
    }
    return { items: selectedItems, used: dp[maxLength] };
}

// --- 2. UI 功能：新增長度項目 ---
window.addDemandItem = function(btn) {
    const itemList = btn.previousElementSibling;
    const newItem = document.createElement("div");
    newItem.className = "input-row demand-item";
    
    // 使用 label 包裝，確保「文字+輸入框」在手機版不會被拆散換行
    newItem.innerHTML = `
        <label class="input-unit">
            <span>長度</span>
            <input type="number" class="demand-len" placeholder="長度">
        </label>
        <label class="input-unit">
            <span>數量</span>
            <input type="number" class="demand-qty" value="1">
        </label>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>
    `;
    itemList.appendChild(newItem);
};

// --- 3. 渲染結果到畫面上 ---
function renderResults(results) {
    const container = document.getElementById("result");
    if (!results || results.length === 0) {
        container.innerHTML = "<p>無計算結果</p>";
        return;
    }

    let html = "";
    results.forEach(res => {
        html += `<div class="type-result">
            <h2>管徑種類：${res.stockType}</h2>`;
        
        const tubeData = res.tubeResults[res.stockType];
        html += `<h4>共需 ${tubeData.totalGroups} 支 (原始長度: ${res.stockLength})</h4>`;
        
        tubeData.groups.forEach((g, i) => {
            const usagePercent = ((g.used / g.stockLength) * 100).toFixed(1);
            html += `
                <div class="group">
                    <strong>第 ${i + 1} 支：</strong> 
                    <span>${g.cuts.join(" + ")}</span>
                    <div class="metrics">
                        使用: ${g.used} | 餘料: ${g.remainder} | 利用率: ${usagePercent}%
                    </div>
                </div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

// --- 4. 主要事件綁定 ---
window.addEventListener('DOMContentLoaded', () => {
    // A. 新增庫存按鈕
    document.getElementById("add-stock-btn").onclick = () => {
        const div = document.createElement("div");
        div.className = "input-row";
        div.innerHTML = `
            種類 <input type="text" class="stock-type" placeholder="種類">
            長度 <input type="number" class="stock" value="5850">
            數量 <input type="number" class="stock-qty" value="1">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>
        `;
        document.getElementById("stock-inputs").appendChild(div);
    };

    // B. 新增需求分組按鈕
    document.getElementById("add-demand-btn").onclick = () => {
        const group = document.createElement("div");
        group.className = "demand-group";
        group.innerHTML = `
            <div class="input-row group-header">
                規格 <input type="text" class="demand-tube" placeholder="管徑種類">
                <button type="button" class="remove-btn" onclick="this.closest('.demand-group').remove()">✕</button>
            </div>
            <div class="demand-item-list"></div>
            <button type="button" class="add-item-btn" onclick="window.addDemandItem(this)">＋ 新增長度</button>
        `;
        document.getElementById("demand-inputs").appendChild(group);
    };

    // C. 開始計算按鈕 (執行 DP 優化)
    document.getElementById("run-btn").onclick = () => {
        const stocks = Array.from(document.querySelectorAll("#stock-inputs .input-row")).map(div => ({
            type: div.querySelector(".stock-type").value || "未指定",
            length: parseInt(div.querySelector(".stock").value)
        })).filter(s => !isNaN(s.length));

        const demands = [];
        document.querySelectorAll(".demand-group").forEach(group => {
            const type = group.querySelector(".demand-tube").value || "未指定";
            group.querySelectorAll(".demand-item").forEach(item => {
                const len = parseInt(item.querySelector(".demand-len").value);
                const qty = parseInt(item.querySelector(".demand-qty").value);
                if (!isNaN(len) && !isNaN(qty)) demands.push({ len, qty, type });
            });
        });

        if (stocks.length === 0 || demands.length === 0) {
            alert("請輸入有效的庫存與需求項目");
            return;
        }

        // 執行優化邏輯
        const finalResults = [];
        const demandsByTube = {};
        demands.forEach(d => {
            if (!demandsByTube[d.type]) demandsByTube[d.type] = [];
            for (let i = 0; i < d.qty; i++) demandsByTube[d.type].push(d.len);
        });

        Object.keys(demandsByTube).forEach(type => {
            let remaining = demandsByTube[type].sort((a, b) => b - a);
            const stock = stocks.find(s => s.type === type) || stocks[0];
            const groups = [];

            while (remaining.length > 0) {
                const best = findOptimalCombination(remaining, stock.length);
                if (best.items.length === 0) break;
                groups.push({
                    cuts: [...best.items],
                    used: best.used,
                    remainder: stock.length - best.used,
                    stockLength: stock.length
                });
                best.items.forEach(item => {
                    const idx = remaining.indexOf(item);
                    if (idx > -1) remaining.splice(idx, 1);
                });
            }
            finalResults.push({
                stockType: type,
                stockLength: stock.length,
                tubeResults: { [type]: { groups: groups, totalGroups: groups.length } }
            });
        });

        // 儲存結果以便匯出
        savedResults = finalResults;
        savedDemands = demands;
        renderResults(finalResults);
        document.getElementById("export-btn").disabled = false;
    };

    // D. 匯出 Excel 按鈕 (補上這段)
    document.getElementById("export-btn").onclick = () => {
        if (savedResults) {
            if (typeof exportToExcel === 'function') {
                exportToExcel(savedResults, savedDemands);
            } else {
                alert("找不到匯出功能 (exporter.js)，請檢查檔案載入順序");
            }
        } else {
            alert("請先進行計算");
        }
    };

    // E. 清除按鈕
/**
 * 功能 A：僅清除計算結果與新增的庫存長度
 * (保留需求列表不變)
 */
document.getElementById("clear-results-btn").addEventListener("click", () => {
    if (!confirm("要清除計算與自定庫存長度？(需求列表將保留)")) return;

    // 1. 清除計算結果顯示區
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = '<p style="color: #999; text-align: center;">尚未有計算結果，請點擊上方按鈕開始。</p>';

    // 2. 隱藏匯出按鈕
    const exportBtn = document.getElementById("export-btn");
    exportBtn.disabled = true;
    savedResults = null;

    // 3. 清除「新增的」庫存長度 (保留第一個預設的)
    const stockInputs = document.getElementById("stock-inputs");
    const stockRows = stockInputs.querySelectorAll(".input-row");
    // 從第二個開始刪除，或者重置第一個
    stockRows.forEach((row, index) => {
        if (index === 0) {
            // 重置第一個輸入框到預設值
            row.querySelector(".stock-type").value = "";
            row.querySelector(".stock").value = "5850";
            row.querySelector(".stock-qty").value = "1";
        } else {
            row.remove();
        }
    });

    console.log("已清除結果與庫存設定");
});

/**
 * 功能 B：全部重置 (恢復到剛打開網頁的狀態)
 */
document.getElementById("clear-all-btn").addEventListener("click", () => {
    if (!confirm("清空所有資料？")) return;
    
    // 執行上面的清除結果邏輯
    document.getElementById("clear-results-btn").click();

    // 額外清除需求列表
    const demandInputs = document.getElementById("demand-inputs");
    demandInputs.innerHTML = "";
    
    // 清除已記錄的檔名
    const fileNameDisplay = document.getElementById("file-name");
    if (fileNameDisplay) fileNameDisplay.textContent = "未選擇檔案";
    
    console.log("所有資料已重置");
});
});