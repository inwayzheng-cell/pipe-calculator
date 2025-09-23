// 計算引擎模組 - 負責核心計算邏輯

// 獲取調試工具 - 延遲初始化
function getDebugTools() {
  return {
    logger: window.DebugTools?.logger,
    monitor: window.DebugTools?.monitor
  };
}

/**
 * 找到最優化的組合，使剩餘長度最小
 * @param {number[]} demands - 需求長度陣列
 * @param {number} maxLength - 最大可用長度
 * @returns {Object} 包含選中項目和使用長度的物件
 */
function findOptimalCombination(demands, maxLength) {
  const { logger: debugLogger, monitor: performanceMonitor } = getDebugTools();
  
  // 開始性能監控
  performanceMonitor?.startCalculation();
  debugLogger?.log(`🎯 開始優化組合計算 - 最大長度: ${maxLength}`, 'info');
  debugLogger?.logData('輸入需求', demands);
  if (demands.length === 0) {
    debugLogger?.log('需求列表為空，返回空組合', 'warning');
    performanceMonitor?.endCalculation();
    return { items: [], used: 0 };
  }

  // 過濾出可以放入的需求
  const validDemands = demands.filter(d => d <= maxLength);
  if (validDemands.length === 0) {
    debugLogger?.log(`沒有需求項目能放入長度 ${maxLength} 的庫存中`, 'warning');
    performanceMonitor?.endCalculation();
    return { items: [], used: 0 };
  }
  
  debugLogger?.log(`有效需求數量: ${validDemands.length}/${demands.length}`, 'info');
  
  // 使用動態規劃的背包問題解法
  const n = validDemands.length;
  const dp = Array(n + 1).fill(null).map(() => Array(maxLength + 1).fill(0));
  const keep = Array(n + 1).fill(null).map(() => Array(maxLength + 1).fill(false));
  
  debugLogger?.log(`開始DP計算 - 項目數: ${n}, 最大容量: ${maxLength}`, 'info');
  
  // 填充DP表
  for (let i = 1; i <= n; i++) {
    const currentLen = validDemands[i - 1];
    for (let w = 0; w <= maxLength; w++) {
      // 不選擇當前項目
      dp[i][w] = dp[i - 1][w];
      
      // 如果可以選擇當前項目且選擇後更優
      if (w >= currentLen && dp[i - 1][w - currentLen] + currentLen > dp[i][w]) {
        dp[i][w] = dp[i - 1][w - currentLen] + currentLen;
        keep[i][w] = true;
      }
    }
  }
  
  // 回溯找到最優解的項目
  const selectedItems = [];
  let w = maxLength;
  for (let i = n; i > 0 && w > 0; i--) {
    if (keep[i][w]) {
      selectedItems.push(validDemands[i - 1]);
      w -= validDemands[i - 1];
    }
  }
  
  const totalUsed = selectedItems.reduce((sum, len) => sum + len, 0);
  const wasteLength = maxLength - totalUsed;
  
  debugLogger?.log(`DP計算完成 - 選中項目: ${selectedItems.length}, 使用長度: ${totalUsed}, 浪費: ${wasteLength}`, 'success');
  debugLogger?.logData('選中的項目', selectedItems);
  performanceMonitor?.endCalculation();
  
  return {
    items: selectedItems,
    used: totalUsed
  };
}

/**
 * 處理單一長度的需求分組
 * @param {number[]} demands - 剩餘需求
 * @param {number} stockLength - 庫存長度
 * @param {boolean} isDefault - 是否為預設長度
 * @returns {Array} 分組結果
 */
function processStockLength(demands, stockLength, isDefault) {
  let groups = [];
  
  if (isDefault) {
    // 預設長度處理所有剩餘需求
    if (demands.length > 0) {
      let currentGroup = { items: [], used: 0 };
      
      demands.forEach(len => {
        if (currentGroup.used + len <= stockLength) {
          currentGroup.items.push(len);
          currentGroup.used += len;
        } else {
          if (currentGroup.items.length > 0) {
            groups.push(currentGroup);
          }
          currentGroup = { items: [len], used: len };
        }
      });
      
      if (currentGroup.items.length > 0) {
        groups.push(currentGroup);
      }
    }
  } else {
    // 設定長度使用最優化演算法處理需求
    if (demands.length > 0) {
      const bestCombination = findOptimalCombination(demands, stockLength);
      
      if (bestCombination.items.length > 0) {
        groups.push(bestCombination);
      }
    }
  }
  
  return groups;
}

// 導出函數供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findOptimalCombination,
    processStockLength
  };
} else {
  // 瀏覽器環境下導出到window對象
  window.Calculator = {
    findOptimalCombination,
    processStockLength
  };
}