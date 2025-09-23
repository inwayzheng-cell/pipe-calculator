// 調試工具模組
// 提供詳細的計算過程日誌和性能監控功能

class DebugLogger {
  constructor() {
    this.logs = [];
    this.isEnabled = false;
    this.startTime = null;
    this.stepTimes = [];
  }
  
  // 啟用/禁用調試
  enable() {
    this.isEnabled = true;
    console.log('🔧 調試模式已啟用');
  }
  
  disable() {
    this.isEnabled = false;
    console.log('🔧 調試模式已禁用');
  }
  
  // 開始計時
  startTiming(label = '計算') {
    if (!this.isEnabled) return;
    
    this.startTime = performance.now();
    this.stepTimes = [];
    this.log(`⏱️ 開始 ${label}`, 'timing');
  }
  
  // 記錄步驟時間
  stepTiming(stepName) {
    if (!this.isEnabled || !this.startTime) return;
    
    const currentTime = performance.now();
    const stepTime = currentTime - this.startTime;
    this.stepTimes.push({ step: stepName, time: stepTime });
    this.log(`⏱️ ${stepName}: ${stepTime.toFixed(2)}ms`, 'timing');
  }
  
  // 結束計時
  endTiming(label = '計算') {
    if (!this.isEnabled || !this.startTime) return;
    
    const totalTime = performance.now() - this.startTime;
    this.log(`⏱️ ${label} 完成，總時間: ${totalTime.toFixed(2)}ms`, 'timing');
    
    // 顯示詳細步驟時間
    if (this.stepTimes.length > 0) {
      console.table(this.stepTimes);
    }
    
    this.startTime = null;
    return totalTime;
  }
  
  // 記錄日誌
  log(message, type = 'info', data = null) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // 根據類型使用不同的控制台方法
    switch (type) {
      case 'error':
        console.error(`❌ [${timestamp}] ${message}`, data || '');
        break;
      case 'warning':
        console.warn(`⚠️ [${timestamp}] ${message}`, data || '');
        break;
      case 'success':
        console.log(`✅ [${timestamp}] ${message}`, data || '');
        break;
      case 'timing':
        console.log(`⏱️ [${timestamp}] ${message}`, data || '');
        break;
      case 'data':
        console.log(`📊 [${timestamp}] ${message}`);
        if (data) console.table(data);
        break;
      default:
        console.log(`ℹ️ [${timestamp}] ${message}`, data || '');
    }
  }
  
  // 記錄數據結構
  logData(label, data) {
    if (!this.isEnabled) return;
    
    this.log(`數據結構: ${label}`, 'data', data);
  }
  
  // 記錄計算步驟
  logCalculationStep(stepName, input, output, details = {}) {
    if (!this.isEnabled) return;
    
    const stepData = {
      步驟: stepName,
      輸入: input,
      輸出: output,
      ...details
    };
    
    this.log(`計算步驟: ${stepName}`, 'info');
    console.table(stepData);
  }
  
  // 記錄組合優化過程
  logOptimization(demands, stockLength, combinations, bestCombination) {
    if (!this.isEnabled) return;
    
    this.log(`🎯 優化組合 - 庫存長度: ${stockLength}`, 'info');
    this.logData('需求項目', demands);
    
    if (combinations && combinations.length > 0) {
      this.log(`🔍 找到 ${combinations.length} 個可能組合`, 'info');
      combinations.slice(0, 5).forEach((combo, index) => {
        console.log(`組合 ${index + 1}:`, combo.items, `總長: ${combo.used}, 浪費: ${stockLength - combo.used}`);
      });
    }
    
    if (bestCombination) {
      this.log(`🏆 最佳組合`, 'success');
      console.table({
        項目: bestCombination.items.join(', '),
        總長度: bestCombination.used,
        庫存長度: stockLength,
        浪費: stockLength - bestCombination.used,
        效率: `${((bestCombination.used / stockLength) * 100).toFixed(1)}%`
      });
    }
  }
  
  // 記錄分組結果
  logGroupingResult(stockType, groups, totalDemands) {
    if (!this.isEnabled) return;
    
    this.log(`📋 ${stockType} 分組結果`, 'success');
    
    const summary = {
      管徑類型: stockType,
      總需求數: totalDemands,
      分組數量: groups.length,
      總使用長度: groups.reduce((sum, g) => sum + g.used, 0),
      平均效率: groups.length > 0 ? 
        `${(groups.reduce((sum, g) => sum + (g.used / (g.stockLength || 5850)), 0) / groups.length * 100).toFixed(1)}%` : '0%'
    };
    
    console.table(summary);
    
    // 顯示每個分組的詳細信息
    groups.forEach((group, index) => {
      const efficiency = group.stockLength ? (group.used / group.stockLength * 100).toFixed(1) : 0;
      console.log(`分組 ${index + 1}: [${group.items.join(', ')}] 使用: ${group.used}, 效率: ${efficiency}%`);
    });
  }
  
  // 獲取所有日誌
  getLogs(type = null) {
    if (type) {
      return this.logs.filter(log => log.type === type);
    }
    return [...this.logs];
  }
  
  // 清除日誌
  clearLogs() {
    this.logs = [];
    console.log('🧹 調試日誌已清除');
  }
  
  // 導出日誌
  exportLogs() {
    const logData = {
      exportTime: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
    
    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.log('📁 調試日誌已導出', 'success');
  }
  
  // 生成性能報告
  generatePerformanceReport() {
    if (!this.isEnabled) return null;
    
    const timingLogs = this.getLogs('timing');
    const errorLogs = this.getLogs('error');
    const warningLogs = this.getLogs('warning');
    
    const report = {
      總日誌數: this.logs.length,
      計時記錄: timingLogs.length,
      錯誤數: errorLogs.length,
      警告數: warningLogs.length,
      最近錯誤: errorLogs.slice(-3).map(log => log.message),
      最近警告: warningLogs.slice(-3).map(log => log.message)
    };
    
    console.table(report);
    return report;
  }
}

