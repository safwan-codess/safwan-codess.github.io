// Safwan Abdulla C P - Personal Website
// Lightweight vanilla JavaScript for gentle scroll animations

document.addEventListener('DOMContentLoaded', () => {
  const animatedSections = document.querySelectorAll('.fade-in-section');

  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedSections.forEach(section => {
      sectionObserver.observe(section);
    });
  } else {
    // Fallback for older browsers
    animatedSections.forEach(section => {
      section.classList.add('is-visible');
    });
  }
});
