// Performance Optimization Utilities
class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.lazyImages = new Set();
        this.deferredTasks = [];
        this.setupOptimizations();
    }

    setupOptimizations() {
        this.setupLazyLoading();
        this.setupVirtualScrolling();
        this.setupImageOptimization();
        this.setupCacheManagement();
        this.setupResourceHints();
        this.setupIdleTaskScheduling();
    }

    // Lazy loading for images and content
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                            this.lazyImages.delete(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            this.observers.set('images', imageObserver);
        }
    }

    // Add image to lazy loading
    addLazyImage(img) {
        if (this.observers.has('images')) {
            this.lazyImages.add(img);
            this.observers.get('images').observe(img);
        }
    }

    // Virtual scrolling for large lists
    setupVirtualScrolling() {
        this.virtualScrollConfigs = new Map();
    }

    createVirtualScroll(container, items, renderItem, itemHeight = 50) {
        const config = {
            container,
            items,
            renderItem,
            itemHeight,
            visibleItems: Math.ceil(container.clientHeight / itemHeight) + 2,
            scrollTop: 0,
            startIndex: 0,
            endIndex: 0
        };

        const updateVisibleItems = this.throttle(() => {
            const scrollTop = container.scrollTop;
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + config.visibleItems, items.length);

            if (startIndex !== config.startIndex || endIndex !== config.endIndex) {
                config.startIndex = startIndex;
                config.endIndex = endIndex;
                this.renderVirtualItems(config);
            }
        }, 16); // ~60fps

        container.addEventListener('scroll', updateVisibleItems);
        this.virtualScrollConfigs.set(container, config);
        
        // Initial render
        this.renderVirtualItems(config);
    }

    renderVirtualItems(config) {
        const { container, items, renderItem, itemHeight, startIndex, endIndex } = config;
        
        // Clear container
        container.innerHTML = '';
        
        // Create spacer for items before visible area
        if (startIndex > 0) {
            const topSpacer = document.createElement('div');
            topSpacer.style.height = `${startIndex * itemHeight}px`;
            container.appendChild(topSpacer);
        }

        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
            if (items[i]) {
                const element = renderItem(items[i], i);
                container.appendChild(element);
            }
        }

        // Create spacer for items after visible area
        if (endIndex < items.length) {
            const bottomSpacer = document.createElement('div');
            bottomSpacer.style.height = `${(items.length - endIndex) * itemHeight}px`;
            container.appendChild(bottomSpacer);
        }
    }

    // Image optimization
    setupImageOptimization() {
        // WebP support detection
        this.supportsWebP = this.checkWebPSupport();
        
        // Responsive image loading
        this.setupResponsiveImages();
    }

    checkWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    setupResponsiveImages() {
        // Add srcset support for high DPI displays
        const images = document.querySelectorAll('img[data-srcset]');
        images.forEach(img => {
            if (window.devicePixelRatio > 1) {
                const srcset = img.dataset.srcset;
                if (srcset) {
                    img.srcset = srcset;
                }
            }
        });
    }

    // Cache management
    setupCacheManagement() {
        this.cache = new Map();
        this.cacheSize = 0;
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
    }

    setCache(key, data, ttl = 300000) { // 5 minutes default TTL
        const item = {
            data,
            timestamp: Date.now(),
            ttl,
            size: this.estimateSize(data)
        };

        // Remove expired items
        this.cleanExpiredCache();

        // Check if we need to make space
        if (this.cacheSize + item.size > this.maxCacheSize) {
            this.evictLRU(item.size);
        }

        this.cache.set(key, item);
        this.cacheSize += item.size;
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.cacheSize -= item.size;
            return null;
        }

        // Update access time for LRU
        item.lastAccess = Date.now();
        return item.data;
    }

    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
                this.cacheSize -= item.size;
            }
        }
    }

    evictLRU(neededSize) {
        const items = Array.from(this.cache.entries())
            .sort((a, b) => (a[1].lastAccess || a[1].timestamp) - (b[1].lastAccess || b[1].timestamp));

        let freedSize = 0;
        for (const [key, item] of items) {
            this.cache.delete(key);
            this.cacheSize -= item.size;
            freedSize += item.size;
            
            if (freedSize >= neededSize) break;
        }
    }

    estimateSize(obj) {
        return JSON.stringify(obj).length * 2; // Rough estimate
    }

    // Resource hints
    setupResourceHints() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Prefetch likely next resources
        this.setupPrefetching();
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: '/css/style.css', as: 'style' },
            { href: '/js/app.js', as: 'script' },
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
            document.head.appendChild(link);
        });
    }

    setupPrefetching() {
        // Prefetch on hover for likely navigation
        document.addEventListener('mouseover', this.throttle((e) => {
            const link = e.target.closest('a[href]');
            if (link && link.hostname === window.location.hostname) {
                this.prefetchResource(link.href);
            }
        }, 100));
    }

    prefetchResource(url) {
        if (this.prefetchedUrls?.has(url)) return;
        
        if (!this.prefetchedUrls) {
            this.prefetchedUrls = new Set();
        }

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        this.prefetchedUrls.add(url);
    }

    // Idle task scheduling
    setupIdleTaskScheduling() {
        if ('requestIdleCallback' in window) {
            this.scheduleIdleTasks();
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => this.runDeferredTasks(), 100);
        }
    }

    scheduleIdleTasks() {
        const runTasks = (deadline) => {
            while (deadline.timeRemaining() > 0 && this.deferredTasks.length > 0) {
                const task = this.deferredTasks.shift();
                try {
                    task();
                } catch (error) {
                    console.error('Deferred task error:', error);
                }
            }

            if (this.deferredTasks.length > 0) {
                requestIdleCallback(runTasks);
            }
        };

        requestIdleCallback(runTasks);
    }

    addDeferredTask(task) {
        this.deferredTasks.push(task);
        
        if (this.deferredTasks.length === 1) {
            if ('requestIdleCallback' in window) {
                this.scheduleIdleTasks();
            } else {
                setTimeout(() => this.runDeferredTasks(), 100);
            }
        }
    }

    runDeferredTasks() {
        while (this.deferredTasks.length > 0) {
            const task = this.deferredTasks.shift();
            try {
                task();
            } catch (error) {
                console.error('Deferred task error:', error);
            }
        }
    }

    // Utility functions
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} took ${end - start} milliseconds`);
        
        // Log slow operations
        if (end - start > 100) {
            console.warn(`Slow operation detected: ${name} (${end - start}ms)`);
        }
        
        return result;
    }

    // Memory management
    cleanup() {
        // Clear caches
        this.cache.clear();
        this.cacheSize = 0;
        
        // Disconnect observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear deferred tasks
        this.deferredTasks.length = 0;
        
        // Clear lazy images
        this.lazyImages.clear();
    }
}

// Create global performance optimizer instance
window.performanceOptimizer = new PerformanceOptimizer();