// 結果處理模組 - 負責處理計算結果和顯示邏輯

/**
 * 從分組結果中推斷實際使用的長度
 * @param {Array} allGroups - 所有分組結果
 * @param {Array} stockItems - 庫存項目
 * @returns {number} 實際使用的顯示長度
 */
function inferDisplayLength(allGroups, stockItems) {
  const usedLengths = new Set();
  
  allGroups.forEach(group => {
    const totalUsed = group.used;
    if (totalUsed > 0) {
      // 找到匹配的stockItem長度
      const matchingStock = stockItems.find(item => 
        totalUsed <= item.length && (item.length - totalUsed) >= 0
      );
      if (matchingStock) {
        usedLengths.add(matchingStock.length);
      }
    }
  });
  
  // 優先顯示非預設長度，如果沒有則顯示5850
  return Array.from(usedLengths).find(len => len !== 5850) || 5850;
}

/**
 * 創建結果物件
 * @param {string} stockType - 庫存類型
 * @param {number} displayLength - 顯示長度
 * @param {Array} allGroups - 所有分組
 * @returns {Object} 結果物件
 */
function createResult(stockType, displayLength, allGroups) {
  const tubeResults = {};
  tubeResults[stockType] = { 
    groups: allGroups, 
    totalGroups: allGroups.length 
  };
  
  return {
    stockType,
    stockLength: displayLength,
    tubeResults
  };
}

/**
 * 創建空結果物件（當沒有對應需求時）
 * @param {string} stockType - 庫存類型
 * @param {number} stockLength - 庫存長度
 * @returns {Object} 空結果物件
 */
function createEmptyResult(stockType, stockLength) {
  return {
    stockType,
    stockLength,
    tubeResults: {}
  };
}

/**
 * 從剩餘需求中移除已使用的項目
 * @param {Array} remainingDemands - 剩餘需求陣列
 * @param {Array} usedItems - 已使用項目陣列
 * @returns {Array} 更新後的剩餘需求
 */
function removeUsedItems(remainingDemands, usedItems) {
  const updatedDemands = [...remainingDemands];
  
  usedItems.forEach(usedLen => {
    const index = updatedDemands.indexOf(usedLen);
    if (index > -1) {
      updatedDemands.splice(index, 1);
    }
  });
  
  return updatedDemands;
}

/**
 * 驗證計算結果的完整性
 * @param {Array} results - 計算結果陣列
 * @returns {Object} 驗證結果
 */
function validateResults(results) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  results.forEach((result, index) => {
    // 檢查必要欄位
    if (!result.stockType) {
      validation.errors.push(`結果 ${index + 1}: 缺少庫存類型`);
      validation.isValid = false;
    }
    
    if (!result.stockLength || result.stockLength <= 0) {
      validation.errors.push(`結果 ${index + 1}: 庫存長度無效`);
      validation.isValid = false;
    }
    
    // 檢查分組結果
    if (result.tubeResults) {
      Object.keys(result.tubeResults).forEach(tubeType => {
        const tubeResult = result.tubeResults[tubeType];
        if (tubeResult.groups && tubeResult.groups.length === 0) {
          validation.warnings.push(`${tubeType}: 沒有有效的分組結果`);
        }
      });
    }
  });
  
  return validation;
}

// 導出函數供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    inferDisplayLength,
    createResult,
    createEmptyResult,
    removeUsedItems,
    validateResults
  };
} else {
  // 瀏覽器環境下導出到window對象
  window.ResultProcessor = {
    inferDisplayLength,
    createResult,
    createEmptyResult,
    removeUsedItems,
    validateResults
  };
}