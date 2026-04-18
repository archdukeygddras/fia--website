/**
 * FIA – Centralised theme manager.
 *
 * Usage:
 *   1. Include this script in <head>.
 *   2. After DOMContentLoaded call  window.FIATheme.mount(element)
 *      to render the toggle inside any element you choose.
 *   3. If mount() is never called a floating button is auto-created.
 */
(function () {
  const THEME_KEY = "fia-theme";

  /* ── helpers ──────────────────────────────────────────────── */
  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  }
  function prefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function resolveTheme() {
    const s = getStoredTheme();
    if (s === "dark" || s === "light") return s;
    return prefersDark() ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  /* Apply immediately so there's no flash-of-wrong-theme. */
  applyTheme(resolveTheme());

  /* ── button builder ───────────────────────────────────────── */
  function buildBtn(variant) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "themeToggle";
    btn.setAttribute("aria-label", "Toggle colour scheme");

    if (variant === "floating") {
      btn.className =
        "fixed top-4 right-4 z-[60] inline-flex items-center justify-center w-10 h-10 " +
        "rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md " +
        "border border-slate-200 dark:border-slate-700 " +
        "text-slate-600 dark:text-slate-200 shadow-md " +
        "hover:scale-110 active:scale-95 transition-transform duration-200";
    } else {
      /* inline – fits inside flex nav row */
      btn.className =
        "inline-flex items-center justify-center w-9 h-9 rounded-full " +
        "bg-slate-100 dark:bg-slate-800 " +
        "border border-slate-200 dark:border-slate-700 " +
        "text-slate-600 dark:text-slate-300 " +
        "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary " +
        "hover:scale-110 active:scale-95 transition-all duration-200";
    }

    const icon = document.createElement("span");
    icon.id = "themeToggleIcon";
    icon.className = "material-symbols-outlined text-[20px] select-none";
    btn.appendChild(icon);
    return btn;
  }

  function syncBtn(btn) {
    const icon = document.getElementById("themeToggleIcon");
    if (!icon) return;
    const dark = document.documentElement.classList.contains("dark");
    icon.textContent = dark ? "dark_mode" : "light_mode";
    btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }

  function attachClick(btn) {
    btn.addEventListener("click", function () {
      const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
      applyTheme(next);
      saveTheme(next);
      syncBtn(btn);
    });
  }

  /* ── public API ───────────────────────────────────────────── */
  let mounted = false;

  window.FIATheme = {
    /**
     * Render the toggle button inside `container`.
     * Call this once, inside DOMContentLoaded.
     */
    mount(container) {
      if (mounted || document.getElementById("themeToggle")) {
        mounted = true;
        return;
      }
      const btn = buildBtn("inline");
      container.appendChild(btn);
      syncBtn(btn);
      attachClick(btn);
      mounted = true;
    },
  };

  /* ── auto-fallback: floating button if mount() not called ─── */
  document.addEventListener("DOMContentLoaded", function () {
    if (mounted) return;
    if (document.getElementById("themeToggle")) return;

    const btn = buildBtn("floating");
    document.body.appendChild(btn);
    syncBtn(btn);
    attachClick(btn);
    mounted = true;
  });
})();
