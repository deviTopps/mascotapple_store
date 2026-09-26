"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const slides = [
  { src: "/hero-apple-devices-transparent.png", label: "The Apple collection", alt: "MacBook, iPad, iPhone, AirPods, and Apple Watch" },
  { src: "/hero-iphones-transparent.png", label: "Find your iPhone", alt: "Titanium and pink iPhones" },
  { src: "/hero-iphone-13-transparent.png", label: "A color for every you", alt: "iPhone 13 in five colors" },
  { src: "/hero-mac-studio-transparent.png", label: "Space for your best work", alt: "Mac Studio and Studio Display" },
];

function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const rotating = !paused && !hovered && !reducedMotion;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 4000);
    return () => window.clearInterval(timer);
  }, [rotating]);

  function selectSlide(index: number) {
    setPaused(true);
    setActive((index + slides.length) % slides.length);
  }

  return (
    <div className="hero-slider" role="region" aria-roledescription="carousel" aria-label="Featured Apple devices"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(true); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          selectSlide(active + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}>
      <div className="hero-art hero-slides" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
        {slides.map((slide, index) => (
          <div key={slide.src} className={`hero-slide ${index === active ? "is-active" : ""}`}
            role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} aria-hidden={index !== active}>
            <Image className="hero-image" src={slide.src} alt={slide.alt} fill
              sizes="(max-width: 760px) calc(100vw - 40px), 58vw" loading="eager" />
          </div>
        ))}
      </div>
      <div className="hero-slider-footer">
        <p className="hero-slide-caption"><span className="hero-slide-number">{String(active + 1).padStart(2, "0")} / 04</span>{slides[active].label}</p>
        <div className="hero-slider-controls">
        <button type="button" aria-label="Previous image" onClick={() => selectSlide(active - 1)}><ChevronLeft size={17} /></button>
        <div className="hero-slider-dots">
          {slides.map((slide, index) => <button type="button" key={slide.src} aria-label={`Show image ${index + 1}: ${slide.alt}`}
            aria-current={index === active ? "true" : undefined} onClick={() => selectSlide(index)}><span /></button>)}
        </div>
        <button type="button" aria-label="Next image" onClick={() => selectSlide(active + 1)}><ChevronRight size={17} /></button>
        {!reducedMotion && <button type="button" aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          onClick={() => setPaused((value) => !value)}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
        </div>
      </div>
    </div>
  );
}
