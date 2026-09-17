(function () {
  "use strict";
  const carousel = document.getElementById("carousel");
  if (!carousel) return;
  const slides = carousel.querySelectorAll(".carousel-slide");
  let activeSlide = 0;
  setInterval(() => {
    slides[activeSlide].classList.remove("active");
    activeSlide = (activeSlide + 1) % slides.length;
    slides[activeSlide].classList.add("active");
  }, 5000);
})();
