function exportToExcel(results) {
  try {
    if (!results || results.length === 0) {
      alert("沒有可匯出的結果。");
      return;
    }

    const dataForSheet = [];
    // 添加標題行
    dataForSheet.push(['管材種類', '單支長度', '排版', '餘料', '使用總長度']);

    // 遍歷計算結果並轉換為適合工作表的格式
    results.forEach(result => {
      const stockType = result.stockType;
      const stockLength = result.stockLength;

      if (result.tubeResults) {
        Object.keys(result.tubeResults).forEach(tubeType => {
          const tubeData = result.tubeResults[tubeType];
          if (tubeData.groups) {
            tubeData.groups.forEach(group => {
              const cuts = group.cuts.join(' + ');
              const remainder = group.remainder;
              const used = group.used;
              dataForSheet.push([stockType, stockLength, cuts, remainder, used]);
            });
          }
        });
      }
    });

    // 如果只有標題行，說明沒有有效的計算結果可供匯出
    if (dataForSheet.length <= 1) {
      alert("沒有有效的計算結果可供匯出。");
      return;
    }

    // 使用 SheetJS 創建工作表和工作簿
    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "計算結果");

    // 產生帶有時間戳的檔案名稱
    const date = new Date();
    const filename = `管用料計算結果_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.xlsx`;

    // 觸發下載
    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error("匯出 Excel 時發生錯誤:", error);
    alert(`匯出失敗，發生錯誤： ${error.message}`);
  }
}
