// 綁定事件
document.getElementById("add-stock-btn").addEventListener("click", () => {
  const div = document.createElement("div");
  div.className = "input-row";
  div.innerHTML = `種類 <input type="text" class="stock-type" placeholder="管材種類">
                   長度 <input type="number" class="stock" value="5850">
                   數量 <input type="number" class="stock-qty" value="1">
                   <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById("stock-inputs").appendChild(div);
});

document.getElementById("add-demand-btn").addEventListener("click", () => {
  const div = document.createElement("div");
  div.className = "input-row";
  div.innerHTML = `管徑 <input type="text" class="demand-tube" placeholder="管徑種類">
                   長度 <input type="number" class="demand-len">
                   數量 <input type="number" class="demand-qty">
                   <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById("demand-inputs").appendChild(div);
});

document.getElementById("run-btn").addEventListener("click", () => {
  console.log("計算按鈕被點擊");
  
  // 收集單支最大長度數據，包括種類、長度和數量
  const stocks = Array.from(document.querySelectorAll("#stock-inputs > div")).map(div => {
    const length = parseInt(div.querySelector(".stock").value);
    const typeInput = div.querySelector(".stock-type");
    const qtyInput = div.querySelector(".stock-qty");
    const type = typeInput && typeInput.value && typeInput.value.trim() !== '' ? typeInput.value.trim() : '未指定';
    const qty = qtyInput && !isNaN(parseInt(qtyInput.value)) ? parseInt(qtyInput.value) : 1;
    return { type, length, qty };
  }).filter(s => !isNaN(s.length));

  const demands = Array.from(document.querySelectorAll("#demand-inputs > div")).map(div => {
    const len = parseInt(div.querySelector(".demand-len").value);
    const qty = parseInt(div.querySelector(".demand-qty").value);
    const tubeInput = div.querySelector(".demand-tube");
    const type = tubeInput && tubeInput.value && tubeInput.value.trim() !== '' ? tubeInput.value.trim() : '未指定';
    return { len, qty, type };
  }).filter(d => !isNaN(d.len) && !isNaN(d.qty));

  console.log("收集到的庫存數據:", stocks);
  console.log("收集到的需求數據:", demands);
  
  if (stocks.length === 0) {
    alert("請至少輸入一個庫存項目");
    return;
  }
  
  if (demands.length === 0) {
    alert("請至少輸入一個需求項目");
    return;
  }
  
  try {
    console.log("開始執行計算...");
    const results = runGrouping(stocks, demands);
    console.log("計算結果:", results);
    renderResults(results);
    console.log("結果渲染完成");
  } catch (error) {
    console.error("計算過程中發生錯誤:", error);
    alert("計算過程中發生錯誤，請檢查控制台獲取詳細信息");
  }
});

// 清除功能
document.getElementById("clear-btn").addEventListener("click", () => {
  // 清除所有新增的單支最大長度項目（保留第一個預設項目）
  const stockInputs = document.getElementById("stock-inputs");
  const stockRows = stockInputs.querySelectorAll(".input-row");
  stockRows.forEach(row => row.remove());
  
  // 重置第一個預設項目的值
  const defaultStockInputs = stockInputs.querySelector("div");
  if (defaultStockInputs) {
    const typeInput = defaultStockInputs.querySelector(".stock-type");
    const lengthInput = defaultStockInputs.querySelector(".stock");
    const qtyInput = defaultStockInputs.querySelector(".stock-qty");
    if (typeInput) typeInput.value = "";
    if (lengthInput) lengthInput.value = "5850";
    if (qtyInput) qtyInput.value = "1";
  }
  
  // 清除所有需求項目
  const demandInputs = document.getElementById("demand-inputs");
  demandInputs.innerHTML = "";
  
  // 清除結果
  document.getElementById("result").innerHTML = "";
  
  // 清除檔案選擇
  document.getElementById("excel-file").value = "";
  document.getElementById("file-name").textContent = "未選擇檔案";
});
