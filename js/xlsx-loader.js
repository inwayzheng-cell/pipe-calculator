/**
 * 極簡版 Excel 匯入工具 - 專門配合灰底 Label 使用
 */

// 1. 初始化：確保頁面載入後，隱藏的 input 能接收到指令
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("excel-file");
    const fileNameDisplay = document.getElementById("file-name");

    if (fileInput) {
        // 當使用者透過 Label 選完檔案後觸發
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                // 更新顯示的檔名
                if (fileNameDisplay) fileNameDisplay.textContent = file.name;
                // 開始解析
                handleFile(e);
                // 清空 input 數值 (這樣下次選同一個檔案才會再次觸發 change)
                fileInput.value = "";
            }
        });
    }
});

// 2. 核心解析邏輯
function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // 尋找標題行位置
            let headerRowIndex = -1;
            let colIndex = { type: -1, len: -1, qty: -1 };

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row) continue;
                const tIdx = row.findIndex(c => String(c||'').includes('管徑') || String(c||'').includes('說明'));
                const lIdx = row.findIndex(c => String(c||'').includes('長度'));
                const qIdx = row.findIndex(c => String(c||'').includes('數量'));

                if (tIdx !== -1 && lIdx !== -1 && qIdx !== -1) {
                    headerRowIndex = i;
                    colIndex = { type: tIdx, len: lIdx, qty: qIdx };
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert("找不到有效的數據欄位 (需包含: 管徑、長度、數量)");
                return;
            }

            // 清空目前的輸入區
            const demandInputs = document.getElementById("demand-inputs");
            demandInputs.innerHTML = "";
            
            // 觸發「新增需求分組」按鈕
            document.getElementById("add-demand-btn").click();
            
            // 延遲一下待 DOM 生成後填入
            setTimeout(() => {
                const currentGroupList = demandInputs.querySelector(".demand-item-list");
                let count = 0;
                
                for (let i = headerRowIndex + 1; i < rows.length; i++) {
                    const row = rows[i];
                    // 遇到空行或匯出檔的裁切明細分隔線則停止
                    if (!row || row.length === 0 || String(row[0]).includes('---')) break;

                    const type = row[colIndex.type] || "未指定";
                    const len = parseFloat(row[colIndex.len]);
                    const qty = parseInt(row[colIndex.qty]);

                    if (!isNaN(len) && !isNaN(qty)) {
                        const newItem = document.createElement("div");
                        newItem.className = "input-row demand-item";
                        newItem.innerHTML = `
                            長度 <input type="number" class="demand-len" value="${len}">
                            數量 <input type="number" class="demand-qty" value="${qty}">
                            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>
                        `;
                        currentGroupList.appendChild(newItem);
                        
                        // 設定該分組的管徑名稱 (僅第一筆)
                        if (count === 0) {
                            const typeInput = demandInputs.querySelector(".demand-tube");
                            if (typeInput) typeInput.value = type;
                        }
                        count++;
                    }
                }
                alert(`成功讀取 ${count} 筆資料！`);
            }, 50);

        } catch (error) {
            console.error("解析失敗:", error);
            alert("Excel 讀取失敗，請確認檔案格式。");
        }
    };
    reader.readAsArrayBuffer(file);
}