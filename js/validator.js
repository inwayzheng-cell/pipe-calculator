// 驗證和錯誤處理模組
// 提供輸入驗證、計算結果驗證和錯誤處理功能

// 驗證器類
class Validator {
  // 驗證庫存數據
  static validateStocks(stocks) {
    const errors = [];
    
    if (!Array.isArray(stocks)) {
      errors.push('庫存數據必須是陣列');
      return { isValid: false, errors };
    }
    
    stocks.forEach((stock, index) => {
      if (!stock.type || typeof stock.type !== 'string') {
        errors.push(`庫存項目 ${index + 1}: 管材種類不能為空`);
      }
      
      if (!stock.length || stock.length <= 0) {
        errors.push(`庫存項目 ${index + 1}: 長度必須大於0`);
      }
      
      if (!stock.qty || stock.qty <= 0) {
        errors.push(`庫存項目 ${index + 1}: 數量必須大於0`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  // 驗證需求數據
  static validateDemands(demands) {
    const errors = [];
    
    if (!Array.isArray(demands)) {
      errors.push('需求數據必須是陣列');
      return { isValid: false, errors };
    }
    
    if (demands.length === 0) {
      errors.push('至少需要一個需求項目');
      return { isValid: false, errors };
    }
    
    demands.forEach((demand, index) => {
      if (!demand.type || typeof demand.type !== 'string') {
        errors.push(`需求項目 ${index + 1}: 管徑種類不能為空`);
      }
      
      if (!demand.len || demand.len <= 0) {
        errors.push(`需求項目 ${index + 1}: 長度必須大於0`);
      }
      
      if (!demand.qty || demand.qty <= 0) {
        errors.push(`需求項目 ${index + 1}: 數量必須大於0`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  // 驗證計算結果
  static validateResults(results, originalDemands) {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(results)) {
      errors.push('計算結果必須是陣列');
      return { isValid: false, errors, warnings };
    }
    
    // 檢查每個結果的結構
    results.forEach((result, index) => {
      if (!result.stockType) {
        errors.push(`結果 ${index + 1}: 缺少管材種類`);
      }
      
      if (!result.stockLength || result.stockLength <= 0) {
        errors.push(`結果 ${index + 1}: 庫存長度無效`);
      }
      
      if (!result.tubeResults) {
        errors.push(`結果 ${index + 1}: 缺少管徑結果`);
      }
    });
    
    // 檢查是否所有需求都被滿足
    const demandsByType = {};
    originalDemands.forEach(demand => {
      const key = demand.type || '未指定';
      if (!demandsByType[key]) {
        demandsByType[key] = [];
      }
      for (let i = 0; i < demand.qty; i++) {
        demandsByType[key].push(demand.len);
      }
    });
    
    results.forEach(result => {
      const stockType = result.stockType;
      if (result.tubeResults[stockType]) {
        const groups = result.tubeResults[stockType].groups || [];
        const processedItems = [];
        
        groups.forEach(group => {
          if (group.items) {
            processedItems.push(...group.items);
          }
        });
        
        // 檢查是否有未處理的需求
        if (demandsByType[stockType]) {
          const remaining = [...demandsByType[stockType]];
          processedItems.forEach(item => {
            const index = remaining.indexOf(item);
            if (index > -1) {
              remaining.splice(index, 1);
            }
          });
          
          if (remaining.length > 0) {
            warnings.push(`${stockType} 管徑有 ${remaining.length} 個需求未被處理: ${remaining.join(', ')}`);
          }
        }
      }
    });
    
    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings,
      hasWarnings: warnings.length > 0
    };
  }
  
  // 驗證組合是否有效
  static validateCombination(items, maxLength) {
    if (!Array.isArray(items)) {
      return { isValid: false, error: '項目必須是陣列' };
    }
    
    const totalLength = items.reduce((sum, item) => sum + item, 0);
    
    if (totalLength > maxLength) {
      return { 
        isValid: false, 
        error: `組合總長度 ${totalLength} 超過最大長度 ${maxLength}`,
        totalLength,
        maxLength
      };
    }
    
    return { isValid: true, totalLength, maxLength, waste: maxLength - totalLength };
  }
}

// 錯誤處理器類
class ErrorHandler {
  static logError(error, context = '') {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${context ? context + ': ' : ''}${error.message || error}`;
    console.error(message);
    
    // 可以擴展為發送到錯誤追蹤服務
    return message;
  }
  
  static logWarning(warning, context = '') {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] WARNING ${context ? context + ': ' : ''}${warning}`;
    console.warn(message);
    return message;
  }
  
  static handleValidationErrors(validationResult, context = '') {
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => {
        this.logError(error, context);
      });
    }
    
    if (validationResult.warnings) {
      validationResult.warnings.forEach(warning => {
        this.logWarning(warning, context);
      });
    }
    
    return validationResult;
  }
  
  static createUserFriendlyError(error) {
    const errorMap = {
      'TypeError': '數據類型錯誤',
      'ReferenceError': '引用錯誤',
      'RangeError': '數值範圍錯誤'
    };
    
    const friendlyType = errorMap[error.constructor.name] || '未知錯誤';
    return `${friendlyType}: ${error.message}`;
  }
}

// 將模組暴露到全域
window.Validator = {
  validateStocks: Validator.validateStocks,
  validateDemands: Validator.validateDemands,
  validateResults: Validator.validateResults,
  Validator,
  ErrorHandler
};

// 也可以直接暴露類別
window.ValidatorClass = Validator;
window.ErrorHandler = ErrorHandler;