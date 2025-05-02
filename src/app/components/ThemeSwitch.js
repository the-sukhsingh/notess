'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themes = [
    { name: "light", icon: <FiSun size={18} /> },
    { name: "dark", icon: <FiMoon size={18} /> },
    { name: "system", icon: <FiMonitor size={18} /> },
  ];

  return (
    <div className={`flex items-center space-x-2 ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
      {themes.map(({ name, icon }) => (
        <button
          key={name}
          className={`p-2 rounded-md ${
            theme === name
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setTheme(name)}
          aria-label={`Switch to ${name} theme`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}