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
  
  // 顯示檔案名稱
  fileNameDisplay.textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    // 讀取 "工作表1"
    const sheet = workbook.Sheets["工作表1"];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 清空原本需求
    document.getElementById("demand-inputs").innerHTML = "";

    // 假設欄位順序：項目編號 | 數量 | 管徑 | 長度
    rows.forEach((row, idx) => {
      if (idx === 0) return; // 跳過標題列
      const qty = parseInt(row[1]);  // 數量
      const tube = row[2];           // 管徑
      const len = parseInt(row[3]);  // 長度

      if (!isNaN(len) && !isNaN(qty)) {
        const div = document.createElement("div");
        div.className = "input-row";
        div.innerHTML = `管徑 <input type="text" class="demand-tube" value="${tube}">
                         長度 <input type="number" class="demand-len" value="${len}">
                         數量 <input type="number" class="demand-qty" value="${qty}">
                         <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
        document.getElementById("demand-inputs").appendChild(div);
      }
    });
  };
  reader.readAsArrayBuffer(file);
}
