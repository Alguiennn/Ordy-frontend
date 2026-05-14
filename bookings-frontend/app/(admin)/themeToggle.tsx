"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setIsDark(true);
    }
  }, []);

  function toggle() {
    const html = document.documentElement;
    const nowDark = html.getAttribute("data-theme") !== "dark";
    html.setAttribute("data-theme", nowDark ? "dark" : "light");
    localStorage.setItem("theme", nowDark ? "dark" : "light");
    setIsDark(nowDark);
  }

  return (
    <button
      id="theme-toggle"
      className="theme-toggle"
      aria-label="Toggle dark mode"
      onClick={toggle}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}