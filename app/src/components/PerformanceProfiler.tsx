import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderCount: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  cpuUsage?: {
    utilization: number; // Percentage (0-100)
    longTasks: number; // Count of long tasks in the last second
    mainThreadBlocking: number; // Average blocking time in ms
  };
  componentRenderCounts: Map<string, number>;
}

interface PerformanceProfilerProps {
  enabled?: boolean;
}

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    renderCount: 0,
    componentRenderCounts: new Map(),
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const renderCountRef = useRef(0);
  const componentRenderCountsRef = useRef<Map<string, number>>(new Map());
  
  // CPU monitoring refs
  const longTasksRef = useRef<number[]>([]);
  const mainThreadBlockingRef = useRef<number[]>([]);
  const lastCpuCheckRef = useRef(performance.now());
  const observerRef = useRef<PerformanceObserver | null>(null);
  const lastCpuUsageRef = useRef<{ utilization: number; longTasks: number; mainThreadBlocking: number } | undefined>(undefined);

  const measureFrame = useCallback((_timestamp: number) => {
    if (!enabled) return;

    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    lastTimeRef.current = now;

    frameCountRef.current++;
    frameTimesRef.current.push(deltaTime);

    // Keep only last 60 frames for rolling average
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate FPS and frame time
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const fps = 1000 / avgFrameTime;

    // Get memory info if available
    const memoryInfo = (performance as any).memory;

    // Calculate CPU usage
    const timeSinceLastCheck = now - lastCpuCheckRef.current;
    let cpuUsage = undefined;
    
    if (timeSinceLastCheck >= 1000) { // Update CPU metrics every second
      // Filter long tasks from the last second
      const oneSecondAgo = now - 1000;
      const recentLongTasks = longTasksRef.current.filter(time => time >= oneSecondAgo);
      longTasksRef.current = recentLongTasks;

      // Calculate CPU utilization based on frame time vs idle time
      // Higher frame time = more CPU usage
      const avgBlockingTime = mainThreadBlockingRef.current.length > 0
        ? mainThreadBlockingRef.current.reduce((a, b) => a + b, 0) / mainThreadBlockingRef.current.length
        : avgFrameTime;
      
      // Estimate CPU utilization: if frame time is close to target (16.67ms for 60fps), CPU is busy
      // If frame time exceeds target significantly, CPU is overloaded
      const targetFrameTime = 16.67; // 60fps target
      const utilization = Math.min(100, Math.max(0, (avgBlockingTime / targetFrameTime) * 100));
      
      // Clear old blocking times (keep last 60)
      if (mainThreadBlockingRef.current.length > 60) {
        mainThreadBlockingRef.current.shift();
      }

      cpuUsage = {
        utilization: Math.round(utilization * 10) / 10,
        longTasks: recentLongTasks.length,
        mainThreadBlocking: Math.round(avgBlockingTime * 100) / 100,
      };

      lastCpuUsageRef.current = cpuUsage;
      lastCpuCheckRef.current = now;
    }

    setMetrics({
      fps: Math.round(fps),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      renderCount: renderCountRef.current,
      memoryUsage: memoryInfo ? {
        usedJSHeapSize: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
        jsHeapSizeLimit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024),
      } : undefined,
      cpuUsage: cpuUsage || lastCpuUsageRef.current,
      componentRenderCounts: new Map(componentRenderCountsRef.current),
    });

    animationFrameRef.current = requestAnimationFrame(measureFrame);
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      lastTimeRef.current = performance.now();
      lastCpuCheckRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(measureFrame);

      // Set up PerformanceObserver for long tasks (CPU-intensive operations)
      if ('PerformanceObserver' in window) {
        try {
          observerRef.current = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'longtask') {
                const longTask = entry as PerformanceEntry & { duration: number; startTime: number };
                longTasksRef.current.push(performance.now());
                mainThreadBlockingRef.current.push(longTask.duration);
                
                // Keep only last 100 long tasks
                if (longTasksRef.current.length > 100) {
                  longTasksRef.current.shift();
                }
                if (mainThreadBlockingRef.current.length > 100) {
                  mainThreadBlockingRef.current.shift();
                }
              }
            });
          });

          // Observe long tasks (tasks > 50ms)
          observerRef.current.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          // Long task API might not be available in all browsers
          console.warn('Long task API not available:', e);
        }
      }

      // Also track main thread blocking using frame time as a proxy
      // If frame time exceeds 16.67ms significantly, it indicates CPU blocking
      const checkMainThreadBlocking = () => {
        if (frameTimesRef.current.length > 0) {
          const recentFrameTime = frameTimesRef.current[frameTimesRef.current.length - 1];
          if (recentFrameTime > 16.67) {
            mainThreadBlockingRef.current.push(recentFrameTime - 16.67);
            if (mainThreadBlockingRef.current.length > 100) {
              mainThreadBlockingRef.current.shift();
            }
          }
        }
      };

      const blockingInterval = setInterval(checkMainThreadBlocking, 100);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        clearInterval(blockingInterval);
      };
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, measureFrame]);

  // Track component renders
  useEffect(() => {
    if (enabled) {
      renderCountRef.current++;
    }
  });

  const getColorForFPS = (fps: number): string => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getColorForFrameTime = (frameTime: number): string => {
    if (frameTime <= 16.67) return 'text-green-400'; // 60fps
    if (frameTime <= 33.33) return 'text-yellow-400'; // 30fps
    return 'text-red-400';
  };

  const getColorForCPU = (utilization: number): string => {
    if (utilization < 50) return 'text-green-400';
    if (utilization < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-[9999] bg-black/90 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-4 shadow-2xl font-mono text-xs"
        style={{ minWidth: '280px' }}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/30">
          <h3 className="text-cyan-400 font-bold text-sm">Performance Profiler</h3>
          <span className="text-gray-400 text-xs">Ctrl+Shift+P</span>
        </div>

        <div className="space-y-2">
          {/* FPS */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">FPS:</span>
            <span className={getColorForFPS(metrics.fps)}>
              {metrics.fps}
            </span>
          </div>

          {/* Frame Time */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Frame Time:</span>
            <span className={getColorForFrameTime(metrics.frameTime)}>
              {metrics.frameTime.toFixed(2)}ms
            </span>
          </div>

          {/* Render Count */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total Renders:</span>
            <span className="text-cyan-300">{metrics.renderCount}</span>
          </div>

          {/* CPU Usage */}
          {metrics.cpuUsage && (
            <>
              <div className="pt-2 border-t border-cyan-500/30">
                <div className="text-gray-400 text-xs mb-1">CPU:</div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Utilization:</span>
                  <span className={getColorForCPU(metrics.cpuUsage.utilization)}>
                    {metrics.cpuUsage.utilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Long Tasks:</span>
                  <span className={metrics.cpuUsage.longTasks > 0 ? 'text-yellow-300' : 'text-gray-400'}>
                    {metrics.cpuUsage.longTasks}/s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Blocking:</span>
                  <span className={metrics.cpuUsage.mainThreadBlocking > 10 ? 'text-yellow-300' : 'text-gray-400'}>
                    {metrics.cpuUsage.mainThreadBlocking.toFixed(2)}ms
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Memory Usage */}
          {metrics.memoryUsage && (
            <>
              <div className="pt-2 border-t border-cyan-500/30">
                <div className="text-gray-400 text-xs mb-1">Memory:</div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Used:</span>
                  <span className="text-yellow-300">
                    {metrics.memoryUsage.usedJSHeapSize}MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-gray-400">
                    {metrics.memoryUsage.totalJSHeapSize}MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Limit:</span>
                  <span className="text-gray-400">
                    {metrics.memoryUsage.jsHeapSizeLimit}MB
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Performance Warning */}
          {(metrics.fps < 30 || (metrics.cpuUsage && metrics.cpuUsage.utilization > 90)) && (
            <div className="pt-2 border-t border-red-500/30">
              <div className="text-red-400 text-xs">
                {metrics.fps < 30 && '⚠️ Low FPS detected - check for performance issues'}
                {metrics.fps < 30 && metrics.cpuUsage && metrics.cpuUsage.utilization > 90 && ' • '}
                {metrics.cpuUsage && metrics.cpuUsage.utilization > 90 && '⚠️ High CPU usage detected'}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook to track component renders
export const useRenderTracker = (componentName: string) => {
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current++;
    // You can log this or send to a global tracker
    if (typeof window !== 'undefined') {
      const tracker = (window as any).__renderTracker;
      if (tracker) {
        tracker.set(componentName, renderCountRef.current);
      }
    }
  });
};

// Global hook to enable/disable profiler
let profilerEnabled = false;
const profilerListeners = new Set<() => void>();

// Initialize render tracker on window
if (typeof window !== 'undefined') {
  (window as any).__renderTracker = new Map<string, number>();
}

export const useProfilerToggle = () => {
  const [enabled, setEnabled] = useState(profilerEnabled);

  useEffect(() => {
    const listener = () => setEnabled(profilerEnabled);
    profilerListeners.add(listener);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        profilerEnabled = !profilerEnabled;
        profilerListeners.forEach(l => l());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      profilerListeners.delete(listener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return enabled;
};

