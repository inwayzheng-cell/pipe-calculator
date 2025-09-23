// 數據處理模組
// 負責數據分類、預處理和轉換

// 獲取調試和驗證工具 - 延遲初始化
function getTools() {
  return {
    debugLogger: window.DebugTools?.logger,
    validator: window.Validator,
    errorHandler: window.ErrorHandler
  };
}

/**
 * 按管徑類型分類需求
 * @param {Array} demands - 需求陣列
 * @returns {Object} 按管徑分類的需求物件
 */
function classifyDemandsByTube(demands) {
  const { debugLogger, validator, errorHandler } = getTools();
  
  debugLogger?.log('開始分類需求數據', 'info');
  
  // 驗證輸入數據
  if (validator && validator.validateDemands) {
    const validation = validator.validateDemands(demands);
    if (!validation.isValid) {
      errorHandler?.handleValidationErrors(validation, '需求數據驗證');
      return {};
    }
  }
  
  debugLogger?.logData('原始需求數據', demands);
  const demandsByTube = {};
  
  demands.forEach(demand => {
    const tubeType = demand.type || '未指定';
    if (!demandsByTube[tubeType]) {
      demandsByTube[tubeType] = [];
    }
    demandsByTube[tubeType].push(demand);
  });
  
  // 合併所有未指定或空白的管徑類型
  const unspecifiedKeys = Object.keys(demandsByTube).filter(key => 
    key === '未指定' || key === '' || key.trim() === ''
  );
  
  if (unspecifiedKeys.length > 1) {
    const allUnspecified = [];
    unspecifiedKeys.forEach(key => {
      allUnspecified.push(...demandsByTube[key]);
      if (key !== '未指定') {
        delete demandsByTube[key];
      }
    });
    demandsByTube['未指定'] = allUnspecified;
  }
  
  debugLogger?.log(`需求分類完成 - 共 ${Object.keys(demandsByTube).length} 種管徑類型`, 'success');
  Object.keys(demandsByTube).forEach(type => {
    const count = demandsByTube[type].reduce((sum, d) => sum + d.qty, 0);
    debugLogger?.log(`${type}: ${demandsByTube[type].length} 項需求, 總數量: ${count}`, 'info');
  });
  
  return demandsByTube;
}

/**
 * 按類型分類庫存，合併未指定類型並展開數量
 * @param {Array} stocks - 庫存陣列
 * @returns {Object} 按類型分類的庫存物件
 */
function classifyStocksByType(stocks) {
  const { debugLogger } = getTools();
  
  debugLogger?.log('開始分類庫存數據', 'info');
  
  // 驗證輸入數據
  if (validator && validator.validateStocks) {
    const validation = validator.validateStocks(stocks);
    if (!validation.isValid) {
      errorHandler?.handleValidationErrors(validation, '庫存數據驗證');
      return {};
    }
  }
  
  debugLogger?.logData('原始庫存數據', stocks);
  const stocksByType = {};
  
  stocks.forEach(stock => {
    const stockType = stock.type || '未指定';
    if (!stocksByType[stockType]) {
      stocksByType[stockType] = [];
    }
    
    // 根據數量展開庫存項目
    for (let i = 0; i < stock.qty; i++) {
      stocksByType[stockType].push({
        length: stock.length,
        isDefault: false
      });
    }
  });
  
  // 合併所有未指定或空白的庫存類型
  const unspecifiedKeys = Object.keys(stocksByType).filter(key => 
    key === '未指定' || key === '' || key.trim() === ''
  );
  
  if (unspecifiedKeys.length > 1) {
    const allUnspecified = [];
    unspecifiedKeys.forEach(key => {
      allUnspecified.push(...stocksByType[key]);
      if (key !== '未指定') {
        delete stocksByType[key];
      }
    });
    stocksByType['未指定'] = allUnspecified;
  }
  
  debugLogger?.log(`庫存分類完成 - 共 ${Object.keys(stocksByType).length} 種類型`, 'success');
  Object.keys(stocksByType).forEach(type => {
    debugLogger?.log(`${type}: ${stocksByType[type].length} 個庫存項目`, 'info');
  });
  
  return stocksByType;
}

/**
 * 根據需求的管徑類型添加預設庫存長度
 * @param {Object} demandsByTube - 按管徑分類的需求
 * @param {Object} stocksByType - 按類型分類的庫存
 * @returns {Object} 更新後的庫存物件
 */
function addDefaultStockLengths(demandsByTube, stocksByType) {
  const { debugLogger } = getTools();
  
  debugLogger?.log('開始添加預設庫存長度', 'info');
  
  Object.keys(demandsByTube).forEach(tubeType => {
    if (!stocksByType[tubeType]) {
      stocksByType[tubeType] = [];
    }
    
    // 添加預設5850長度
    stocksByType[tubeType].push({
      length: 5850,
      isDefault: true
    });
    
    debugLogger?.log(`為 ${tubeType} 添加預設長度 5850`, 'info');
  });
  
  return stocksByType;
}

/**
 * 將需求展開成個別長度的陣列並排序
 * @param {Array} demands - 需求陣列
 * @returns {Array} 展開並排序後的需求長度陣列
 */
function expandDemands(demands) {
  const allDemands = [];
  demands.forEach(d => {
    for (let i = 0; i < d.qty; i++) {
      allDemands.push(d.len);
    }
  });
  
  // 從大到小排序，優先處理較大的需求
  allDemands.sort((a, b) => b - a);
  
  const { debugLogger } = getTools();
  debugLogger?.log(`需求展開完成 - 總計 ${allDemands.length} 個項目`, 'info');
  return allDemands;
}

/**
 * 排序庫存項目，非預設長度優先，然後按長度從大到小
 * @param {Array} stockItems - 庫存項目陣列
 * @returns {Array} 排序後的庫存項目陣列
 */
function sortStockItems(stockItems) {
  return stockItems.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return 1;
    if (!a.isDefault && b.isDefault) return -1;
    return b.length - a.length;
  });
}

// 暴露到全域
window.DataProcessor = {
  classifyDemandsByTube,
  classifyStocksByType,
  addDefaultStockLengths,
  expandDemands,
  sortStockItems
};

// Node.js 兼容性
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    classifyDemandsByTube,
    classifyStocksByType,
    addDefaultStockLengths,
    expandDemands,
    sortStockItems
  };
}