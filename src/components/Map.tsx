"use client";

import * as React from "react";
import dynamic from "next/dynamic";

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Dynamically import the actual map component with SSR disabled
const DynamicMap = dynamic(() => import("./MapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-white text-lg">Loading map...</div>
    </div>
  ),
});

export default function MapComponent() {
  return <DynamicMap />;
}
