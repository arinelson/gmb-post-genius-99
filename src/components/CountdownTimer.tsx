
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  milliseconds: number;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer = ({ milliseconds, onComplete, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(milliseconds);
  
  useEffect(() => {
    if (milliseconds !== timeLeft) {
      setTimeLeft(milliseconds);
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
  }, [milliseconds, timeLeft, onComplete]);
  
  const seconds = Math.ceil(timeLeft / 1000);
  
  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${className}`}>
      <Clock size={14} className="animate-pulse" />
      <span>
        {seconds > 0 ? `${seconds}s` : "Pronto!"}
      </span>
    </div>
  );
};

export default CountdownTimer;
