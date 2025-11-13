// Performance Configuration for Generative Art Gallery

export const PerformanceConfig = {
  // Three.js Performance Settings
  threejs: {
    // Renderer settings
    renderer: {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false // Set to true for canvas export
    },
    
    // Scene optimization
    scene: {
      autoUpdate: false, // Manual updates for better performance
      matrixAutoUpdate: false,
      frustumCulled: true
    },
    
    // Camera settings
    camera: {
      near: 0.1,
      far: 1000,
      fov: 75
    },
    
    // Texture settings
    textures: {
      maxSize: 2048,
      format: 'RGBA',
      type: 'UnsignedByteType',
      generateMipmaps: false,
      minFilter: 'LinearFilter',
      magFilter: 'LinearFilter'
    },
    
    // Shader compilation
    shaders: {
      precision: 'highp',
      cacheCompiledShaders: true,
      maxVaryings: 8
    },
    
    // Memory management
    memory: {
      disposeGeometries: true,
      disposeMaterials: true,
      disposeTextures: true,
      maxCacheSize: 50 // Maximum cached geometries
    }
  },

  // Canvas Export Performance
  canvasExport: {
    // Maximum dimensions for export
    maxWidth: 4096,
    maxHeight: 4096,
    
    // Quality settings
    quality: 0.95,
    format: 'image/png',
    
    // Compression options
    compressionLevel: 6,
    
    // Memory management
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    
    // Timeout for export operations
    timeout: 30000 // 30 seconds
  },

  // API Performance Settings
  api: {
    // Request timeouts
    timeout: 30000, // 30 seconds
    
    // Retry configuration
    retries: 3,
    retryDelay: 1000, // 1 second
    
    // Connection pooling
    keepAlive: true,
    maxSockets: 50,
    
    // Response caching
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100 // Maximum cached responses
    },
    
    // Request batching
    batchSize: 10,
    batchDelay: 100 // 100ms
  },

  // GAN Service Performance
  ganService: {
    // Job queue settings
    queue: {
      concurrency: 2, // Number of concurrent jobs
      maxQueueSize: 100,
      jobTimeout: 300000, // 5 minutes
      retryAttempts: 2
    },
    
    // Memory limits
    memory: {
      maxUsage: 2 * 1024 * 1024 * 1024, // 2GB
      cleanupInterval: 60000 // 1 minute
    },
    
    // GPU settings
    gpu: {
      enabled: true,
      memoryFraction: 0.8, // Use 80% of GPU memory
      allowGrowth: true
    },
    
    // Model optimization
    model: {
      batchSize: 1,
      precision: 'float16',
      compile: true,
      optimizeForInference: true
    }
  },

  // Frontend Performance
  frontend: {
    // Bundle optimization
    bundle: {
      codeSplitting: true,
      treeShaking: true,
      minification: true,
      compression: 'gzip',
      chunkSizeWarningLimit: 1000 // 1MB
    },
    
    // Image optimization
    images: {
      lazyLoading: true,
      webp: true,
      responsive: true,
      quality: 85,
      maxWidth: 1920
    },
    
    // Font loading
    fonts: {
      preload: true,
      display: 'swap',
      subsets: ['latin']
    },
    
    // Service worker
    serviceWorker: {
      enabled: true,
      cacheStrategy: 'network-first',
      maxCacheAge: 86400000 // 24 hours
    },
    
    // Resource hints
    resourceHints: {
      dnsPrefetch: ['https://fonts.googleapis.com'],
      preconnect: ['https://fonts.gstatic.com'],
      preload: ['/assets/fonts/']
    }
  },

  // Database Performance (if applicable)
  database: {
    // Connection pooling
    pool: {
      min: 2,
      max: 20,
      acquire: 30000,
      idle: 10000
    },
    
    // Query optimization
    queries: {
      timeout: 30000,
      maxRows: 1000,
      useIndexes: true,
      explainQueries: false // Set to true for debugging
    },
    
    // Caching
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000
    }
  },

  // Monitoring and Metrics
  monitoring: {
    // Performance metrics
    metrics: {
      webVitals: true,
      customMetrics: true,
      userTiming: true
    },
    
    // Error tracking
    errors: {
      enabled: true,
      sampleRate: 1.0,
      ignorePatterns: [
        /ResizeObserver loop limit exceeded/,
        /Non-Error promise rejection captured/
      ]
    },
    
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      sampleRate: 0.1, // 10% of users
      trackInteractions: true,
      trackResources: true
    }
  },

  // Memory Management
  memory: {
    // Garbage collection hints
    gc: {
      threshold: 0.8, // Trigger GC when memory usage > 80%
      interval: 30000 // Check every 30 seconds
    },
    
    // Object pooling
    pooling: {
      enabled: true,
      maxPoolSize: 100,
      cleanupInterval: 60000
    },
    
    // WeakMap/WeakSet usage
    weakReferences: {
      enabled: true,
      cleanupInterval: 30000
    }
  },

  // Network Performance
  network: {
    // HTTP/2 settings
    http2: {
      enabled: true,
      maxConcurrentStreams: 100,
      initialWindowSize: 65535
    },
    
    // Compression
    compression: {
      gzip: true,
      brotli: true,
      threshold: 1024 // Compress responses > 1KB
    },
    
    // CDN settings
    cdn: {
      enabled: true,
      cacheTtl: 31536000, // 1 year
      compression: true,
      http2: true
    }
  },

  // Rendering Performance
  rendering: {
    // Frame rate targeting
    targetFPS: 60,
    
    // Frame time budget
    frameBudget: 16.67, // 60 FPS = 16.67ms per frame
    
    // Animation optimization
    animations: {
      useRAF: true, // Use requestAnimationFrame
      throttle: true,
      maxDelta: 0.1 // Maximum time delta for animations
    },
    
    // Canvas optimization
    canvas: {
      willReadFrequently: false, // Set to true for canvas export
      alpha: false,
      desynchronized: true
    }
  }
};

