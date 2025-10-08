// 用於保存最新的計算結果
let savedResults = null;

// 簡化版主要邏輯 - 回到基本功能

// 新增單支最大長度功能
document.getElementById("add-stock-btn").addEventListener("click", () => {
  const stockInputs = document.getElementById("stock-inputs");
  const newRow = document.createElement("div");
  newRow.className = "input-row";
  newRow.innerHTML = `
    種類 <input type="text" class="stock-type" placeholder="管材種類">
    長度 <input type="number" class="stock" placeholder="輸入長度">
    數量 <input type="number" class="stock-qty" value="1">
    <button class="remove-btn" onclick="this.parentElement.remove()">移除</button>
  `;
  stockInputs.appendChild(newRow);
});

// 新增需求功能（已修改為分組模式）
document.getElementById("add-demand-btn").addEventListener("click", () => {
  const demandInputs = document.getElementById("demand-inputs");
  const newGroup = document.createElement("div");
  newGroup.className = "demand-group";
  newGroup.innerHTML = `
    <div class="input-row group-header">
      管徑 <input type="text" class="demand-tube" placeholder="管徑種類">
      <button class="remove-btn" onclick="this.closest('.demand-group').remove()">x</button>
    </div>
    <div class="demand-item-list">
      <!-- 長度/數量項目將會加在這裡 -->
    </div>
    <button class="add-item-btn" onclick="addDemandItem(this)">＋ 新增長度</button>
  `;
  demandInputs.appendChild(newGroup);
});

// 在管徑區塊內新增長度/數量項目
function addDemandItem(btn) {
  const itemList = btn.previousElementSibling;
  const newItem = document.createElement("div");
  newItem.className = "input-row demand-item";
  newItem.innerHTML = `
    長度 <input type="number" class="demand-len" placeholder="需求長度">
    數量 <input type="number" class="demand-qty" value="1">
    <button class="remove-btn" onclick="this.parentElement.remove()">移除</button>
  `;
  itemList.appendChild(newItem);
}


// 簡化的計算邏輯
function simpleGrouping(stocks, demands) {
  console.log("開始簡化計算", { stocks, demands });
  
  const results = [];
  
  // 按管徑分類需求
  const demandsByTube = {};
  demands.forEach(demand => {
    const tubeType = demand.type || '未指定';
    if (!demandsByTube[tubeType]) {
      demandsByTube[tubeType] = [];
    }
    // 展開需求（根據數量）
    for (let i = 0; i < demand.qty; i++) {
      demandsByTube[tubeType].push(demand.len);
    }
  });
  
  console.log("需求分類:", demandsByTube);
  
  // 處理每種管徑
  Object.keys(demandsByTube).forEach(tubeType => {
    const tubeDemands = demandsByTube[tubeType].sort((a, b) => b - a); // 由大到小排序
    console.log(`處理 ${tubeType} 管徑:`, tubeDemands);
    
    // 找到對應的庫存，優先使用特殊長度（非5850mm），然後按長度排序
    let matchingStocks = stocks.filter(s => s.type === tubeType || s.type === '未指定')
                              .sort((a, b) => {
                                // 優先使用非預設長度（非5850mm）
                                const aIsDefault = a.length === 5850;
                                const bIsDefault = b.length === 5850;
                                if (aIsDefault && !bIsDefault) return 1;
                                if (!aIsDefault && bIsDefault) return -1;
                                // 如果都是特殊長度或都是預設長度，按長度排序（長的優先）
                                return b.length - a.length;
                              });
    
    if (matchingStocks.length === 0) {
      console.log(`沒有找到 ${tubeType} 的庫存`);
      return;
    }
    
    console.log(`找到庫存:`, matchingStocks);
    
    // 創建可用庫存列表（考慮數量）
    const availableStocks = [];
    matchingStocks.forEach(stock => {
      for (let i = 0; i < stock.qty; i++) {
        availableStocks.push({
          length: stock.length,
          type: stock.type
        });
      }
    });
    
    console.log(`可用庫存:`, availableStocks);
    
    // 改進的分組邏輯：按庫存順序分配，優先使用較短的庫存
    const groups = [];
    let remainingDemands = [...tubeDemands];
    let remainingStocks = [...availableStocks];

    // 按庫存順序處理（已經按優先級排序）
    while (remainingDemands.length > 0 && remainingStocks.length > 0) {
      // 取第一個可用庫存
      const currentStock = remainingStocks[0];
      const group = [];
      let currentLength = 0;
      
      // 嘗試在這根庫存中放入盡可能多的需求
      let i = 0;
      while (i < remainingDemands.length) {
        if (currentLength + remainingDemands[i] <= currentStock.length) {
          group.push(remainingDemands[i]);
          currentLength += remainingDemands[i];
          remainingDemands.splice(i, 1);
        } else {
          i++;
        }
      }
      
      // 如果這根庫存能放入至少一個需求，就使用它
      if (group.length > 0) {
        groups.push({
          cuts: group, // 使用 cuts 替代 items 以匹配匯出邏輯
          used: currentLength,
          remainder: currentStock.length - currentLength, // 使用 remainder 替代 waste
          stockLength: currentStock.length
        });
      }
      
      // 移除已使用的庫存
      remainingStocks.shift();
    }
    
    // 如果還有剩餘需求但沒有庫存了，使用預設長度
    if (remainingDemands.length > 0) {
      const defaultLength = 5850; // 預設長度
      while (remainingDemands.length > 0) {
        const group = [];
        let currentLength = 0;
        
        let i = 0;
        while (i < remainingDemands.length) {
          if (currentLength + remainingDemands[i] <= defaultLength) {
            group.push(remainingDemands[i]);
            currentLength += remainingDemands[i];
            remainingDemands.splice(i, 1);
          } else {
            i++;
          }
        }
        
        if (group.length > 0) {
          groups.push({
            cuts: group, // 使用 cuts 替代 items
            used: currentLength,
            remainder: defaultLength - currentLength, // 使用 remainder 替代 waste
            stockLength: defaultLength
          });
        } else {
          console.warn(`無法放入需求: ${remainingDemands[0]}`);
          remainingDemands.shift();
        }
      }
    }
    
    console.log(`${tubeType} 分組結果:`, groups);
    
    // 創建結果
    results.push({
      stockType: tubeType,
      stockLength: groups.length > 0 ? groups[0].stockLength : (matchingStocks[0]?.length || 5850),
      tubeResults: {
        [tubeType]: {
          groups: groups
        }
      }
    });
  });
  
  console.log("最終結果:", results);
  return results;
}

