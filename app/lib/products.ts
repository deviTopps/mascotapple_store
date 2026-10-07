export type Product = {
  slug: string;
  name: string;
  tag: string;
  description: string;
  longDescription: string;
  price: string;
  priceValue: number | null;
  category: string;
  visual: string;
  tone: string;
  image: string;
  imageAlt: string;
  colorImages?: { color: string; image: string; imageAlt: string }[];
  highlights: string[];
  options?: { id: string; label: string; values: string[] }[];
};

export const products: Product[] = [
  {
    slug: "iphone-17-pro",
    name: "iPhone 17 Pro",
    tag: "New",
    description: "Pro power. Refined.",
    longDescription: "A powerful everyday phone with a versatile camera system and a refined design made to feel at home in your hand.",
    price: "From GH₵999",
    priceValue: 999,
    category: "iPhone",
    visual: "phone-pro",
    tone: "sand",
    image: "/products/51GOhI8bhHL._AC_UY436_FMwebp_QL65_.webp",
    imageAlt: "iPhone Pro phones in dark blue, silver, and orange, shown from the front and back",
    highlights: ["Pro performance for demanding apps", "A versatile camera system", "Designed for everyday use"],
  },
  {
    slug: "iphone-blue",
    name: "iPhone Blue",
    tag: "Featured",
    description: "A blue finish with a dual-camera design.",
    longDescription: "A blue finish with a dual-camera design. Contact us to confirm the model, storage options, and current price.",
    price: "Contact for price",
    priceValue: null,
    category: "iPhone",
    visual: "phone-pro",
    tone: "sand",
    image: "/products/61aEBeER-+L._AC_UY436_FMwebp_QL65_.webp",
    imageAlt: "Blue iPhone shown from the front and back",
    highlights: ["Contact us for model and storage details", "Ask about current pricing and availability"],
  },
  {
    slug: "iphone-pro-gold",
    name: "iPhone Pro Gold",
    tag: "Featured",
    description: "A gold-tone finish with a triple-camera design.",
    longDescription: "A gold-tone finish with a triple-camera design. Contact us to confirm the model, storage options, and current price.",
    price: "Contact for price",
    priceValue: null,
    category: "iPhone",
    visual: "phone-pro",
    tone: "sand",
    image: "/products/51wv+uPzIDL._AC_UY436_FMwebp_QL65_.webp",
    imageAlt: "Gold-tone iPhone Pro shown from the front and back",
    highlights: ["Contact us for model and storage details", "Ask about current pricing and availability"],
  },
  {
    slug: "iphone-pro-purple",
    name: "iPhone Pro Purple",
    tag: "Featured",
    description: "A deep purple finish with a triple-camera design.",
    longDescription: "A deep purple finish with a triple-camera design. Contact us to confirm the model, storage options, and current price.",
    price: "Contact for price",
    priceValue: null,
    category: "iPhone",
    visual: "phone-pro",
    tone: "sand",
    image: "/products/51KLILQ67nL._AC_UY436_FMwebp_QL65_.webp",
    imageAlt: "Purple iPhone Pro shown from the front and back",
    highlights: ["Contact us for model and storage details", "Ask about current pricing and availability"],
  },
  {
    slug: "macbook-air",
    name: "MacBook Air",
    tag: "Bestseller",
    description: "Light. Fast. Brilliant.",
    longDescription: "A remarkably portable laptop for getting through work, study, and creative projects, wherever the day takes you.",
    price: "From GH₵1099",
    priceValue: 1099,
    category: "Mac",
    visual: "macbook",
    tone: "blue",
    image: "/products/71hplUzm3RL._AC_UY436_FMwebp_QL65_.webp",
    imageAlt: "MacBook Air viewed from the front with a blue abstract wallpaper",
    highlights: ["Lightweight design for life on the move", "A vivid display for work and entertainment", "Performance for everyday multitasking"],
  },
  {
    "slug": "macbook-pro-silver",
    "name": "MacBook Pro Silver",
    "tag": "Featured",
    "description": "Contact us for available configurations.",
    "longDescription": "MacBook Pro Silver. Contact us to confirm the model, specifications, and current availability.",
    "price": "Contact for price",
    "priceValue": null,
    "category": "Mac",
    "visual": "macbook",
    "tone": "blue",
    "image": "/products/51UqhdozNIL._AC_UY436_FMwebp_QL65_.webp",
    "imageAlt": "Silver MacBook Pro viewed from the front with a purple abstract wallpaper",
    "highlights": [
      "Ask about available configurations",
      "Contact us for current pricing and availability"
    ]
  },
  {
    "slug": "macbook-pro-dark",
    "name": "MacBook Pro Dark",
    "tag": "Featured",
    "description": "Contact us for available configurations.",
    "longDescription": "MacBook Pro Dark. Contact us to confirm the model, specifications, and current availability.",
    "price": "Contact for price",
    "priceValue": null,
    "category": "Mac",
    "visual": "macbook",
    "tone": "blue",
    "image": "/products/51ZqjuoQFWL._AC_UY436_FMwebp_QL65_.webp",
    "imageAlt": "Dark MacBook Pro viewed from the front with a black abstract wallpaper",
    "highlights": [
      "Ask about available configurations",
      "Contact us for current pricing and availability"
    ]
  },
  {
    "slug": "macbook-air-dark",
    "name": "MacBook Air Dark",
    "tag": "Featured",
    "description": "Contact us for available configurations.",
    "longDescription": "MacBook Air Dark. Contact us to confirm the model, specifications, and current availability.",
    "price": "Contact for price",
    "priceValue": null,
    "category": "Mac",
    "visual": "macbook",
    "tone": "blue",
    "image": "/products/71wBoh636OL._AC_UY436_FMwebp_QL65_.webp",
    "imageAlt": "Dark MacBook Air viewed from the front with a blue abstract wallpaper",
    "highlights": [
      "Ask about available configurations",
      "Contact us for current pricing and availability"
    ]
  },
  {
    "slug": "imac-green",
    "name": "iMac Green",
    "tag": "Featured",
    "description": "Contact us for available configurations.",
    "longDescription": "iMac Green. Contact us to confirm the model, specifications, and current availability.",
    "price": "Contact for price",
    "priceValue": null,
    "category": "Mac",
    "visual": "macbook",
    "tone": "blue",
    "image": "/products/postcss.config.webp",
    "imageAlt": "Green iMac with a matching keyboard and mouse",
    "highlights": [
      "Ask about available configurations",
      "Contact us for current pricing and availability"
    ]
  },
  {
    slug: "ipad-air",
    name: "iPad Air",
    tag: "New",
    description: "Serious fun.",
    longDescription: "A thin, versatile tablet for sketching, streaming, staying organized, and taking ideas wherever they need to go.",
    price: "From GH₵599",
    priceValue: 599,
    category: "iPad",
    visual: "ipad",
    tone: "violet",
    image: "/ipad-air-card.png",
    imageAlt: "Blue iPad Air shown from the front and back",
    highlights: ["A responsive display for work and play", "Supports Apple Pencil and Magic Keyboard", "Easy to take from desk to sofa"],
  },
  {
    slug: "apple-watch-series-11",
    name: "Apple Watch Series 11",
    tag: "Popular",
    description: "A healthier you, in view.",
    longDescription: "Keep activity, workouts, and everyday notifications close with a watch designed to fit naturally into your routine.",
    price: "From GH₵399",
    priceValue: 399,
    category: "Watch",
    visual: "watch",
    tone: "mint",
    image: "/watch-series-card.jpg",
    imageAlt: "Apple Watch displaying heart rate",
    highlights: ["Activity and workout tracking", "Helpful health insights", "Notifications at a glance"],
  },
  {
    slug: "airpods-pro",
    name: "AirPods Pro",
    tag: "New",
    description: "Sound, tuned to you.",
    longDescription: "Enjoy an immersive listening experience, with thoughtful noise control and a compact case that is easy to bring along.",
    price: "From GH₵249",
    priceValue: 249,
    category: "Audio",
    visual: "airpods",
    tone: "peach",
    image: "/airpods-pro-card.jpg",
    imageAlt: "Pair of white AirPods Pro earbuds",
    highlights: ["Active Noise Cancellation", "Adaptive listening modes", "Compact charging case"],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
