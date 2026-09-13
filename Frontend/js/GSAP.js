/* =========================================================
   GSAP ANIMATIONS
   ========================================================= */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


/* =========================================================
   HERO / HEADER
   ========================================================= */

const heroTimeline = gsap.timeline();

if (document.querySelector(".nav-logo img")) {
  heroTimeline.from(".nav-logo img", {
    y: 80,
    opacity: 0,
    scale: 1.2,
    duration: 1,
    ease: "power2.out"
  });
}

if (document.querySelector(".nav-side img")) {
  heroTimeline.from(".nav-side img", {
    y: 80,
    opacity: 0,
    scale: 1.2,
    duration: 1,
    ease: "power2.out"
  });
}

if (document.querySelector(".content h2")) {
  heroTimeline.from(".content h2", {
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });
}

if (document.querySelector(".content p")) {
  heroTimeline.from(".content p", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out"
  });
}

if (document.querySelector(".cta-link")) {
  heroTimeline.from(".cta-link", {
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });
}


/* =========================================================
   MAIN - SECTION ONE
   ========================================================= */

const sectionOne = document.querySelector(".section-one");
const sectionOneItems = document.querySelectorAll(".section-one li");

if (sectionOne && sectionOneItems.length > 0) {
  gsap.from(sectionOneItems, {
    y: 80,
    opacity: 0,
    duration: 1,
    stagger: 0.3,
    ease: "power2.out",

    scrollTrigger: {
      trigger: sectionOne,
      start: "top 60%"
    }
  });
}


/* =========================================================
   FOOTER
   ========================================================= */

const footer = document.querySelector(".footer-content");

if (footer) {

  const footerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: "top 85%",
      toggleActions: "play none none none"
    }
  });

  if (document.querySelector(".footer-newsletter")) {
    footerTimeline.from(".footer-newsletter", {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    });
  }

  if (document.querySelector(".footer-main")) {
    footerTimeline.from(".footer-main", {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    });
  }

  if (document.querySelector(".footer-bottom")) {
    footerTimeline.from(".footer-bottom", {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    });
  }
}