"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type V3 = [number, number, number];

// Deterministic pseudo-random so the island looks the same on every load
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ============================================================
   OCEAN: low-poly animated waves, lighter near the island
   ============================================================ */
export function Ocean() {
  const { geo, basePos } = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 220, 56, 56);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const near = new THREE.Color("#7dd3fc");
    const far = new THREE.Color("#0ea5e9");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const d = Math.hypot(pos.getX(i), pos.getY(i));
      c.copy(near).lerp(far, THREE.MathUtils.smoothstep(d, 24, 70));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geo: g, basePos: Float32Array.from(pos.array as ArrayLike<number>) };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = basePos[i * 3];
      const y = basePos[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.22 + t * 1.1) * 0.18 + Math.cos(y * 0.27 + t * 0.9) * 0.18);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh geometry={geo} position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.35} metalness={0.05} />
    </mesh>
  );
}

/* White foam that pulses around the island edge */
export function ShoreFoam() {
  const a = useRef<THREE.MeshBasicMaterial>(null);
  const b = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (a.current) a.current.opacity = 0.55 + 0.25 * Math.sin(t * 1.6);
    if (b.current) b.current.opacity = 0.3 + 0.2 * Math.sin(t * 1.6 + Math.PI);
  });
  return (
    <>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[44.2, 0.05, 40.2]} />
        <meshBasicMaterial ref={a} color="#ffffff" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[46.6, 0.05, 42.6]} />
        <meshBasicMaterial ref={b} color="#ffffff" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ============================================================
   SKY: drifting clouds (kept off to the sides so they never block the view)
   ============================================================ */
const PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 1.5],
  [1.4, -0.2, 0.2, 1.1],
  [-1.4, -0.15, -0.1, 1.2],
  [0.6, 0.5, 0, 1.0],
  [-0.7, 0.45, 0.3, 0.9],
];

function Cloud({
  position,
  scale,
  speed,
  axis,
}: {
  position: V3;
  scale: number;
  speed: number;
  axis: "x" | "z";
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.position[axis] += speed * Math.min(delta, 0.05);
    if (g.position[axis] > 60) g.position[axis] = -60;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {PUFFS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color="#ffffff" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function Clouds() {
  const items = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const alongX = i < 5;
        const position: V3 = alongX
          ? [rand(i + 1) * 120 - 60, 6.5 + rand(i + 9) * 3.5, -(26 + rand(i + 20) * 30)]
          : [-(28 + rand(i + 30) * 28), 6.5 + rand(i + 9) * 3.5, rand(i + 40) * 100 - 50];
        return {
          position,
          scale: 0.9 + rand(i + 5) * 0.9,
          speed: 0.4 + rand(i + 3) * 0.4,
          axis: (alongX ? "x" : "z") as "x" | "z",
        };
      }),
    []
  );
  return (
    <>
      {items.map((c, i) => (
        <Cloud key={i} {...c} />
      ))}
    </>
  );
}

/* ============================================================
   SEAGULLS circling over the island (positive speed = counter-clockwise)
   ============================================================ */
