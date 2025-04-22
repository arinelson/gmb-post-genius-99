
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  milliseconds?: number;
  seconds?: number;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer = ({ milliseconds, seconds, onComplete, className = "" }: CountdownTimerProps) => {
  const initialMs = milliseconds || (seconds ? seconds * 1000 : 0);
  const [timeLeft, setTimeLeft] = useState(initialMs);
  
  useEffect(() => {
    const newInitialMs = milliseconds || (seconds ? seconds * 1000 : 0);
    if (newInitialMs !== timeLeft) {
      setTimeLeft(newInitialMs);
    }
    
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newValue = prev - 1000;
        if (newValue <= 0) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [milliseconds, seconds, timeLeft, onComplete]);
  
  const displaySeconds = Math.ceil(timeLeft / 1000);
  
  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${className}`}>
      <Clock size={14} className="animate-pulse" />
      <span>
        {displaySeconds > 0 ? `${displaySeconds}s` : "Pronto!"}
      </span>
    </div>
  );
};

export default CountdownTimer;
