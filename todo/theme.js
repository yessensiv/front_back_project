(() => {
  const storageKey = "front_back_project.todos.theme";
  let theme = "dark";

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") theme = saved;
  } catch {
    // Переключение работает и при недоступном хранилище браузера.
  }

  // Применяем тему до загрузки стилей, чтобы избежать вспышки другой темы.
  document.documentElement.dataset.theme = theme;

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("theme-toggle");

    function updateButton() {
      button.textContent = theme === "dark" ? "☀ Светлая тема" : "☾ Тёмная тема";
      button.setAttribute("aria-pressed", String(theme === "dark"));
    }

    updateButton();
    button.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      updateButton();
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // Выбранная тема действует до закрытия страницы.
      }
    });
  });
})();
