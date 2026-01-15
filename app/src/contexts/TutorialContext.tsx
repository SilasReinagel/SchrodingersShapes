import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// LocalStorage key for tracking first-time users
const STORAGE_KEY_TUTORIAL_SEEN = 'schrodingers_shapes_tutorial_seen';
const STORAGE_KEY_HINTS_SEEN = 'schrodingers_shapes_hints_seen';

export type TutorialStep = 
  | 'idle_hint'      // Show pulse on cat cell after idle
  | 'first_click'    // Player clicked first cell
  | 'first_shape'    // Player placed first shape
  | 'constraint_satisfied' // First constraint was satisfied
  | 'constraint_violated'  // First constraint was violated
  | 'level_complete' // First level completed
  | 'none';          // No tutorial step active

interface TutorialContextType {
  // State
  isFirstTimeUser: boolean;
  currentStep: TutorialStep;
  idleTime: number;
  hasSeenHint: (hintId: string) => boolean;
  
  // Actions
  markHintSeen: (hintId: string) => void;
  setCurrentStep: (step: TutorialStep) => void;
  resetIdleTimer: () => void;
  markTutorialComplete: () => void;
  
  // Derived state
  shouldShowIdleHint: boolean;
  shouldShowTooltip: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

/**
 * Check if user has completed the tutorial before
 */
const loadTutorialSeen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY_TUTORIAL_SEEN) === 'true';
  } catch {
    return false;
  }
};

/**
 * Load which hints the user has already seen
 */
const loadSeenHints = (): Set<string> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_HINTS_SEEN);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // localStorage not available
  }
  return new Set();
};

/**
 * Save seen hints to localStorage
 */
const saveSeenHints = (hints: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY_HINTS_SEEN, JSON.stringify([...hints]));
  } catch {
    // localStorage not available
  }
};

// Idle time threshold in seconds before showing hint
const IDLE_THRESHOLD_SECONDS = 8;

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(() => !loadTutorialSeen());
  const [currentStep, setCurrentStep] = useState<TutorialStep>('none');
  const [idleTime, setIdleTime] = useState(0);
  const [seenHints, setSeenHints] = useState<Set<string>>(() => loadSeenHints());
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start idle timer when component mounts
  useEffect(() => {
    if (!isFirstTimeUser) return;

    idleTimerRef.current = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [isFirstTimeUser]);

  // Update current step based on idle time
  useEffect(() => {
    if (isFirstTimeUser && idleTime >= IDLE_THRESHOLD_SECONDS && currentStep === 'none') {
      setCurrentStep('idle_hint');
    }
  }, [idleTime, isFirstTimeUser, currentStep]);

  const resetIdleTimer = useCallback(() => {
    setIdleTime(0);
    if (currentStep === 'idle_hint') {
      setCurrentStep('first_click');
    }
  }, [currentStep]);

  const hasSeenHint = useCallback((hintId: string): boolean => {
    return seenHints.has(hintId);
  }, [seenHints]);

  const markHintSeen = useCallback((hintId: string) => {
    setSeenHints(prev => {
      const newSet = new Set(prev);
      newSet.add(hintId);
      saveSeenHints(newSet);
      return newSet;
    });
  }, []);

  const markTutorialComplete = useCallback(() => {
    setIsFirstTimeUser(false);
    setCurrentStep('none');
    try {
      localStorage.setItem(STORAGE_KEY_TUTORIAL_SEEN, 'true');
    } catch {
      // localStorage not available
    }
  }, []);

  const shouldShowIdleHint = isFirstTimeUser && currentStep === 'idle_hint';
  const shouldShowTooltip = isFirstTimeUser && currentStep !== 'none';

  const value: TutorialContextType = {
    isFirstTimeUser,
    currentStep,
    idleTime,
    hasSeenHint,
    markHintSeen,
    setCurrentStep,
    resetIdleTimer,
    markTutorialComplete,
    shouldShowIdleHint,
    shouldShowTooltip,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

