"use client";

/**
 * Drifting dust embers — Three.js Points with a custom shader.
 *
 * Look: tiny soft-edged sparks, semi-transparent, drifting slowly upward
 * with a gentle horizontal wobble. Two tints (warm gold + faint smoke-purple)
 * mixed across the field for atmospheric depth.
 *
 * Tweak knobs:
 *   - `count`: particle density (drops on mobile via prop)
 *   - `spread`: bounding-box size in world units
 *   - `drift`: upward speed (units / sec)
 *   - shader `wobbleAmp`: horizontal wander amplitude
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  count?: number;
  spread?: number;
  drift?: number;
};

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aTint;
  uniform float uTime;
  uniform float uDrift;
  uniform float uSpread;
  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 pos = position;

    // upward drift, wrap around when above bbox
    float t = uTime * uDrift + aSeed * 100.0;
    pos.y = mod(pos.y + t, uSpread) - uSpread * 0.5;

    // gentle horizontal wobble — different per particle via aSeed
    float wobbleAmp = 0.35;
    pos.x += sin(uTime * 0.3 + aSeed * 6.2831) * wobbleAmp;
    pos.z += cos(uTime * 0.25 + aSeed * 6.2831) * wobbleAmp * 0.6;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // size attenuated by depth so far embers look smaller
    gl_PointSize = aSize * (300.0 / -mv.z);

    // fade near top + bottom of bbox so wrap is invisible
    float y01 = (pos.y / uSpread) + 0.5;
    float edge = smoothstep(0.0, 0.15, y01) * (1.0 - smoothstep(0.85, 1.0, y01));
    vAlpha = edge;
    vTint = aTint;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorGold;
  uniform vec3 uColorSmoke;
  varying float vAlpha;
  varying float vTint;

  void main() {
    // soft circular sprite — distance from point center
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    // hot core
    alpha *= alpha;

    vec3 color = mix(uColorSmoke, uColorGold, vTint);
    gl_FragColor = vec4(color, alpha * vAlpha * 0.9);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

export default function ParticleField({
  count = 600,
  spread = 18,
  drift = 0.12,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, seeds, tints } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const tints = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // distribute through a flat-ish slab so the camera sees a deep field
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread * 1.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
      // varied sizes — most small, a few bigger embers
      sizes[i] = Math.random() < 0.1 ? 5 + Math.random() * 4 : 1.2 + Math.random() * 2.5;
      seeds[i] = Math.random();
      // ~70% gold, 30% smoke purple
      tints[i] = Math.random() < 0.7 ? 1 : 0;
    }
    return { positions, sizes, seeds, tints };
  }, [count, spread]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDrift: { value: drift },
      uSpread: { value: spread },
      uColorGold: { value: new THREE.Color("#d6b687") },
      uColorSmoke: { value: new THREE.Color("#6b4d7a") },
    }),
    [drift, spread]
  );

  useFrame((_, dt) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += dt;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 1]} />
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
