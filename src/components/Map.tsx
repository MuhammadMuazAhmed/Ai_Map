"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

export default function MapComponent() {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const marker = React.useRef<mapboxgl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    if (!mapContainer.current || map.current) return; // Initialize map only once

    // Set the access token
    mapboxgl.accessToken = MAPBOX_TOKEN || "";

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-122.4, 37.8], // San Francisco
      zoom: 14,
    });

    // Add navigation controls
    const nav = new mapboxgl.NavigationControl();
    map.current.addControl(nav, "top-right");

    // Add scale control
    const scale = new mapboxgl.ScaleControl();
    map.current.addControl(scale);

    // Cleanup on unmount
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Debounced search function
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchQuery
          )}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=poi,address,place,postcode,locality,neighborhood`
        );
        const data = await response.json();
        setSearchResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectLocation = (result: SearchResult) => {
    if (!map.current) return;

    const [lng, lat] = result.center;

    // Fly to the selected location
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 2000,
    });

    // Remove existing marker if any
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({ color: "#8B5CF6" })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Update search query and hide results
    setSearchQuery(result.place_name);
    setShowResults(false);
  };

  return (
    <div className="w-full h-full relative">
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search for a location..."
            className="w-full px-4 py-3 pr-10 rounded-lg bg-white/90 backdrop-blur-md border border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {searchQuery && !isSearching && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectLocation(result)}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm text-gray-800 font-medium">
                  {result.place_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
