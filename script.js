// Form submit → toast notification
document.getElementById('orderForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
  this.reset();
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Header shadow on scroll
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(92,58,30,.12)' : 'none';
});
