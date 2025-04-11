
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Check for user preference on component mount
  useEffect(() => {
    if (localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && 
        window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setTheme("dark");
    } else {
      document.documentElement.classList.remove('dark');
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setTheme("dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setTheme("light");
    }
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 bg-white/80 dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all animate-float"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-blue-700 dark:text-blue-400" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
