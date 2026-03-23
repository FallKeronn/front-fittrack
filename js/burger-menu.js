document.addEventListener('DOMContentLoaded', () => {
   const burgerButton = document.getElementById('burgerButton');
   const sidebar = document.getElementById('sidebarMenu');
   const overlay = document.getElementById('sidebarOverlay');

   if (!burgerButton || !sidebar || !overlay) {
      return;
   }

   const mediaQuery = window.matchMedia('(max-width: 992px)');

   function openSidebar() {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
      burgerButton.classList.add('is-active');
      burgerButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
   }

   function closeSidebar() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
      burgerButton.classList.remove('is-active');
      burgerButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
   }

   function toggleSidebar() {
      if (sidebar.classList.contains('is-open')) {
         closeSidebar();
      } else {
         openSidebar();
      }
   }

   burgerButton.addEventListener('click', toggleSidebar);
   overlay.addEventListener('click', closeSidebar);

   document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
         closeSidebar();
      }
   });

   sidebar.querySelectorAll('.menu__item').forEach((item) => {
      item.addEventListener('click', () => {
         if (mediaQuery.matches) {
            closeSidebar();
         }
      });
   });

   window.addEventListener('resize', () => {
      if (!mediaQuery.matches) {
         closeSidebar();
      }
   });
});