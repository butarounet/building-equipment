document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.global-menu__toggle');
  const menuList = document.querySelector('#menu-list');
  const printButton = document.querySelector('#print-button');

  if (menuToggle && menuList) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuList.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => {
      window.print();
    });
  }
});
