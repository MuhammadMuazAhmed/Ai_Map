import MapComponent from "@/components/Map";
import GeminiChat from "@/components/GeminiChat";

export default function Home() {
  return (
    <div className="w-screen h-screen relative">
      <MapComponent />
      <GeminiChat />
    </div>
  );
}
