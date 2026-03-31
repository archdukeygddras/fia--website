// Centralized theme toggle for all pages.
(function () {
  const THEME_KEY = "fia-theme";

  function getInitialTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") return stored;
    } catch (e) {
      // Ignore storage access issues.
    }
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // Ignore storage access issues.
    }
  }

  function buildToggleButton() {
    if (document.getElementById("themeToggle")) return null;

    const btn = document.createElement("button");
    btn.id = "themeToggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle dark mode");
    btn.className =
      "fixed top-4 right-4 z-50 inline-flex items-center justify-center px-3 py-2 rounded-full bg-primary/[0.03] dark:bg-slate-800/50 text-slate-600 dark:text-slate-200 hover:opacity-90 transition-opacity border border-primary/10 dark:border-slate-700/60";

    const icon = document.createElement("span");
    icon.id = "themeToggleIcon";
    icon.className = "material-symbols-outlined text-[20px]";
    btn.appendChild(icon);

    document.body.appendChild(btn);
    return btn;
  }

  function updateToggleUI(btn) {
    const icon = btn.querySelector("#themeToggleIcon");
    if (!icon) return;
    const isDark = document.documentElement.classList.contains("dark");
    icon.textContent = isDark ? "dark_mode" : "light_mode";
    btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  }

  // Apply as soon as possible to minimize flash.
  applyTheme(getInitialTheme());

  document.addEventListener("DOMContentLoaded", function () {
    const btn = buildToggleButton() || document.getElementById("themeToggle");
    if (!btn) return;

    updateToggleUI(btn);

    btn.addEventListener("click", function () {
      const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
      applyTheme(next);
      saveTheme(next);
      updateToggleUI(btn);
    });
  });
})();
