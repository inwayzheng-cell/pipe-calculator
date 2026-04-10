/**
 * 匯出 Excel 模組 (增加總數加總功能)
 */
function exportToExcel(results, demands) {
  try {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // --- 樣式與標題 ---
    const headerStyle = { font: { bold: true } };
    const titleStyle = { font: { bold: true } };

    // 1. 原始需求區塊
    ws_data.push(['--- 用料需求 ---']);
    ws_data.push(['管徑/說明', '長度', '數量']);
    if (demands && demands.length > 0) {
      demands.forEach(d => {
        ws_data.push([d.type, d.len, d.qty]);
      });
    }

    ws_data.push([]); // 空白行

    // 2. 詳細計算結果區塊
    ws_data.push(['--- 裁切明細 ---']);
    ws_data.push(['管材種類', '母管長度', '裁切組合', '餘料', '使用總長度']);

    // 用來儲存各規格總數的物件
    const summaryCount = {};

    if (results && results.length > 0) {
      results.forEach(result => {
        const stockType = result.stockType;
        const tubeData = result.tubeResults[stockType];

        if (tubeData && tubeData.groups) {
          // 累加該規格的總支數
          if (!summaryCount[stockType]) {
            summaryCount[stockType] = { count: 0, length: result.stockLength };
          }
          summaryCount[stockType].count += tubeData.groups.length;

          // 填入明細行
          tubeData.groups.forEach(group => {
            ws_data.push([
              stockType,
              group.stockLength,
              group.cuts.join(' + '),
              group.remainder,
              group.used
            ]);
          });
        }
      });
    }

    ws_data.push([]); // 空白行

    // 3. 新增：各規格總量匯總 (總數統計)
    ws_data.push(['--- 備料總計 (採購清單) ---']);
    ws_data.push(['管材種類', '單支規格', '需準備總支數']);
    
    Object.keys(summaryCount).forEach(type => {
      ws_data.push([
        type, 
        summaryCount[type].length, 
        summaryCount[type].count + " 支"
      ]);
    });

    // --- 產生 Excel 表格 ---
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // 設定自動欄寬
    const colWidths = ws_data.reduce((acc, row) => {
      row.forEach((cell, col) => {
        const content = String(cell || '');
        const len = content.match(/[\u4e00-\u9fa5]/g)?.length || 0;
        const width = content.length + len;
        if (!acc[col] || acc[col] < width) acc[col] = width;
      });
      return acc;
    }, []);
    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 }));

    XLSX.utils.book_append_sheet(wb, ws, '裁切計畫');

    // 產生檔案名稱並下載
    const date = new Date();
    const filename = `管用料清單_${date.getMonth()+1}${date.getDate()}_${date.getHours()}${date.getMinutes()}.xlsx`;
    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error("匯出 Excel 發生錯誤:", error);
    alert("匯出失敗，請檢查主控台訊息。");
  }
}