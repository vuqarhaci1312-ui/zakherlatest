try {
  if (localStorage.getItem('portfolio-cabin-dark') === '1') {
    document.documentElement.dataset.theme = 'dark'
  }
} catch (e) {}
