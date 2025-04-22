import { toast } from "@/hooks/use-toast";

interface RateLimitStorage {
  count: number;
  lastGeneration: number;
  dailyCount: number;
  dailyReset: number;
}

// Retém tudo, mas garante: 10s entre posts e máximo 30 diários por ip (localStorage por navegador)
const COOLDOWN_PERIOD = 10000; // 10 seconds in milliseconds
const DAILY_LIMIT = 30; // 30 posts per day
const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useRateLimiter = () => {
  const getStoredLimits = (): RateLimitStorage => {
    const stored = localStorage.getItem('rateLimits');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize with default values
    return {
      count: 0,
      lastGeneration: 0,
      dailyCount: 0,
      dailyReset: Date.now() + ONE_DAY
    };
  };

  const updateStorage = (data: RateLimitStorage) => {
    localStorage.setItem('rateLimits', JSON.stringify(data));
  };

  const canGeneratePosts = (): { allowed: boolean; remainingTime?: number; dailyRemaining?: number } => {
    let limits = getStoredLimits();
    const now = Date.now();

    // Check if we need to reset the daily count
    if (now > limits.dailyReset) {
      limits = {
        ...limits,
        dailyCount: 0,
        dailyReset: now + ONE_DAY
      };
      updateStorage(limits);
    }

    // Check daily limit
    if (limits.dailyCount >= DAILY_LIMIT) {
      const hoursUntilReset = Math.ceil((limits.dailyReset - now) / (60 * 60 * 1000));
      return { 
        allowed: false, 
        dailyRemaining: DAILY_LIMIT - limits.dailyCount,
        remainingTime: limits.dailyReset - now 
      };
    }

    // Check cooldown
    if (now - limits.lastGeneration < COOLDOWN_PERIOD) {
      return { 
        allowed: false, 
        dailyRemaining: DAILY_LIMIT - limits.dailyCount,
        remainingTime: COOLDOWN_PERIOD - (now - limits.lastGeneration) 
      };
    }

    return { 
      allowed: true, 
      dailyRemaining: DAILY_LIMIT - limits.dailyCount 
    };
  };

  const recordGeneration = () => {
    const limits = getStoredLimits();
    const now = Date.now();
    
    updateStorage({
      ...limits,
      count: limits.count + 1,
      lastGeneration: now,
      dailyCount: limits.dailyCount + 1
    });
  };

  const getRemainingTime = (): { cooldown: number; daily: number } => {
    const limits = getStoredLimits();
    const now = Date.now();
    
    return {
      cooldown: Math.max(0, COOLDOWN_PERIOD - (now - limits.lastGeneration)),
      daily: Math.max(0, limits.dailyReset - now)
    };
  };

  return {
    canGeneratePosts,
    recordGeneration,
    getRemainingTime
  };
};
