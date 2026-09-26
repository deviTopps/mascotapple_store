"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

type Place = {
  id?: string;
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number };
  addressComponents?: { longText: string; types: string[] }[];
  fetchFields: (options: { fields: string[] }) => Promise<unknown>;
};
type PlacesLibrary = { PlaceAutocompleteElement: new () => HTMLElement };
type MapsWindow = Window & {
  google?: { maps: { importLibrary: (name: string) => Promise<PlacesLibrary> } };
  mascotMapsReady?: () => void;
};
let mapsPromise: Promise<PlacesLibrary> | undefined;
function loadPlaces(key: string) {
  if (mapsPromise) return mapsPromise;
  const mapsWindow = window as MapsWindow;
  mapsPromise = new Promise<PlacesLibrary>((resolve, reject) => {
    if (mapsWindow.google?.maps.importLibrary) {
      mapsWindow.google.maps.importLibrary("places").then(resolve, reject);
      return;
    }
    const script = document.createElement("script");
    const timer = window.setTimeout(() => reject(new Error("Location search timed out.")), 15000);
    mapsWindow.mascotMapsReady = () => {
      window.clearTimeout(timer);
      const api = mapsWindow.google?.maps;
      if (api) api.importLibrary("places").then(resolve, reject);
      else reject(new Error("Location search is unavailable."));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key, loading: "async", callback: "mascotMapsReady", v: "weekly", language: "en", region: "GH" })}`;
    script.async = true;
    script.onerror = () => { window.clearTimeout(timer); reject(new Error("Location search is unavailable.")); };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

type Location = { placeId: string; latitude: number; longitude: number };
export default function DeliveryAddress() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const host = useRef<HTMLDivElement>(null);
  const revision = useRef(0);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState(apiKey ? "Loading Google location search…" : "Enter your delivery address below.");

  useEffect(() => {
    if (!apiKey) return;
    let active = true;
    let widget: HTMLElement | undefined;
    const selected = async (event: Event) => {
      const prediction = (event as Event & { placePrediction?: { toPlace: () => Place } }).placePrediction;
      if (!prediction) return;
      const current = ++revision.current;
      setLocation(null);
      setStatus("Finding your address…");
      try {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["id", "formattedAddress", "location", "addressComponents"] });
        if (!active || current !== revision.current) return;
        if (!place.id || !place.formattedAddress || !place.location) throw new Error("Incomplete location.");
        const components = place.addressComponents ?? [];
        const locality = ["locality", "postal_town", "administrative_area_level_2"].map(type => components.find(component => component.types.includes(type))?.longText).find(Boolean) ?? "";
        setAddress(place.formattedAddress);
        setCity(locality);
        setLocation({ placeId: place.id, latitude: place.location.lat(), longitude: place.location.lng() });
        setStatus("Location selected. Check the address and add any delivery instructions below.");
      } catch {
        if (active && current === revision.current) setStatus("We couldn’t find that address. Try another suggestion or enter it below.");
      }
    };
    const failed = () => { if (active) setStatus("Google location search is unavailable. You can enter your address below."); };
    loadPlaces(apiKey).then(library => {
      if (!active || !host.current) return;
      widget = new library.PlaceAutocompleteElement();
      widget.setAttribute("aria-label", "Search for your delivery location with Google");
      widget.addEventListener("gmp-select", selected);
      widget.addEventListener("gmp-error", failed);
      host.current.replaceChildren(widget);
      setStatus("Search for your area, street, or a nearby landmark.");
    }).catch(failed);
    return () => { active = false; widget?.removeEventListener("gmp-select", selected); widget?.removeEventListener("gmp-error", failed); widget?.remove(); };
  }, [apiKey]);

  function edited() {
    revision.current += 1;
    setLocation(null);
    setStatus("Using your manually entered address.");
  }
  return <div className="delivery-address">
    {apiKey && <div className="location-search"><h3><MapPin size={17} aria-hidden="true" /> Find your delivery location</h3><div ref={host} className="google-place-input" /></div>}
    <p className="location-status" role="status">{status}</p>
    {location && <a className="location-map-link" href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}&query_place_id=${encodeURIComponent(location.placeId)}`} target="_blank" rel="noopener noreferrer">View selected location in Google Maps ↗</a>}
    <input type="hidden" name="location" value={location ? JSON.stringify(location) : ""} />
    <label>Delivery address<textarea name="address" autoComplete="street-address" required minLength={8} maxLength={500} rows={3} value={address} onChange={event => { setAddress(event.target.value); edited(); }} /></label>
    <label>Town / city<input name="city" autoComplete="address-level2" required minLength={2} maxLength={100} value={city} onChange={event => { setCity(event.target.value); edited(); }} /></label>
  </div>;
}