// Performance utility functions
export const PerformanceUtils = {
  // Measure execution time
  measureTime: async <T>(fn: () => Promise<T>, name: string): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  },

  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Memory usage monitoring
  getMemoryUsage: (): { used: number; total: number; percentage: number } => {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const total = performance.memory.totalJSHeapSize;
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    }
    
    return { used: 0, total: 0, percentage: 0 };
  },

  // Web Vitals measurement
  measureWebVitals: (): void => {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }
  },

  // Optimize Three.js scene
  optimizeThreeJSScene: (scene: any): void => {
    // Disable auto-update
    scene.autoUpdate = false;
    scene.matrixAutoUpdate = false;
    
    // Enable frustum culling
    scene.traverse((child: any) => {
      if (child.frustumCulled !== undefined) {
        child.frustumCulled = true;
      }
    });
    
    // Dispose of unused resources
    const disposeResource = (resource: any) => {
      if (resource.dispose) {
        resource.dispose();
      }
    };
    
    // Clean up geometries, materials, and textures
    scene.traverse((child: any) => {
      if (child.geometry) disposeResource(child.geometry);
      if (child.material) disposeResource(child.material);
      if (child.texture) disposeResource(child.texture);
    });
  },

  // Create performance observer
  createPerformanceObserver: (callback: (entry: PerformanceEntry) => void): PerformanceObserver => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(callback);
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    return observer;
  },

  // Optimize image loading
  optimizeImageLoading: (image: HTMLImageElement): void => {
    image.loading = 'lazy';
    image.decoding = 'async';
    
    // Use WebP if supported
    if (image.src && typeof image.src === 'string') {
      const supportsWebP = () => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      };
      
      if (supportsWebP() && image.src.includes('.png')) {
        image.src = image.src.replace('.png', '.webp');
      }
    }
  }
};

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  // Start monitoring
  startMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long task detected:', entry.duration, 'ms');
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }

    // Monitor paint timing
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Paint timing:', entry.name, entry.startTime, 'ms');
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    }
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Record metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  // Get metric statistics
  getMetricStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const count = values.length;

    return { avg, min, max, count };
  }

  // Report all metrics
  reportMetrics(): void {
    console.log('📊 Performance Metrics Report:');
    this.metrics.forEach((values, name) => {
      const stats = this.getMetricStats(name);
      if (stats) {
        console.log(`${name}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms, count=${stats.count}`);
      }
    });
  }
}