// 性能監控器
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      calculationCount: 0,
      totalCalculationTime: 0,
      averageCalculationTime: 0,
      peakMemoryUsage: 0,
      lastCalculationTime: 0
    };
  }
  
  // 開始監控計算
  startCalculation() {
    this.startTime = performance.now();
    this.startMemory = this.getMemoryUsage();
  }
  
  // 結束監控計算
  endCalculation() {
    if (!this.startTime) return;
    
    const duration = performance.now() - this.startTime;
    const memoryUsage = this.getMemoryUsage();
    
    this.metrics.calculationCount++;
    this.metrics.totalCalculationTime += duration;
    this.metrics.averageCalculationTime = this.metrics.totalCalculationTime / this.metrics.calculationCount;
    this.metrics.lastCalculationTime = duration;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memoryUsage);
    
    this.startTime = null;
    return duration;
  }
  
  // 獲取記憶體使用量
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
  
  // 獲取性能指標
  getMetrics() {
    return { ...this.metrics };
  }
  
  // 重置指標
  resetMetrics() {
    this.metrics = {
      calculationCount: 0,
      totalCalculationTime: 0,
      averageCalculationTime: 0,
      peakMemoryUsage: 0,
      lastCalculationTime: 0
    };
  }
}

// 創建全域實例
const debugLogger = new DebugLogger();
const performanceMonitor = new PerformanceMonitor();

// 暴露到全域
window.DebugTools = {
  logger: debugLogger,
  monitor: performanceMonitor,
  DebugLogger,
  PerformanceMonitor
};

// 便捷方法
window.enableDebug = () => debugLogger.enable();
window.disableDebug = () => debugLogger.disable();
window.exportDebugLogs = () => debugLogger.exportLogs();
window.showPerformanceReport = () => debugLogger.generatePerformanceReport();