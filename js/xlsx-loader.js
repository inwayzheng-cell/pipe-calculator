// Excel 匯入需求列表
const excelFileInput = document.getElementById("excel-file");
const fileNameDisplay = document.getElementById("file-name");

excelFileInput.addEventListener("change", handleFile, false);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) {
    fileNameDisplay.textContent = "未選擇檔案";
    return;
  }
  
  fileNameDisplay.textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert("Excel 檔案中找不到任何工作表。");
        return;
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) {
        alert("工作表必須至少包含一個標題行和一行數據。");
        return;
      }

      const header = rows[0];
      const qtyIndex = header.findIndex(h => h && String(h).includes('數量'));
      const tubeIndex = header.findIndex(h => h && (String(h).includes('管徑') || String(h).includes('說明')));
      const lenIndex = header.findIndex(h => h && String(h).includes('長度'));

      if (qtyIndex === -1 || tubeIndex === -1 || lenIndex === -1) {
        alert('Excel 標題行必須包含 "數量"、"長度"，以及 "管徑" 或 "說明"。\n未找到的欄位：' + 
              `${qtyIndex === -1 ? ' 數量' : ''}` + 
              `${tubeIndex === -1 ? ' 管徑/說明' : ''}` + 
              `${lenIndex === -1 ? ' 長度' : ''}`);
        return;
      }

      document.getElementById("demand-inputs").innerHTML = "";

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue; // 跳過空行

        const qty = parseInt(row[qtyIndex]);
        const tube = row[tubeIndex];
        const len = parseInt(row[lenIndex]);

        if (!isNaN(len) && !isNaN(qty) && qty > 0 && len > 0) {
          const div = document.createElement("div");
          div.className = "input-row";
          div.innerHTML = `管徑 <input type="text" class="demand-tube" value="${tube || ''}">
                           長度 <input type="number" class="demand-len" value="${len}">
                           數量 <input type="number" class="demand-qty" value="${qty}">
                           <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
          document.getElementById("demand-inputs").appendChild(div);
        }
      }
    } catch (error) {
      console.error("讀取或處理 Excel 檔案時發生錯誤:", error);
      alert("讀取 Excel 檔案失敗。請確認檔案格式是否正確，或檢查開發者控制台以獲取更多資訊。");
      excelFileInput.value = "";
      fileNameDisplay.textContent = "未選擇檔案";
    }
  };
  reader.readAsArrayBuffer(file);
}
