import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Difficulty } from '../game/types';
import { DIFFICULTY_SETTINGS } from '../game/DifficultySettings';

interface DifficultyStats {
  minMoves: number;
  maxMoves: number;
  avgMoves: number;
  minSolutions: number;
  maxSolutions: number;
  avgSolutions: number;
  minDeadEnds: number;
  maxDeadEnds: number;
  avgDeadEnds: number;
  solvableCount: number;
  totalPuzzles: number;
  avgSolveTimeMs: number;
}

interface WorkerMessage {
  type: 'success' | 'error';
  difficulty: Difficulty;
  results?: DifficultyStats;
  error?: string;
}

interface AnalysisConfig {
  totalPuzzles: number;
  batchSize: number;
}

interface DifficultyProgress {
  completed: number;
  total: number;
  currentBatch: DifficultyStats | null;
}

interface AnalysisState {
  isRunning: boolean;
  startTime: number | null;
  endTime: number | null;
  results: Record<Difficulty, DifficultyStats> | null;
  progress: Record<Difficulty, DifficultyProgress>;
}

const DEFAULT_CONFIG: AnalysisConfig = {
  totalPuzzles: 1000,
  batchSize: 50
};

const DIFFICULTIES = Object.keys(DIFFICULTY_SETTINGS) as Difficulty[];

const INITIAL_BATCH_COUNTS: Record<Difficulty, number> = Object.fromEntries(
  DIFFICULTIES.map(d => [d, 0])
) as Record<Difficulty, number>;

const INITIAL_PROGRESS: Record<Difficulty, DifficultyProgress> = Object.fromEntries(
  DIFFICULTIES.map(d => [d, { completed: 0, total: 0, currentBatch: null }])
) as Record<Difficulty, DifficultyProgress>;

