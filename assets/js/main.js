(function () {
  const btn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-nav-links]');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
})();
