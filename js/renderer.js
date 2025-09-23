// 負責畫面輸出
function renderResults(results) {
  const container = document.getElementById("result");
  container.innerHTML = "";

  // 按母管種類分組顯示結果
  const resultsByType = {};
  results.forEach(r => {
    if (!resultsByType[r.stockType]) {
      resultsByType[r.stockType] = [];
    }
    resultsByType[r.stockType].push(r);
  });

  // 遍歷每種單支最大長度類型
  Object.keys(resultsByType).forEach(stockType => {
    const typeResults = resultsByType[stockType];
    
    // 創建單支最大長度類型區塊
    const typeDiv = document.createElement("div");
    typeDiv.className = "type-result";
    typeDiv.innerHTML = `<h2>管徑種類：${stockType}</h2>`;
    
    // 遍歷該類型的每個單支最大長度
    typeResults.forEach((r, idx) => {
      const stockDiv = document.createElement("div");
      // 判斷是否為預設長度5850
      const isDefault = r.stockLength === 5850;
      stockDiv.className = isDefault ? "stock-result default-stock" : "stock-result";
      stockDiv.innerHTML = `<h3>單支最大長度 ${idx + 1}（長度：${r.stockLength}）</h3>`;

      // 遍歷每種管徑的結果
      Object.keys(r.tubeResults).forEach(tube => {
        const tubeData = r.tubeResults[tube];
        const tubeDiv = document.createElement("div");
        tubeDiv.className = "tube-result";
        
        // 顯示管徑和總組數
        tubeDiv.innerHTML = `
          <h4>管徑：${tube} (共需 ${tubeData.totalGroups} 組)</h4>
        `;
        
        // 顯示每個組別的詳細信息
        tubeData.groups.forEach((g, i) => {
          const groupDiv = document.createElement("div");
          groupDiv.className = "group";
          groupDiv.innerHTML = `
            <strong>組別 ${i + 1}</strong>： ${g.items.join(", ")} (已用長度：${g.used} / 剩餘：${r.stockLength - g.used})
          `;
          tubeDiv.appendChild(groupDiv);
        });
        
        stockDiv.appendChild(tubeDiv);
      });

      typeDiv.appendChild(stockDiv);
    });
    
    container.appendChild(typeDiv);
  });
}

// 導出到全局
window.renderResults = renderResults;
