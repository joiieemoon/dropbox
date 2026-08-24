"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  // Apply/remove the `dark` class on <html>. Kept as a plain function so it
  // can also be called synchronously inside toggleTheme — required for the
  // View Transitions API wave (the snapshot must already show the new theme).
  const applyThemeClass = (next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    // This code will only run on the client side
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "light"; // Default to light theme

    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      applyThemeClass(theme);
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    // Flip the class synchronously so a startViewTransition snapshot taken
    // right after this call reflects the new theme (wave reveal).
    applyThemeClass(next);
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
