// 主要分組模組 - 整合所有計算邏輯
// 依賴其他模組：calculator.js, dataProcessor.js, resultProcessor.js

// 使用命名空間方式避免變量衝突
function getModules() {
  return {
    calculator: window.Calculator || {},
    dataProcessor: window.DataProcessor || {},
    resultProcessor: window.ResultProcessor || {}
  };
}

// 分組演算法
function runGrouping(stocks, demands) {
  const { calculator, dataProcessor, resultProcessor } = getModules();
  let results = [];

  // 使用數據處理模組進行分類
  const demandsByTube = dataProcessor.classifyDemandsByTube?.(demands) || {};
  let stocksByType = dataProcessor.classifyStocksByType?.(stocks) || {};
  
  // 為每種管徑添加預設長度
  stocksByType = dataProcessor.addDefaultStockLengths?.(demandsByTube, stocksByType) || stocksByType;

  // 處理每種單支最大長度類型
  Object.keys(stocksByType).forEach(stockType => {
    const stockItems = stocksByType[stockType];
    
    // 處理對應管徑的需求
    if (demandsByTube[stockType]) {
      // 使用數據處理模組展開和排序需求
      let remainingDemands = dataProcessor.expandDemands?.(demandsByTube[stockType]) || [];
      
      // 合併所有同類型的分組結果
      let allGroups = [];
      
      // 使用數據處理模組排序庫存項目
      const sortedStockItems = dataProcessor.sortStockItems?.([...stockItems]) || stockItems;
      
      // 處理每個設定的長度
      sortedStockItems.forEach(stockItem => {
        const stockLength = stockItem.length;
        const isDefault = stockItem.isDefault;
        
        // 使用計算引擎處理單一長度
        const groups = calculator.processStockLength?.(remainingDemands, stockLength, isDefault) || [];
        
        // 從剩餘需求中移除已使用的項目
        groups.forEach(group => {
          if (group.items && group.items.length > 0) {
            remainingDemands = resultProcessor.removeUsedItems?.(remainingDemands, group.items) || remainingDemands;
          }
        });
        
        // 將這個長度的分組添加到總分組中
        allGroups.push(...groups);
        
        // 如果是預設長度，清空剩餘需求
        if (isDefault) {
          remainingDemands = [];
        }
      });
      
      // 只添加一個結果，包含所有分組
      if (allGroups.length > 0) {
        // 使用結果處理模組創建結果
        const displayLength = resultProcessor.inferDisplayLength?.(allGroups, stockItems) || 5850;
        const result = resultProcessor.createResult?.(stockType, displayLength, allGroups) || {};
        results.push(result);
      }
    } else {
      // 沒有對應的需求，使用結果處理模組創建空結果
      const result = resultProcessor.createEmptyResult?.(stockType) || {};
      results.push(result);
    }
  });

  return results;
}

// 導出到全局
window.runGrouping = runGrouping;
