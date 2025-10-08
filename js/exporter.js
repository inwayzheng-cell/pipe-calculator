function exportToExcel(results, demands) {
  try {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // --- 樣式定義 ---
    const headerStyle = { 
      font: { bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } } // 淺藍色
    };
    const titleStyle = { 
      font: { bold: true },
      fill: { fgColor: { rgb: "F2F2F2" } } // 淺灰色
    };

    // --- 1. 原始需求區塊 ---
    ws_data.push([ { v: '--- 用料需求 ---', s: titleStyle } ]);
    const demandHeaders = ['管徑/說明', '長度', '數量'];
    ws_data.push(demandHeaders.map(h => ({ v: h, s: headerStyle })) );

    if (demands && demands.length > 0) {
      demands.forEach(d => {
        ws_data.push([d.type, d.len, d.qty]);
      });
    }

    // --- 2. 分隔線 ---
    ws_data.push([]); // 空白行

    // --- 3. 計算結果區塊 ---
    ws_data.push([ { v: '--- 計算結果 ---', s: titleStyle } ]);
    const resultHeaders = ['管材種類', '單支長度', '排版方式', '餘料', '使用總長度'];
    ws_data.push(resultHeaders.map(h => ({ v: h, s: headerStyle })) );

    if (results && results.length > 0) {
      results.forEach(result => {
        const stockType = result.stockType;
        const stockLength = result.stockLength;
        if (result.tubeResults && result.tubeResults[stockType] && result.tubeResults[stockType].groups) {
          result.tubeResults[stockType].groups.forEach(group => {
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

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // --- 4. 設定欄寬 ---
    // 找出最寬的欄位來設定寬度
    const colWidths = ws_data.reduce((acc, row) => {
        row.forEach((cell, col) => {
            const content = cell.v ? String(cell.v) : (cell ? String(cell) : '');
            const len = content.match(/[\u4e00-\u9fa5]/g)?.length || 0; // 中文字元算2個寬度
            const width = content.length + len;
            if (!acc[col] || acc[col] < width) {
                acc[col] = width;
            }
        });
        return acc;
    }, []);

    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 })); // wch 是字元寬度

    XLSX.utils.book_append_sheet(wb, ws, '計算清單');

    // --- 5. 產生檔案 ---
    const date = new Date();
    const filename = `管用料計算結果_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error("匯出 Excel 時發生錯誤:", error);
    alert(`匯出失敗，發生錯誤： ${error.message}`);
  }
}