function Seagull({
  radius,
  height,
  speed,
  phase,
}: {
  radius: number;
  height: number;
  speed: number;
  phase: number;
}) {
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = phase + t * speed;
    if (root.current) {
      root.current.position.set(
        Math.cos(a) * radius,
        height + Math.sin(t * 1.3 + phase) * 0.4,
        Math.sin(a) * radius
      );
      root.current.rotation.y = -(a + Math.PI / 2);
    }
    const flap = Math.sin(t * 9 + phase) * 0.7;
    if (left.current) left.current.rotation.x = flap;
    if (right.current) right.current.rotation.x = -flap;
  });

  return (
    <group ref={root} scale={1.7}>
      <mesh>
        <boxGeometry args={[0.5, 0.14, 0.16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.3, 0.04, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.4, 0.03, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.12, 6]} />
        <meshStandardMaterial color="#fb923c" />
      </mesh>
      <group ref={left} position={[0, 0.03, -0.07]}>
        <mesh position={[0, 0, -0.35]}>
          <boxGeometry args={[0.22, 0.03, 0.7]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      </group>
      <group ref={right} position={[0, 0.03, 0.07]}>
        <mesh position={[0, 0, 0.35]}>
          <boxGeometry args={[0.22, 0.03, 0.7]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      </group>
    </group>
  );
}

export function Seagulls() {
  return (
    <>
      <Seagull radius={14} height={8} speed={0.35} phase={0} />
      <Seagull radius={19} height={9.5} speed={0.28} phase={2.1} />
      <Seagull radius={11} height={7.2} speed={0.42} phase={4.2} />
      <Seagull radius={23} height={8.6} speed={0.24} phase={5.3} />
    </>
  );
}

/* ============================================================
   SAILBOATS cruising around the island
   ============================================================ */
function Sailboat({
  rx,
  rz,
  speed,
  phase,
  hull,
  sail,
}: {
  rx: number;
  rz: number;
  speed: number;
  phase: number;
  hull: string;
  sail: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const sailGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.3, 0);
    s.lineTo(0, 2.4);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const a = phase + t * speed;
    const dir = Math.sign(speed);
    g.position.set(
      Math.cos(a) * rx,
      -0.45 + Math.sin(t * 1.5 + phase * 3) * 0.07,
      Math.sin(a) * rz
    );
    const tx = -Math.sin(a) * rx * dir;
    const tz = Math.cos(a) * rz * dir;
    g.rotation.y = Math.atan2(-tz, tx);
    g.rotation.z = Math.sin(t * 1.5 + phase * 3) * 0.05;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[2, 0.35, 0.8]} />
        <meshStandardMaterial color={hull} roughness={0.5} />
      </mesh>
      <mesh position={[1.4, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.4, 0.9, 4]} />
        <meshStandardMaterial color={hull} roughness={0.5} />
      </mesh>
      <mesh position={[-0.2, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh geometry={sailGeo} position={[-0.15, 0.4, 0]}>
        <meshStandardMaterial color={sail} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Sailboats() {
  return (
    <>
      <Sailboat rx={27} rz={25} speed={0.06} phase={0} hull="#ef4444" sail="#ffffff" />
      <Sailboat rx={31} rz={28} speed={0.045} phase={Math.PI} hull="#facc15" sail="#bfdbfe" />
      <Sailboat rx={29} rz={26.5} speed={-0.05} phase={2.2} hull="#8b5cf6" sail="#fde68a" />
    </>
  );
}

/* ============================================================
   WINDMILL + LIGHTHOUSE
   ============================================================ */
export function Windmill({ position }: { position: V3 }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (blades.current) blades.current.rotation.z += Math.min(delta, 0.05) * 1.2;
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.3, 3.6, 8]} />
        <meshStandardMaterial color="#fef3c7" flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <coneGeometry args={[1.1, 1.4, 8]} />
        <meshStandardMaterial color="#dc2626" flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 1.22]}>
        <boxGeometry args={[0.55, 1, 0.06]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      <mesh position={[0, 2.5, 0.98]}>
        <boxGeometry args={[0.4, 0.5, 0.06]} />
        <meshStandardMaterial color="#7dd3fc" />
      </mesh>
      <group ref={blades} position={[0, 3.7, 1.1]}>
        <mesh>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
            <mesh position={[0, 1.3, 0]} castShadow>
              <boxGeometry args={[0.45, 2.4, 0.05]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 1.3, 0.03]}>
              <boxGeometry args={[0.06, 2.4, 0.04]} />
              <meshStandardMaterial color="#b45309" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function Lighthouse({ position }: { position: V3 }) {
  const beam = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (beam.current) beam.current.rotation.y += Math.min(delta, 0.05) * 1.4;
  });
  return (
    <group position={position}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * 1.2 + 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1 - (i + 1) * 0.09, 1 - i * 0.09, 1.2, 12]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ef4444" : "#ffffff"} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 4.88, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.14, 12]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 5.35, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.8, 10]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 6.1, 0]} castShadow>
        <coneGeometry args={[0.6, 0.8, 10]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <group ref={beam} position={[0, 5.35, 0]}>
        {[0, Math.PI].map((r) => (
          <mesh key={r} position={[Math.cos(r) * 2, 0, 0]} rotation={[0, 0, r === 0 ? Math.PI / 2 : -Math.PI / 2]}>
            <coneGeometry args={[0.55, 4, 12, 1, true]} />
            <meshBasicMaterial
              color="#fef08a"
              transparent
              opacity={0.22}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ============================================================
   ISLAND PROPS: grass, flowers, rocks, bushes, lamps, road dashes
   ============================================================ */
const GRASS: { x: number; z: number; r: number }[] = [
  { x: -15, z: -12, r: 5 },
  { x: 16.5, z: -13, r: 4.5 },
  { x: -15, z: 12, r: 5 },
  { x: 16, z: 11, r: 4.5 },
];

const FLOWER_COLORS = ["#f472b6", "#facc15", "#ffffff", "#fb7185", "#a78bfa"];

const ROCKS: { p: V3; s: number }[] = [
  { p: [-18, 0.3, -3], s: 0.8 },
  { p: [18, 0.3, 3.5], s: 1 },
  { p: [-6, 0.3, -14], s: 0.7 },
  { p: [7, 0.3, 14], s: 0.9 },
  { p: [16, 0.3, -8.5], s: 0.6 },
  { p: [-17, 0.3, 4], s: 0.75 },
];

const BUSHES: { p: V3; s: number }[] = [
  { p: [-8, 0.45, -7], s: 0.9 },
  { p: [-10, 0.4, -5], s: 0.7 },
  { p: [8, 0.45, -7], s: 1 },
  { p: [-8, 0.45, 9], s: 0.8 },
  { p: [9, 0.45, 7], s: 0.9 },
  { p: [11.5, 0.4, 7], s: 0.65 },
];

const LAMPS: V3[] = [
  [2.4, 0, -6],
  [-2.4, 0, 6],
  [6, 0, -2.4],
  [-6, 0, 2.4],
];

export function IslandProps() {
  const flowers = useMemo(() => {
    const list: { p: V3; color: string; h: number }[] = [];
    GRASS.forEach((g, gi) => {
      for (let k = 0; k < 8; k++) {
        const ang = rand(gi * 40 + k) * Math.PI * 2;
        const rad = Math.sqrt(rand(gi * 40 + k + 100)) * g.r * 0.85;
        list.push({
          p: [g.x + Math.cos(ang) * rad, 0, g.z + Math.sin(ang) * rad],
          color: FLOWER_COLORS[Math.floor(rand(gi * 40 + k + 200) * FLOWER_COLORS.length)],
          h: 0.4 + rand(gi * 40 + k + 300) * 0.3,
        });
      }
    });
    return list;
  }, []);

  const zDashes = useMemo(() => {
    const out: number[] = [];
    for (let z = -7.2; z <= 7.2; z += 1.6) if (Math.abs(z) > 2.2) out.push(z);
    return out;
  }, []);

  return (
    <group>
      {/* Grass patches */}
      {GRASS.map((g, i) => (
        <group key={i} position={[g.x, 0, g.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0, 0.015]} receiveShadow>
            <circleGeometry args={[g.r, 32]} />
            <meshStandardMaterial color="#86efac" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.02]} receiveShadow>
            <circleGeometry args={[g.r * 0.7, 32]} />
            <meshStandardMaterial color="#bbf7d0" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Flowers */}
      {flowers.map((f, i) => (
        <group key={i} position={f.p}>
          <mesh position={[0, f.h / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, f.h, 5]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
          <mesh position={[0, f.h + 0.05, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={f.color} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Rocks and bushes */}
      {ROCKS.map((r, i) => (
        <mesh key={i} position={r.p} scale={r.s} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#94a3b8" flatShading roughness={0.9} />
        </mesh>
      ))}
      {BUSHES.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s} castShadow>
          <icosahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial color="#16a34a" flatShading roughness={0.8} />
        </mesh>
      ))}

      {/* Lamp posts */}
      {LAMPS.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.16, 10]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 2.2, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 2.35, 0]}>
            <sphereGeometry args={[0.24, 12, 12]} />
            <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}

      {/* Road dashes */}
      {zDashes.map((z) => (
        <mesh key={`z${z}`} position={[0, 0.025, z]}>
          <boxGeometry args={[0.14, 0.02, 0.7]} />
          <meshStandardMaterial color="#fff7ed" />
        </mesh>
      ))}
      {zDashes.map((x) => (
        <mesh key={`x${x}`} position={[x, 0.025, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.14]} />
          <meshStandardMaterial color="#fff7ed" />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   CAR: dust puffs when speeding + extra body details
   ============================================================ */
export function DustTrail({
  carPosRef,
  velocityRef,
  angleRef,
}: {
  carPosRef: React.MutableRefObject<THREE.Vector3>;
  velocityRef: React.MutableRefObject<number>;
  angleRef: React.MutableRefObject<number>;
}) {
  const N = 18;
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const ages = useRef<number[]>(Array(N).fill(-1));
  const next = useRef(0);
  const timer = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    timer.current += dt;

    if (velocityRef.current > 6 && timer.current > 0.045) {
      timer.current = 0;
      const i = next.current;
      next.current = (i + 1) % N;
      const m = meshes.current[i];
      if (m) {
        const a = angleRef.current;
        m.position.set(
          carPosRef.current.x + Math.sin(a) * 1.5 + (Math.random() - 0.5) * 0.5,
          0.25,
          carPosRef.current.z + Math.cos(a) * 1.5 + (Math.random() - 0.5) * 0.5
        );
        ages.current[i] = 0;
      }
    }

    for (let i = 0; i < N; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const age = ages.current[i];
      if (age < 0) {
        m.visible = false;
        continue;
      }
      const nextAge = age + dt;
      if (nextAge > 0.7) {
        ages.current[i] = -1;
        m.visible = false;
        continue;
      }
      ages.current[i] = nextAge;
      const k = nextAge / 0.7;
      m.visible = true;
      m.scale.setScalar(0.25 + k * 0.9);
      m.position.y = 0.25 + k * 0.5;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k);
    }
  });

  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          visible={false}
        >
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#fff7ed" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

export function CarDetails() {
  const glass = { color: "#38bdf8", emissive: "#0ea5e9", emissiveIntensity: 0.15 };
  return (
    <group>
      {/* Windows */}
      <mesh position={[0, 1.02, -0.56]}>
        <boxGeometry args={[1.0, 0.34, 0.03]} />
        <meshStandardMaterial {...glass} roughness={0.1} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.02, 0.76]}>
        <boxGeometry args={[1.0, 0.34, 0.03]} />
        <meshStandardMaterial {...glass} roughness={0.1} metalness={0.3} />
      </mesh>
      {[-0.63, 0.63].map((x) => (
        <mesh key={x} position={[x, 1.02, 0.1]}>
          <boxGeometry args={[0.03, 0.3, 0.9]} />
          <meshStandardMaterial {...glass} roughness={0.1} metalness={0.3} />
        </mesh>
      ))}

      {/* Hood stripes */}
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.832, -0.92]}>
          <boxGeometry args={[0.16, 0.01, 0.7]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Bumpers */}
      <mesh position={[0, 0.3, -1.3]}>
        <boxGeometry args={[1.55, 0.14, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 0.3, 1.3]}>
        <boxGeometry args={[1.55, 0.14, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Tail lights */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.55, 1.31]}>
          <boxGeometry args={[0.3, 0.16, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* Number plate */}
      <mesh position={[0, 0.4, 1.32]}>
        <boxGeometry args={[0.62, 0.2, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Text position={[0, 0.4, 1.34]} fontSize={0.14} color="#1e293b" anchorX="center" anchorY="middle">
        PAUL
      </Text>

      {/* Hub caps */}
      {(
        [
          [-0.8, 0.32, -0.8],
          [0.8, 0.32, -0.8],
          [-0.8, 0.32, 0.8],
          [0.8, 0.32, 0.8],
        ] as V3[]
      ).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.32, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}