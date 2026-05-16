"use client";

/**
 * AshField — drifting white powder / ash particles.
 *
 * Slow downward drift with horizontal wobble. Particles are tiny, mostly
 * white with slight bone tint, additive-blended so overlaps glow softly.
 * Wraps invisibly via edge-fade in the shader.
 *
 * For the "ghosts + powder + ash" hero atmosphere.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  count?: number;
  spread?: number;
  /** Downward drift speed in world units / second. */
  drift?: number;
};

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uDrift;
  uniform float uSpread;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // downward drift (subtract). wrap when below bbox.
    float t = uTime * uDrift + aSeed * 100.0;
    pos.y = mod(pos.y - t, uSpread) - uSpread * 0.5;

    // gentle wobble — ash drifts side-to-side
    pos.x += sin(uTime * 0.4 + aSeed * 6.2831) * 0.45;
    pos.z += cos(uTime * 0.35 + aSeed * 6.2831) * 0.3;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (260.0 / -mv.z);

    // soft fade at top/bottom of bbox so wrap is invisible
    float y01 = (pos.y / uSpread) + 0.5;
    vAlpha = smoothstep(0.0, 0.18, y01) * (1.0 - smoothstep(0.82, 1.0, y01));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    alpha *= alpha;
    gl_FragColor = vec4(uColor, alpha * vAlpha * 0.7);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

export default function AshField({
  count = 400,
  spread = 20,
  drift = 0.35,
}: Props) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread * 1.6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5;
      sizes[i] = 1.0 + Math.random() * 2.2;
      seeds[i] = Math.random();
    }
    return { positions, sizes, seeds };
  }, [count, spread]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDrift: { value: drift },
      uSpread: { value: spread },
      uColor: { value: new THREE.Color("#f4f1ea") },
    }),
    [drift, spread]
  );

  useFrame((_, dt) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += dt;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
