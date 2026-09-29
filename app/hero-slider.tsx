"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import imacImage from "../public/hero/image1-transparent.png";
import headphonesImage from "../public/hero/image0-transparent.png";
import iphonesImage from "../public/hero/image23-transparent.png";
import laptopsImage from "../public/hero/image24-transparent.png";
import macbookImage from "../public/hero/image25-transparent.png";
import ipadImage from "../public/hero/image12-transparent.png";
import watchImage from "../public/hero/image30-transparent.png";

const slides = [
  { src: imacImage, label: "Brighten your workspace", alt: "Colorful iMac desktop computers shown from the front and back" },
  { src: headphonesImage, label: "Sound all around you", alt: "AirPods Max headphones in a range of colors" },
  { src: iphonesImage, label: "Find your iPhone", alt: "iPhones in black, white, green, blue, and purple", className: "hero-slide-phone" },
  { src: laptopsImage, label: "A color for every day", alt: "Open Apple laptops in silver, pink, yellow, and blue" },
  { src: macbookImage, label: "Space for your best work", alt: "MacBook displaying a blue abstract wallpaper" },
  { src: ipadImage, label: "Make room for creativity", alt: "Colorful iPads with an Apple Pencil and keyboard" },
  { src: watchImage, label: "Ready for your next adventure", alt: "Black Apple Watch with a black sport band" },
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
  const [requested, setRequested] = useState<number[]>([0]);
  const [loaded, setLoaded] = useState<number[]>([]);
  const reducedMotion = useSyncExternalStore(subscribeToMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const rotating = !paused && !hovered && !reducedMotion;
  const activeLoaded = loaded.includes(active);

  useEffect(() => {
    if (!rotating || !activeLoaded) return;
    // Give the visible image bandwidth first, then prepare just the next slide.
    const timer = window.setTimeout(() => {
      const next = (active + 1) % slides.length;
      setRequested((previous) => previous.includes(next) ? previous : [...previous, next]);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [active, activeLoaded, rotating]);

  useEffect(() => {
    if (!rotating || !activeLoaded) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % slides.length), 4000);
    return () => window.clearTimeout(timer);
  }, [active, activeLoaded, rotating]);

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
          <div key={slide.label} className={`hero-slide ${slide.className ?? ""} ${index === active ? "is-active" : ""}`}
            role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} aria-hidden={index !== active}>
            {(index === active || requested.includes(index)) && <Image className="hero-image" src={slide.src} alt={slide.alt} fill
              sizes="(max-width: 760px) calc(100vw - 40px), 58vw" placeholder="blur"
              loading="eager" fetchPriority={index === active ? "high" : "low"}
              onLoad={() => setLoaded((previous) => previous.includes(index) ? previous : [...previous, index])} />}
          </div>
        ))}
      </div>
      <div className="hero-slider-footer">
        <p className="hero-slide-caption"><span className="hero-slide-number">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>{slides[active].label}</p>
        <div className="hero-slider-controls">
        <button type="button" aria-label="Previous image" onClick={() => selectSlide(active - 1)}><ChevronLeft size={17} /></button>
        <div className="hero-slider-dots">
          {slides.map((slide, index) => <button type="button" key={slide.label} aria-label={`Show image ${index + 1}: ${slide.alt}`}
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
