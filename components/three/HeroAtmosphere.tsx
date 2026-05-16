"use client";

/**
 * Hero atmosphere — R3F canvas with white ash drifting down,
 * plus CSS-rendered water-droplet streaks falling vertically.
 *
 * Particle density drops on small viewports. Droplets are pure CSS
 * (cheaper than a second Points geometry and gives crisper streaks).
 */

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import AshField from "./AshField";

export default function HeroAtmosphere() {
  const [ashCount, setAshCount] = useState(400);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setAshCount(120);
      else if (w < 1024) setAshCount(250);
      else setAshCount(400);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // pre-compute droplet metadata so positions/timings are stable across renders
  const droplets = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: Math.random() * 100,            // %
        delay: Math.random() * 6,              // s
        duration: 2.6 + Math.random() * 2.4,   // s
        opacity: 0.18 + Math.random() * 0.22,
        height: 60 + Math.floor(Math.random() * 90), // px
        key: i,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* R3F: white ash powder */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <AshField count={ashCount} />
      </Canvas>

      {/* CSS: water-droplet streaks falling */}
      <div className="absolute inset-0 overflow-hidden">
        {droplets.map((d) => (
          <span
            key={d.key}
            className="absolute -top-32 w-px bg-gradient-to-b from-transparent via-bone/80 to-transparent
                       droplet-fall"
            style={{
              left: `${d.left}%`,
              height: `${d.height}px`,
              opacity: d.opacity,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
