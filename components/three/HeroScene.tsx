"use client";

/**
 * R3F Canvas wrapping the particle field for the hero.
 *
 * - Reduces particle count + DPR on small viewports for perf.
 * - dpr capped at 1.5 so retina screens don't melt the GPU.
 * - Pointer-events disabled so the canvas never blocks UI.
 */

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import ParticleField from "./ParticleField";

export default function HeroScene() {
  const [count, setCount] = useState(600);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(150);
      else if (w < 1024) setCount(350);
      else setCount(600);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ParticleField count={count} />
      </Canvas>

      {/* volumetric fog tint behind the headline — pure CSS radial gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 55%, rgba(92, 26, 26, 0.25), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 60%, rgba(42, 26, 58, 0.35), transparent 75%)",
        }}
      />
    </div>
  );
}
