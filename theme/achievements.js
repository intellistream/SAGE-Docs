(() => {
  const storageKey = "sage-achievements-language";
  const button = document.getElementById("sage-language-toggle");

  const setLanguage = (language) => {
    const selected = language === "en" ? "en" : "zh";
    document.documentElement.lang = selected === "zh" ? "zh-CN" : "en";

    document.querySelectorAll("[data-en][data-zh]").forEach((node) => {
      node.textContent = node.dataset[selected];
    });

    button.textContent = selected === "zh" ? "EN" : "中文";
    button.setAttribute(
      "aria-label",
      selected === "zh" ? "Switch to English" : "切换为中文",
    );
    localStorage.setItem(storageKey, selected);
  };

  button.addEventListener("click", () => {
    setLanguage(document.documentElement.lang.startsWith("zh") ? "en" : "zh");
  });

  setLanguage(localStorage.getItem(storageKey) || "zh");
})();
