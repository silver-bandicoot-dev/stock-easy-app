// Performance monitoring simple
export class PerformanceMonitor {
  static marks = new Map();

  static start(name) {
    this.marks.set(name, performance.now());
  }

  static end(name) {
    const start = this.marks.get(name);
    if (!start) return;

    const duration = performance.now() - start;
    this.marks.delete(name);

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

    // Envoyer à votre service d'analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'Performance'
      });
    }

    return duration;
  }

  static measure(name, fn) {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }

  static async measureAsync(name, fn) {
    this.start(name);
    const result = await fn();
    this.end(name);
    return result;
  }
}

// Usage:
// PerformanceMonitor.start('load-products');
// const products = await api.getAllProducts();
// PerformanceMonitor.end('load-products');
