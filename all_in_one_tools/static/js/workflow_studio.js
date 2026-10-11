(() => {
  const cards = [...document.querySelectorAll('[data-workflow]')];
  const search = document.getElementById('workflowSearch');
  const count = document.getElementById('workflowCount');
  const empty = document.getElementById('workflowEmpty');
  const filters = [...document.querySelectorAll('.workflow-filter')];
  let activeCategory = 'all';

  function render() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesSearch = !query || card.dataset.search.toLowerCase().includes(query);
      card.hidden = !matchesCategory || !matchesSearch;
      if (!card.hidden) visible += 1;
    });
    count.textContent = `${visible} workflow${visible === 1 ? '' : 's'}`;
    empty.hidden = visible !== 0;
  }

  filters.forEach((button) => button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    filters.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle('active', isActive);
      filter.setAttribute('aria-pressed', String(isActive));
    });
    render();
  }));
  search.addEventListener('input', render);
})();