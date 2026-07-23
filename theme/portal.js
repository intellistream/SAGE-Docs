const filters = document.querySelectorAll(".filter");
const repositories = document.querySelectorAll(".repo-row");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;

    filters.forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle("active", active);
      filter.setAttribute("aria-pressed", String(active));
    });

    repositories.forEach((repository) => {
      const categories = repository.dataset.categories.split(" ");
      repository.hidden = selected !== "all" && !categories.includes(selected);
    });
  });
});
