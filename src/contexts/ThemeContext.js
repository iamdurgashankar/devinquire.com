import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children, initialTheme }) {
  const [theme, setTheme] = useState(initialTheme || "system");

  // Apply theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    const apply = (t) => {
      root.classList.remove("light", "dark");
      if (t === "dark") root.classList.add("dark");
      else if (t === "light") root.classList.add("light");
      else {
        // system
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.add("light");
        }
      }
    };
    apply(theme);
    if (theme === "system") {
      const listener = (e) => apply(e.matches ? "dark" : "light");
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", listener);
      return () =>
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .removeEventListener("change", listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
