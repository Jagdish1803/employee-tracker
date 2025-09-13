'use client';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const entries = performance.getEntriesByName(name);
      const duration = entries[entries.length - 1]?.duration || 0;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
      
      // Clean up
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
      
      return duration;
    }
    return 0;
  }

  logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(
        Array.from(this.metrics.entries()).map(([name, times]) => ({
          operation: name,
          calls: times.length,
          average: (times.reduce((sum, time) => sum + time, 0) / times.length).toFixed(2) + 'ms',
          total: times.reduce((sum, time) => sum + time, 0).toFixed(2) + 'ms',
        }))
      );
    }
  }
}