export const Designer = () => {
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG);
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isRunning: false,
    startTime: null,
    endTime: null,
    results: null,
    progress: INITIAL_PROGRESS
  });

  const workersRef = useRef<Record<Difficulty, Worker>>({} as Record<Difficulty, Worker>);
  const aggregatedResultsRef = useRef<Record<Difficulty, DifficultyStats> | null>(null);
  const batchCountRef = useRef<Record<Difficulty, number>>(INITIAL_BATCH_COUNTS);

  useEffect(() => {
    // Initialize workers
    DIFFICULTIES.forEach(difficulty => {
      workersRef.current[difficulty] = new Worker(
        new URL('../workers/analysisWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workersRef.current[difficulty].onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'success' && e.data.results) {
          const { difficulty, results } = e.data;
          
          // Update batch count
          batchCountRef.current[difficulty] = (batchCountRef.current[difficulty] || 0) + 1;
          
          // Update progress
          setAnalysis(prev => {
            const newProgress = { ...prev.progress };
            newProgress[difficulty] = {
              completed: Math.min(batchCountRef.current[difficulty] * config.batchSize, config.totalPuzzles),
              total: config.totalPuzzles,
              currentBatch: results
            };

            return {
              ...prev,
              progress: newProgress
            };
          });

          // Aggregate results
          if (!aggregatedResultsRef.current) {
            aggregatedResultsRef.current = { [difficulty]: results } as Record<Difficulty, DifficultyStats>;
          } else if (!aggregatedResultsRef.current[difficulty]) {
            aggregatedResultsRef.current[difficulty] = results;
          } else {
            const i = batchCountRef.current[difficulty] - 1;
            const prev = aggregatedResultsRef.current[difficulty];
            
            aggregatedResultsRef.current[difficulty] = {
              solvableCount: prev.solvableCount + results.solvableCount,
              totalPuzzles: prev.totalPuzzles + results.totalPuzzles,
              avgMoves: (prev.avgMoves * i + results.avgMoves) / (i + 1),
              avgSolutions: (prev.avgSolutions * i + results.avgSolutions) / (i + 1),
              avgDeadEnds: (prev.avgDeadEnds * i + results.avgDeadEnds) / (i + 1),
              avgSolveTimeMs: (prev.avgSolveTimeMs * i + results.avgSolveTimeMs) / (i + 1),
              minMoves: Math.min(prev.minMoves, results.minMoves),
              maxMoves: Math.max(prev.maxMoves, results.maxMoves),
              minSolutions: Math.min(prev.minSolutions, results.minSolutions),
              maxSolutions: Math.max(prev.maxSolutions, results.maxSolutions),
              minDeadEnds: Math.min(prev.minDeadEnds, results.minDeadEnds),
              maxDeadEnds: Math.max(prev.maxDeadEnds, results.maxDeadEnds)
            };
          }

          // Check if all batches are complete
          const isComplete = DIFFICULTIES.every(d => {
            const batchesNeeded = Math.ceil(config.totalPuzzles / config.batchSize);
            return (batchCountRef.current[d] || 0) >= batchesNeeded;
          });

          if (isComplete) {
            setAnalysis(prev => ({
              ...prev,
              isRunning: false,
              endTime: Date.now(),
              results: aggregatedResultsRef.current
            }));
          }
        }
      };
    });

    // Cleanup workers on unmount
    return () => {
      Object.values(workersRef.current).forEach(worker => worker.terminate());
    };
  }, []);

  const handleConfigChange = (field: keyof AnalysisConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setAnalysis(prev => ({
      ...prev,
      progress: Object.fromEntries(
        DIFFICULTIES.map(d => [d, { ...prev.progress[d], total: field === 'totalPuzzles' ? value : prev.progress[d].total }])
      ) as Record<Difficulty, DifficultyProgress>
    }));
  };

  const handleRunAnalysis = async () => {
    // Reset state
    aggregatedResultsRef.current = null;
    batchCountRef.current = { ...INITIAL_BATCH_COUNTS };
    
    const initialProgress = Object.fromEntries(
      DIFFICULTIES.map(d => [d, { completed: 0, total: config.totalPuzzles, currentBatch: null }])
    ) as Record<Difficulty, DifficultyProgress>;

    setAnalysis({
      isRunning: true,
      startTime: Date.now(),
      endTime: null,
      results: null,
      progress: initialProgress
    });

    // Start analysis for each difficulty
    DIFFICULTIES.forEach(difficulty => {
      const batches = Math.ceil(config.totalPuzzles / config.batchSize);
      
      for (let i = 0; i < batches; i++) {
        const remainingPuzzles = config.totalPuzzles - (i * config.batchSize);
        const currentBatchSize = Math.min(config.batchSize, remainingPuzzles);
        
        workersRef.current[difficulty].postMessage({
          difficulty,
          batchSize: currentBatchSize
        });
      }
    });
  };

  const formatTime = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
  };

  const renderProgressBar = (difficulty: Difficulty) => {
    const progress = analysis.progress[difficulty];
    const percentage = (progress.completed / progress.total) * 100;

    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="capitalize">{difficulty}</span>
          <span>
            {progress.completed}/{progress.total} ({Math.round(percentage)}%)
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderDifficultyStats = (difficulty: Difficulty, stats: DifficultyStats | undefined) => {
    if (!stats) return null;

    const remaining = analysis.isRunning 
      ? config.totalPuzzles - analysis.progress[difficulty].completed 
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white capitalize">{difficulty}</h3>
          {analysis.isRunning && (
            <div className="text-sm text-white/60">
              Remaining: {remaining}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-white/60 text-sm">Solvable Puzzles</h4>
            <p className="text-white text-lg">
              {stats.solvableCount}/{stats.totalPuzzles} ({((stats.solvableCount / stats.totalPuzzles) * 100).toFixed(1)}%)
            </p>
          </div>

          <div>
            <h4 className="text-white/60 text-sm">Avg Solve Time</h4>
            <p className="text-white text-lg">{stats.avgSolveTimeMs.toFixed(2)}ms</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h4 className="text-white/60 text-sm font-semibold">Moves Statistics</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Min Moves</div>
              <div className="text-white">{stats.minMoves}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Max Moves</div>
              <div className="text-white">{stats.maxMoves}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Avg Moves</div>
              <div className="text-white">{stats.avgMoves.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h4 className="text-white/60 text-sm font-semibold">Solutions Statistics</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Min Solutions</div>
              <div className="text-white">{stats.minSolutions}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Max Solutions</div>
              <div className="text-white">{stats.maxSolutions}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Avg Solutions</div>
              <div className="text-white">{stats.avgSolutions.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h4 className="text-white/60 text-sm font-semibold">Dead Ends Statistics</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Min Dead Ends</div>
              <div className="text-white">{stats.minDeadEnds}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Max Dead Ends</div>
              <div className="text-white">{stats.maxDeadEnds}</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <div className="text-white/40">Avg Dead Ends</div>
              <div className="text-white">{stats.avgDeadEnds.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Puzzle Designer</h1>
          <p className="text-lg text-white/60">Analyze puzzle generation patterns and difficulty balance</p>
        </header>

        {/* Configuration Section */}
        <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/60 mb-2">Total Puzzles</label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={config.totalPuzzles}
                onChange={(e) => handleConfigChange('totalPuzzles', parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Batch Size</label>
              <input
                type="number"
                min="10"
                max="100"
                step="10"
                value={config.batchSize}
                onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-12">
          <button
            onClick={handleRunAnalysis}
            disabled={analysis.isRunning}
            className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all
              ${analysis.isRunning
                ? 'bg-indigo-700 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg'
              }`}
          >
            {analysis.isRunning ? 'Running Analysis...' : 'Run Analysis'}
          </button>
        </div>

        {(analysis.isRunning || analysis.results) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Progress Bars */}
            {analysis.isRunning && (
              <div className="mb-8">
                {DIFFICULTIES.map(difficulty => (
                  <div key={difficulty}>
                    {renderProgressBar(difficulty)}
                  </div>
                ))}
              </div>
            )}

            {/* Timer Section */}
            <div className="text-center mb-8">
              <div className="text-2xl font-mono">
                {analysis.isRunning ? (
                  'Analysis in progress...'
                ) : analysis.startTime && analysis.endTime ? (
                  `Completed in ${formatTime(analysis.endTime - analysis.startTime)}`
                ) : null}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DIFFICULTIES.map(difficulty => (
                <div key={difficulty}>
                  {renderDifficultyStats(
                    difficulty,
                    analysis.isRunning 
                      ? analysis.progress[difficulty].currentBatch || undefined 
                      : analysis.results?.[difficulty]
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}; 