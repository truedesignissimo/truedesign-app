"use client";

import { useEffect, useState } from "react";

const HERO_SLIDES = [
  "/Assets/home-landscape.jpg",
  "/Assets/hero/true-pond.jpg",
  "/Assets/hero/true-showroom.jpg",
  "/Assets/hero/true-lisa-sea.jpg",
  "/Assets/hero/true-sunset.jpg",
];

function shuffledSlides() {
  const slides = [...HERO_SLIDES];
  for (let index = slides.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [slides[index], slides[swapIndex]] = [slides[swapIndex], slides[index]];
  }
  return slides;
}

export default function HomeHeroSlideshow() {
  const [slides, setSlides] = useState(HERO_SLIDES);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setSlides(shuffledSlides());
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="home-hero-slideshow" aria-hidden="true">
      {slides.map((image, index) => (
        <div
          key={image}
          className={`home-hero-slide${index === activeSlide ? " is-active" : ""}`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ))}
      <div className="home-hero-shade" />
    </div>
  );
}