// 簡化的結果渲染
function simpleRenderResults(results) {
  const resultDiv = document.getElementById("result");
  
  if (!results || results.length === 0) {
    resultDiv.innerHTML = "<p>沒有計算結果</p>";
    return;
  }
  
  let html = "";
  
  results.forEach(result => {
    const stockType = result.stockType;
    const tubeData = result.tubeResults[stockType];
    if (!tubeData || !tubeData.groups || tubeData.groups.length === 0) {
      return;
    }
    const groups = tubeData.groups;
    
    html += `<div class="result-section">`;
    html += `<h3>${stockType}</h3>`;
    
    groups.forEach((group, index) => {
      html += `<div class="group">`;
      html += `<strong>第 ${index + 1} 根 (庫存長度: ${group.stockLength}):</strong> `;
      html += `[${group.cuts.join(', ')}] `;
      html += `使用: ${group.used}, 餘料: ${group.remainder}`;
      html += `</div>`;
    });
    
    html += `</div>`;
  });
  
  resultDiv.innerHTML = html;
}

// 主要計算按鈕事件
document.getElementById("run-btn").addEventListener("click", () => {
  console.log("開始簡化計算...");
  
  // 禁用匯出按鈕並重置結果
  document.getElementById("export-btn").disabled = true;
  savedResults = null;

  // 收集庫存數據
  const stocks = Array.from(document.querySelectorAll("#stock-inputs .input-row")).map(div => {
    const length = parseInt(div.querySelector(".stock").value);
    const typeInput = div.querySelector(".stock-type");
    const qtyInput = div.querySelector(".stock-qty");
    const type = typeInput && typeInput.value && typeInput.value.trim() !== '' ? typeInput.value.trim() : '未指定';
    const qty = qtyInput && !isNaN(parseInt(qtyInput.value)) ? parseInt(qtyInput.value) : 1;
    return { type, length, qty };
  }).filter(s => !isNaN(s.length));

  // 收集需求數據（***修改處：兼容兩種模式***）
  const demands = [];
  // 1. 處理手動分組模式
  document.querySelectorAll("#demand-inputs .demand-group").forEach(group => {
    const tubeInput = group.querySelector(".demand-tube");
    const type = tubeInput && tubeInput.value && tubeInput.value.trim() !== '' ? tubeInput.value.trim() : '未指定';
    
    group.querySelectorAll(".demand-item").forEach(item => {
      const len = parseInt(item.querySelector(".demand-len").value);
      const qty = parseInt(item.querySelector(".demand-qty").value);
      if (!isNaN(len) && !isNaN(qty) && qty > 0) {
        demands.push({ len, qty, type });
      }
    });
  });

  // 2. 處理 Excel 匯入的扁平模式
  document.querySelectorAll("#demand-inputs > .input-row").forEach(row => {
    const tubeInput = row.querySelector(".demand-tube");
    const type = tubeInput && tubeInput.value && tubeInput.value.trim() !== '' ? tubeInput.value.trim() : '未指定';
    const len = parseInt(row.querySelector(".demand-len").value);
    const qty = parseInt(row.querySelector(".demand-qty").value);
    if (!isNaN(len) && !isNaN(qty) && qty > 0) {
        demands.push({ len, qty, type });
    }
  });

  console.log("收集到的庫存:", stocks);
  console.log("收集到的需求:", demands);
  
  if (stocks.length === 0) {
    alert("請至少輸入一個庫存項目");
    return;
  }
  
  if (demands.length === 0) {
    alert("請至少輸入一個需求項目");
    return;
  }
  
  try {
    const results = simpleGrouping(stocks, demands);
    simpleRenderResults(results);
    
    // 保存結果並啟用匯出按鈕
    savedResults = results;
    document.getElementById("export-btn").disabled = false;

    console.log("計算完成");
  } catch (error) {
    console.error("計算錯誤:", error);
    alert("計算過程中發生錯誤: " + error.message);
  }
});

// 匯出按鈕事件
document.getElementById("export-btn").addEventListener("click", () => {
  if (savedResults) {
    exportToExcel(savedResults);
  } else {
    alert("沒有可匯出的計算結果。請先執行計算。");
  }
});

// 清除功能
document.getElementById("clear-btn").addEventListener("click", () => {
  // 清除庫存（除了第一個隱藏的模板）
  const stockInputs = document.getElementById("stock-inputs");
  const stockRows = stockInputs.querySelectorAll(".input-row:not([style*='display: none'])");
  stockRows.forEach(row => row.remove());

  // 清除所有需求
  document.getElementById("demand-inputs").innerHTML = "";
  
  // 清除結果
  document.getElementById("result").innerHTML = "";

  // 禁用匯出按鈕並重置結果
  document.getElementById("export-btn").disabled = true;
  savedResults = null;
  
  console.log("已清除所有數據");
});

console.log("簡化版本已載入");