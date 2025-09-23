// 配置管理模組
// 統一管理系統配置和常數

class ConfigManager {
  constructor() {
    this.config = {
      // 預設值配置
      defaults: {
        stockLength: 5850,
        stockType: '未指定',
        demandType: '未指定',
        clampSize: 150, // 夾料尺寸
        minStockLength: 100,
        maxStockLength: 10000,
        minDemandLength: 10,
        maxDemandLength: 8000
      },
      
      // 計算配置
      calculation: {
        enableOptimization: true,
        maxCombinations: 1000,
        optimizationTimeout: 5000, // 毫秒
        wasteThreshold: 0.1, // 10% 浪費閾值
        efficiencyTarget: 0.85 // 85% 效率目標
      },
      
      // 顯示配置
      display: {
        showDefaultLengthResults: false,
        showWastePercentage: true,
        showEfficiency: true,
        decimalPlaces: 1,
        groupResultsLimit: 50
      },
      
      // 驗證配置
      validation: {
        strictMode: false,
        allowEmptyType: true,
        allowZeroQuantity: false,
        maxInputLength: 100
      },
      
      // 調試配置
      debug: {
        enabled: false,
        logLevel: 'info', // 'error', 'warning', 'info', 'debug'
        showPerformanceMetrics: false,
        exportLogsAutomatically: false
      },
      
      // UI配置
      ui: {
        theme: 'default',
        language: 'zh-TW',
        showTooltips: true,
        animationDuration: 300
      }
    };
    
    // 載入本地儲存的配置
    this.loadFromStorage();
  }
  
  // 獲取配置值
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  // 設置配置值
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    this.saveToStorage();
    
    // 觸發配置變更事件
    this.notifyConfigChange(path, value);
  }
  
  // 獲取所有配置
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }
  
  // 重置配置
  reset(section = null) {
    if (section) {
      // 重置特定區段
      if (this.defaultConfig[section]) {
        this.config[section] = JSON.parse(JSON.stringify(this.defaultConfig[section]));
      }
    } else {
      // 重置所有配置
      this.config = JSON.parse(JSON.stringify(this.defaultConfig));
    }
    
    this.saveToStorage();
    this.notifyConfigChange('reset', section);
  }
  
  // 從本地儲存載入配置
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('pipeCalculatorConfig');
      if (stored) {
        const storedConfig = JSON.parse(stored);
        this.mergeConfig(storedConfig);
      }
    } catch (error) {
      console.warn('載入配置失敗:', error);
    }
  }
  
  // 儲存配置到本地儲存
  saveToStorage() {
    try {
      localStorage.setItem('pipeCalculatorConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('儲存配置失敗:', error);
    }
  }
  
  // 合併配置
  mergeConfig(newConfig) {
    this.config = this.deepMerge(this.config, newConfig);
  }
  
  // 深度合併物件
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  // 配置變更通知
  notifyConfigChange(path, value) {
    const event = new CustomEvent('configChanged', {
      detail: { path, value, config: this.getAll() }
    });
    window.dispatchEvent(event);
  }
  
  // 驗證配置值
  validateConfig() {
    const errors = [];
    
    // 驗證預設值
    if (this.get('defaults.stockLength') <= 0) {
      errors.push('預設庫存長度必須大於0');
    }
    
    if (this.get('defaults.clampSize') < 0) {
      errors.push('夾料尺寸不能為負數');
    }
    
    // 驗證計算配置
    if (this.get('calculation.maxCombinations') <= 0) {
      errors.push('最大組合數必須大於0');
    }
    
    if (this.get('calculation.optimizationTimeout') <= 0) {
      errors.push('優化超時時間必須大於0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // 導出配置
  exportConfig() {
    const configData = {
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      config: this.getAll()
    };
    
    const dataStr = JSON.stringify(configData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipe-calculator-config-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  // 導入配置
  importConfig(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const configData = JSON.parse(e.target.result);
          
          if (configData.config) {
            this.mergeConfig(configData.config);
            this.saveToStorage();
            resolve(configData);
          } else {
            reject(new Error('無效的配置文件格式'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('讀取文件失敗'));
      reader.readAsText(file);
    });
  }
}

// 常數定義
const CONSTANTS = {
  // 管材類型
  PIPE_TYPES: {
    UNSPECIFIED: '未指定',
    SQUARE_25: '方25',
    SQUARE_30: '方30',
    ROUND: '圓管',
    RECTANGULAR: '矩形管'
  },
  
  // 計算模式
  CALCULATION_MODES: {
    OPTIMAL: 'optimal',
    GREEDY: 'greedy',
    FIRST_FIT: 'first_fit'
  },
  
  // 結果狀態
  RESULT_STATUS: {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    PARTIAL: 'partial'
  },
  
  // 事件類型
  EVENTS: {
    CONFIG_CHANGED: 'configChanged',
    CALCULATION_START: 'calculationStart',
    CALCULATION_END: 'calculationEnd',
    VALIDATION_ERROR: 'validationError'
  }
};

// 創建全域配置管理器實例
const configManager = new ConfigManager();

// 暴露到全域
window.Config = {
  manager: configManager,
  constants: CONSTANTS,
  ConfigManager
};

// 便捷方法
window.getConfig = (path, defaultValue) => configManager.get(path, defaultValue);
window.setConfig = (path, value) => configManager.set(path, value);
window.exportConfig = () => configManager.exportConfig();

// 初始化時驗證配置
const validation = configManager.validateConfig();
if (!validation.isValid) {
  console.warn('配置驗證失敗:', validation.errors);
}