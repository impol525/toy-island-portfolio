"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  User,
  Code2,
  Trophy,
  Mail,
  ExternalLink,
  Zap,
  Download,
  MapPin,
  Award,
  BookOpen,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import {
  Ocean,
  ShoreFoam,
  Clouds,
  Seagulls,
  Sailboats,
  Windmill,
  Lighthouse,
  IslandProps,
  DustTrail,
  CarDetails,
} from "./IslandDecor";

// Brand icons were removed from newer lucide-react releases, so GitHub is inlined.
function Github({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

type ZoneId = "about" | "projects" | "skills" | "contact";

interface ZoneConfig {
  id: ZoneId;
  label: string;
  position: [number, number, number];
  color: string;
}

const ZONES: ZoneConfig[] = [
  { id: "about", label: "ABOUT & EDU", position: [0, 0, -11], color: "#f97316" },
  { id: "projects", label: "PROJECTS", position: [12, 0, 0], color: "#3b82f6" },
  { id: "skills", label: "SKILLS", position: [-12, 0, 0], color: "#10b981" },
  { id: "contact", label: "CONTACT", position: [0, 0, 11], color: "#ec4899" },
];

type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  jump: boolean;
};

// ==========================================
// 3D PIECES
// ==========================================
function ToyTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.2, 8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.1, 1.5, 7]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.85, 1.3, 7]} />
        <meshStandardMaterial color="#4ade80" roughness={0.6} />
      </mesh>
    </group>
  );
}

function KnockableBlocks({ carPosRef }: { carPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const blocks = useMemo(
    () => [
      { pos: new THREE.Vector3(-2.5, 0.5, -3), vel: new THREE.Vector3(), color: "#ef4444" },
      { pos: new THREE.Vector3(-1.2, 0.5, -3), vel: new THREE.Vector3(), color: "#eab308" },
      { pos: new THREE.Vector3(0, 0.5, -3), vel: new THREE.Vector3(), color: "#3b82f6" },
      { pos: new THREE.Vector3(1.2, 0.5, -3), vel: new THREE.Vector3(), color: "#a855f7" },
      { pos: new THREE.Vector3(2.5, 0.5, -3), vel: new THREE.Vector3(), color: "#10b981" },
    ],
    []
  );

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    blocks.forEach((b, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;

      const dist = b.pos.distanceTo(carPosRef.current);
      if (dist < 1.7) {
        tmp.copy(b.pos).sub(carPosRef.current);
        tmp.y = 0;
        if (tmp.lengthSq() > 0.0001) {
          tmp.normalize().multiplyScalar(14 * dt);
          b.vel.add(tmp);
        }
      }

      b.pos.addScaledVector(b.vel, dt);
      b.vel.multiplyScalar(0.92);
      b.pos.y = 0.5;
      b.pos.x = THREE.MathUtils.clamp(b.pos.x, -20, 20);
      b.pos.z = THREE.MathUtils.clamp(b.pos.z, -18, 18);

      mesh.position.copy(b.pos);
      mesh.rotation.x += b.vel.z * dt;
      mesh.rotation.z -= b.vel.x * dt;
    });
  });

  return (
    <group>
      {blocks.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={b.pos.toArray()}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color={b.color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ==========================================
// ZONE LANDMARKS
// ==========================================
function Led({ position, phase }: { position: [number, number, number]; phase: number }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.emissiveIntensity = 0.4 + 1.6 * Math.max(0, Math.sin(clock.elapsedTime * 3 + phase));
    }
  });
  return (
    <mesh position={position}>
      <boxGeometry args={[0.5, 0.08, 0.04]} />
      <meshStandardMaterial ref={ref} color="#10b981" emissive="#10b981" emissiveIntensity={1} />
    </mesh>
  );
}

function MunicipalHall() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 1.8, 2.4]} />
        <meshStandardMaterial color="#fde68a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.7, 1.2, 4]} />
        <meshStandardMaterial color="#c2410c" roughness={0.6} />
      </mesh>
      {[-1.3, -0.45, 0.45, 1.3].map((x) => (
        <mesh key={x} position={[x, 0.8, 1.35]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.6, 10]} />
          <meshStandardMaterial color="#fff7ed" />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 1.21]}>
        <boxGeometry args={[0.7, 1.1, 0.05]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      <mesh position={[2.1, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 3.2, 8]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[2.45, 2.85, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.04]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
    </group>
  );
}

function ResponseStation() {
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const m = beaconRef.current;
    if (!m) return;
    const on = Math.floor(clock.elapsedTime * 3) % 2 === 0;
    const c = on ? "#ef4444" : "#3b82f6";
    m.color.set(c);
    m.emissive.set(c);
  });
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.6, 2.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[3.02, 0.35, 2.22]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[3.3, 0.2, 2.5]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
      <mesh position={[-0.6, 0.5, 1.11]}>
        <boxGeometry args={[1.1, 1.0, 0.05]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* Ambulance */}
      <group position={[2.7, 0, 0.5]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.1, 0.8, 1.9]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.5, -1.05]} castShadow>
          <boxGeometry args={[1.0, 0.55, 0.45]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0.56, 0.65, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.12]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.56, 0.65, 0]}>
          <boxGeometry args={[0.02, 0.12, 0.4]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 1.08, 0.2]}>
          <boxGeometry args={[0.5, 0.15, 0.25]} />
          <meshStandardMaterial ref={beaconRef} color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
        </mesh>
        {(
          [
            [-0.5, 0.22, -0.6],
            [0.5, 0.22, -0.6],
            [-0.5, 0.22, 0.6],
            [0.5, 0.22, 0.6],
          ] as [number, number, number][]
        ).map((pos, i) => (
          <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ServerRacks() {
  const heights = [2.4, 1.9, 2.8];
  return (
    <group>
      {heights.map((h, i) => {
        const x = (i - 1) * 1.15;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.95, h, 0.95]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            {[0.4, 0.8, 1.2, 1.6].filter((y) => y < h - 0.2).map((y, j) => (
              <Led key={j} position={[0, y, 0.49]} phase={i * 1.7 + j * 0.9} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Mailbox() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.6, 10]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[1.6, 0.9, 1.1]} />
        <meshStandardMaterial color="#ec4899" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.3, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.6, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#ec4899" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.8, 0.56]}>
        <boxGeometry args={[1.0, 0.18, 0.04]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.95, 2.2, 0]}>
        <boxGeometry args={[0.08, 0.7, 0.3]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <Float speed={3} rotationIntensity={0.15} floatIntensity={0.8}>
        <mesh position={[0, 3.6, 0]}>
          <boxGeometry args={[0.9, 0.6, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 3.6, 0.03]}>
          <boxGeometry args={[0.3, 0.04, 0.02]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
      </Float>
    </group>
  );
}

function ZoneLandmark({ id }: { id: ZoneId }) {
  switch (id) {
    case "about":
      return (
        <group position={[5.6, 0, -0.5]}>
          <MunicipalHall />
        </group>
      );
    case "projects":
      return (
        <group position={[0, 0, -6.2]}>
          <ResponseStation />
        </group>
      );
    case "skills":
      return (
        <group position={[0, 0, 5.8]}>
          <ServerRacks />
        </group>
      );
    case "contact":
      return (
        <group position={[-5.4, 0, 0]}>
          <Mailbox />
        </group>
      );
  }
}

function ToyCarScene({
  controlsRef,
  teleportTarget,
  clearTeleport,
  onActiveZoneChange,
}: {
  controlsRef: React.MutableRefObject<Controls>;
  teleportTarget: [number, number, number] | null;
  clearTeleport: () => void;
  onActiveZoneChange: (zone: ZoneId | null) => void;
}) {
  const carGroupRef = useRef<THREE.Group>(null);
  const carPosRef = useRef(new THREE.Vector3(0, 0, 2));
  const velocityRef = useRef(0);
  const angleRef = useRef(Math.PI);
  const verticalVelRef = useRef(0);
  const yPosRef = useRef(0);
  const currentZoneRef = useRef<ZoneId | null>(null);
  const camTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (teleportTarget) {
      carPosRef.current.set(teleportTarget[0], 0, teleportTarget[2] + 1.5);
      velocityRef.current = 0;
      clearTeleport();
    }
  }, [teleportTarget, clearTeleport]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const ctrl = controlsRef.current;

    const maxSpeed = ctrl.boost ? 16 : 10;
    const accel = ctrl.boost ? 26 : 16;

    if (ctrl.up) velocityRef.current += accel * dt;
    if (ctrl.down) velocityRef.current -= accel * 0.8 * dt;

    velocityRef.current *= 0.94;
    velocityRef.current = THREE.MathUtils.clamp(velocityRef.current, -7, maxSpeed);

    if (Math.abs(velocityRef.current) > 0.2) {
      const dir = velocityRef.current > 0 ? 1 : -1;
      if (ctrl.left) angleRef.current += 3.0 * dt * dir;
      if (ctrl.right) angleRef.current -= 3.0 * dt * dir;
    }

    if (ctrl.jump && yPosRef.current <= 0.01) {
      verticalVelRef.current = 8.5;
    }
    verticalVelRef.current -= 22 * dt;
    yPosRef.current = Math.max(0, yPosRef.current + verticalVelRef.current * dt);

    carPosRef.current.x -= Math.sin(angleRef.current) * velocityRef.current * dt;
    carPosRef.current.z -= Math.cos(angleRef.current) * velocityRef.current * dt;
    carPosRef.current.x = THREE.MathUtils.clamp(carPosRef.current.x, -18, 18);
    carPosRef.current.z = THREE.MathUtils.clamp(carPosRef.current.z, -16, 16);

    if (carGroupRef.current) {
      carGroupRef.current.position.set(carPosRef.current.x, yPosRef.current, carPosRef.current.z);
      carGroupRef.current.rotation.y = angleRef.current;
      carGroupRef.current.rotation.x = -velocityRef.current * 0.012;
      carGroupRef.current.rotation.z = (ctrl.left ? -1 : ctrl.right ? 1 : 0) * (velocityRef.current * 0.015);
    }

    const aspect = state.size.width / state.size.height;
    const zoom = THREE.MathUtils.clamp(1 + (1.2 - aspect) * 0.9, 1, 1.7);
    camTarget.set(
      carPosRef.current.x + 14 * zoom,
      15 * zoom,
      carPosRef.current.z + 14 * zoom
    );
    state.camera.position.lerp(camTarget, 5 * dt);
    state.camera.lookAt(carPosRef.current.x, 0.5, carPosRef.current.z);

    // Parking: the car must be inside the ring AND slowed down to count.
    // Once parked, it stays parked until the car leaves a slightly wider radius.
    let foundZone: ZoneId | null = null;
    const speed = Math.abs(velocityRef.current);
    for (const z of ZONES) {
      const dx = carPosRef.current.x - z.position[0];
      const dz = carPosRef.current.z - z.position[2];
      const d = Math.sqrt(dx * dx + dz * dz);
      const alreadyHere = currentZoneRef.current === z.id;
      if ((alreadyHere && d < 4.2) || (!alreadyHere && d < 3.2 && speed < 4)) {
        foundZone = z.id;
        break;
      }
    }
    if (foundZone !== currentZoneRef.current) {
      currentZoneRef.current = foundZone;
      onActiveZoneChange(foundZone);
    }
  });

  return (
    <>
      <color attach="background" args={["#bae6fd"]} />
      <fog attach="fog" args={["#bae6fd", 45, 90]} />
      <ambientLight intensity={0.85} color="#fff7ed" />
      <directionalLight
        castShadow
        position={[20, 30, 15]}
        intensity={1.6}
        color="#ffedd5"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />

      {/* Island base */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[42, 1, 38]} />
        <meshStandardMaterial color="#fdba74" roughness={0.85} />
      </mesh>
      {/* Ocean, sky and sea life */}
      <Ocean />
      <ShoreFoam />
      <Clouds />
      <Seagulls />
      <Sailboats />
      <Sparkles count={70} scale={[44, 7, 40]} position={[0, 3.5, 0]} size={5} speed={0.35} opacity={0.8} color="#ffffff" />

      {/* Roads */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.2, 24]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[3.2, 26]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>

      {/* Parking zones */}
      {ZONES.map((z) => (
        <group key={z.id} position={z.position}>
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[2.6, 3.1, 32]} />
            <meshStandardMaterial color={z.color} emissive={z.color} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.6, 32]} />
            <meshStandardMaterial color={z.color} transparent opacity={0.22} />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[2.5, 2.5, 6, 32, 1, true]} />
            <meshBasicMaterial
              color={z.color}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <Float speed={2.5} rotationIntensity={0.1} floatIntensity={0.5}>
            <Text
              position={[0, 2.2, 0]}
              fontSize={0.75}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.08}
              outlineColor="#1e293b"
            >
              {z.label}
            </Text>
          </Float>
          <ZoneLandmark id={z.id} />
        </group>
      ))}

      <KnockableBlocks carPosRef={carPosRef} />
      <IslandProps />
      <Windmill position={[-15, 0, -12]} />
      <Lighthouse position={[16.5, 0, -13]} />
      <DustTrail carPosRef={carPosRef} velocityRef={velocityRef} angleRef={angleRef} />

      <ToyTree position={[-9, 0, -8]} scale={1.1} />
      <ToyTree position={[-11, 0, -6]} scale={0.85} />
      <ToyTree position={[9, 0, -8]} scale={1.2} />
      <ToyTree position={[-9, 0, 8]} scale={1} />
      <ToyTree position={[10, 0, 8]} scale={1.15} />
      <ToyTree position={[12, 0, 6]} scale={0.8} />
      <ToyTree position={[-18, 0, -8]} scale={1.2} />
      <ToyTree position={[-12, 0, -15]} scale={0.9} />
      <ToyTree position={[-17, 0, 10]} scale={1.1} />
      <ToyTree position={[-13, 0, 14.5]} scale={0.85} />
      <ToyTree position={[15, 0, 13.5]} scale={1} />
      <ToyTree position={[18.5, 0, 9.5]} scale={0.8} />

      {/* Car (front faces -Z) */}
      <group ref={carGroupRef} position={[0, 0, 2]}>
        <CarDetails />
        <RoundedBox args={[1.5, 0.65, 2.6]} position={[0, 0.5, 0]} radius={0.15} castShadow>
          <meshStandardMaterial color="#ef4444" roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[1.25, 0.55, 1.3]} position={[0, 1.0, 0.1]} radius={0.12} castShadow>
          <meshStandardMaterial color="#fffbeb" roughness={0.2} />
        </RoundedBox>
        <mesh position={[-0.45, 0.55, -1.31]}>
          <boxGeometry args={[0.3, 0.2, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.45, 0.55, -1.31]}>
          <boxGeometry args={[0.3, 0.2, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} />
        </mesh>
        {(
          [
            [-0.8, 0.32, -0.8],
            [0.8, 0.32, -0.8],
            [-0.8, 0.32, 0.8],
            [0.8, 0.32, 0.8],
          ] as [number, number, number][]
        ).map((pos, idx) => (
          <mesh key={idx} position={pos} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.3, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ==========================================
// 2D OVERLAY PANELS
// ==========================================
const ZONE_META: Record<ZoneId, { title: string; icon: React.ReactNode }> = {
  about: { title: "About & Education", icon: <User size={22} /> },
  projects: { title: "Projects", icon: <Code2 size={22} /> },
  skills: { title: "Skills", icon: <Zap size={22} /> },
  contact: { title: "Contact", icon: <Mail size={22} /> },
};

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="rounded-full border-2 px-3 py-1 text-xs font-bold text-slate-800"
      style={{ borderColor: color, backgroundColor: `${color}22` }}
    >
      {children}
    </span>
  );
}

function ProfilePhoto({ color }: { color: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-slate-900 bg-white"
      style={{ boxShadow: `4px 4px 0 ${color}` }}
    >
      {failed ? (
        <div
          className="flex h-full w-full items-center justify-center text-xl font-black text-slate-900"
          style={{ backgroundColor: `${color}33` }}
        >
          PN
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PORTFOLIO_DATA.photo}
          alt={`Portrait of ${PORTFOLIO_DATA.name}`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function AboutPanel({ color }: { color: string }) {
  const d = PORTFOLIO_DATA;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <ProfilePhoto color={color} />
        <div>
          <h3 className="text-2xl font-black leading-tight text-slate-900">{d.name}</h3>
          <p className="mt-1 font-semibold text-slate-600">{d.role}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{d.objective}</p>

      <div className="rounded-2xl border-2 border-slate-900/10 bg-white/70 p-4">
        <div className="mb-1 flex items-center gap-2 font-bold text-slate-900">
          <BookOpen size={18} style={{ color }} /> Education
        </div>
        <p className="text-sm font-semibold text-slate-800">{d.education.degree}</p>
        <p className="text-sm text-slate-600">{d.education.major}</p>
        <p className="text-sm text-slate-600">{d.education.school}</p>
      </div>

      <div className="rounded-2xl border-2 border-slate-900/10 bg-white/70 p-4">
        <div className="mb-1 flex items-center gap-2 font-bold text-slate-900">
          <Trophy size={18} style={{ color }} /> Certification
        </div>
        <p className="text-sm text-slate-700">{d.certification}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-bold text-slate-900">
          <Award size={18} style={{ color }} /> Trainings & Seminars
        </div>
        <ul className="space-y-1.5 text-sm text-slate-700">
          {d.trainings.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProjectsPanel({ color }: { color: string }) {
  return (
    <div className="space-y-4">
      {PORTFOLIO_DATA.projects.map((p) => (
        <article key={p.title} className="rounded-2xl border-2 border-slate-900/10 bg-white/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black leading-snug text-slate-900">{p.title}</h3>
            <span className="shrink-0 text-xs font-bold text-slate-500">{p.period}</span>
          </div>
          <p className="mb-2 text-sm font-semibold" style={{ color }}>
            {p.role}
          </p>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">{p.desc}</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <Chip key={t} color={color}>
                {t}
              </Chip>
            ))}
          </div>
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 underline decoration-2 underline-offset-4 hover:opacity-70"
          >
            <Github size={16} /> View on GitHub <ExternalLink size={14} />
          </a>
        </article>
      ))}
    </div>
  );
}

function SkillsPanel({ color }: { color: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        The toolkit I use to build web and mobile systems, from the database to the screen.
      </p>
      <div className="flex flex-wrap gap-2">
        {PORTFOLIO_DATA.skills.map((s) => (
          <Chip key={s} color={color}>
            {s}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function ContactPanel({ color }: { color: string }) {
  const d = PORTFOLIO_DATA;
  const rows = [
    { icon: <Mail size={18} />, label: d.email, href: `mailto:${d.email}` },
    { icon: <Github size={18} />, label: d.github.replace("https://", ""), href: d.github },
    { icon: <MapPin size={18} />, label: d.location, href: undefined },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">Open to new opportunities in software development. Send me an email or grab my resume.</p>
      {rows.map((r) => {
        const inner = (
          <>
            <span style={{ color }}>{r.icon}</span>
            <span className="break-all text-sm font-semibold text-slate-800">{r.label}</span>
          </>
        );
        const cls =
          "flex items-center gap-3 rounded-2xl border-2 border-slate-900/10 bg-white/70 px-4 py-3";
        return r.href ? (
          <a
            key={r.label}
            href={r.href}
            target={r.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`${cls} transition-transform hover:-translate-y-0.5`}
          >
            {inner}
          </a>
        ) : (
          <div key={r.label} className={cls}>
            {inner}
          </div>
        );
      })}
      <a
        href={d.resumePdf}
        download
        className="flex items-center justify-center gap-2 rounded-2xl border-4 border-slate-900 px-4 py-3 text-sm font-black text-white shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/40"
        style={{ backgroundColor: color }}
      >
        <Download size={18} /> Download resume (PDF)
      </a>
    </div>
  );
}

function ZoneOverlay({ zone }: { zone: ZoneId | null }) {
  if (!zone) return null;
  const cfg = ZONES.find((z) => z.id === zone)!;
  const meta = ZONE_META[zone];

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-40 top-36 z-20 flex items-end justify-center md:inset-x-6 md:bottom-6 md:top-28 md:items-center md:justify-end">
      <section
        key={zone}
        className="toy-pop pointer-events-auto flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 border-slate-900 bg-amber-50"
        style={{ boxShadow: `8px 8px 0 ${cfg.color}` }}
      >
        <header
          className="flex items-center gap-3 border-b-4 border-slate-900 px-5 py-3 text-white"
          style={{ backgroundColor: cfg.color }}
        >
          {meta.icon}
          <h2 className="text-lg font-black tracking-tight">{meta.title}</h2>
        </header>
        <div className="overflow-y-auto p-5">
          {zone === "about" && <AboutPanel color={cfg.color} />}
          {zone === "projects" && <ProjectsPanel color={cfg.color} />}
          {zone === "skills" && <SkillsPanel color={cfg.color} />}
          {zone === "contact" && <ContactPanel color={cfg.color} />}
        </div>
      </section>
    </div>
  );
}

function IntroCard({ onStart }: { onStart: () => void }) {
  const keys = [
    ["W A S D / Arrows", "Drive and steer"],
    ["Shift", "Boost"],
    ["Space", "Jump"],
  ];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-sky-900/30 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-labelledby="intro-title"
        className="toy-pop w-full max-w-md rounded-3xl border-4 border-slate-900 bg-amber-50 p-6"
        style={{ boxShadow: "8px 8px 0 #f97316" }}
      >
        <h1 id="intro-title" className="text-2xl font-black text-slate-900">
          Welcome to my island
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          I&apos;m Paul, a BSIT student and full-stack developer. Drive the car to each glowing ring
          and slow down inside it to park. My resume opens on the screen.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {keys.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-3">
              <kbd className="rounded-lg border-2 border-slate-900 bg-white px-2 py-0.5 text-xs font-bold text-slate-900">
                {k}
              </kbd>
              <span className="text-slate-700">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">On a phone, use the buttons at the bottom of the screen.</p>
        <button
          type="button"
          autoFocus
          onClick={onStart}
          className="mt-5 w-full rounded-2xl border-4 border-slate-900 bg-orange-500 px-4 py-3 text-base font-black text-white shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
        >
          Start driving
        </button>
        <Link
          href="/resume"
          className="mt-3 block text-center text-sm font-bold text-slate-700 underline decoration-2 underline-offset-4 hover:opacity-70"
        >
          Prefer a plain page? Read my resume
        </Link>
      </div>
    </div>
  );
}

// ==========================================
// HUD + TOUCH CONTROLS
// ==========================================
function DPadButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: (down: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-12 w-12 touch-none sm:h-14 sm:w-14 select-none items-center justify-center rounded-2xl border-4 border-slate-900 bg-white text-slate-900 shadow-[3px_3px_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress(true);
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onPointerLeave={() => onPress(false)}
    >
      {children}
    </button>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ToyIslandWorld() {
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<[number, number, number] | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const controlsRef = useRef<Controls>({
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
    jump: false,
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      const k = e.key.toLowerCase();
      const c = controlsRef.current;
      if (k === "w" || k === "arrowup") c.up = isDown;
      else if (k === "s" || k === "arrowdown") c.down = isDown;
      else if (k === "a" || k === "arrowleft") c.left = isDown;
      else if (k === "d" || k === "arrowright") c.right = isDown;
      else if (k === "shift") c.boost = isDown;
      else if (k === " ") c.jump = isDown;
      else return;
      if (isDown) setShowIntro(false);
      // Stop the page from scrolling with arrows / space
      if (k.startsWith("arrow") || k === " ") e.preventDefault();
    };
    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    const reset = () => {
      const c = controlsRef.current;
      c.up = c.down = c.left = c.right = c.boost = c.jump = false;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", reset);
    };
  }, []);

  const setControl = useCallback((key: keyof Controls, value: boolean) => {
    controlsRef.current[key] = value;
  }, []);

  const clearTeleport = useCallback(() => setTeleportTarget(null), []);
  const handleZoneChange = useCallback((z: ZoneId | null) => setActiveZone(z), []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-200">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [14, 15, 16], fov: 42 }}
        gl={{ antialias: true }}
      >
        <ToyCarScene
          controlsRef={controlsRef}
          teleportTarget={teleportTarget}
          clearTeleport={clearTeleport}
          onActiveZoneChange={handleZoneChange}
        />
      </Canvas>

      {/* Top bar: name + fast travel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto rounded-2xl border-4 border-slate-900 bg-amber-50 px-4 py-2 shadow-[4px_4px_0_#0f172a]">
          <p className="text-sm font-black leading-tight text-slate-900 sm:text-base">{PORTFOLIO_DATA.name}</p>
          <p className="text-xs font-semibold text-slate-600">{PORTFOLIO_DATA.role}</p>
        </div>

        <nav aria-label="Fast travel" className="pointer-events-auto flex w-full gap-2 overflow-x-auto pb-2 pr-2 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0 sm:pr-0">
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setTeleportTarget([...z.position])}
              className="shrink-0 whitespace-nowrap rounded-xl border-4 border-slate-900 px-3 py-1.5 text-xs font-black text-white shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
              style={{ backgroundColor: z.color }}
            >
              {ZONE_META[z.id].title}
            </button>
          ))}
          <Link
            href="/resume"
            className="shrink-0 whitespace-nowrap rounded-xl border-4 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/40"
          >
            Plain resume
          </Link>
        </nav>
      </div>

      {/* Keyboard hint (desktop) */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 hidden rounded-2xl border-4 border-slate-900 bg-amber-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-[4px_4px_0_#0f172a] md:block">
        WASD / Arrows to drive &nbsp;•&nbsp; Shift to boost &nbsp;•&nbsp; Space to jump
        <br />
        Slow down inside a glowing ring to park
      </div>

      {/* Touch D-pad (mobile) */}
      <div className="absolute bottom-5 left-4 z-30 grid grid-cols-3 gap-1.5 md:hidden">
        <span />
        <DPadButton label="Drive forward" onPress={(d) => setControl("up", d)}>
          <ArrowUp />
        </DPadButton>
        <span />
        <DPadButton label="Turn left" onPress={(d) => setControl("left", d)}>
          <ArrowLeft />
        </DPadButton>
        <DPadButton label="Reverse" onPress={(d) => setControl("down", d)}>
          <ArrowDown />
        </DPadButton>
        <DPadButton label="Turn right" onPress={(d) => setControl("right", d)}>
          <ArrowRight />
        </DPadButton>
      </div>
      <div className="absolute bottom-5 right-4 z-30 flex flex-col gap-2 md:hidden">
        <DPadButton label="Jump" onPress={(d) => setControl("jump", d)}>
          <ArrowUp className="-translate-y-0.5" />
        </DPadButton>
        <DPadButton label="Boost" onPress={(d) => setControl("boost", d)}>
          <Zap />
        </DPadButton>
      </div>

      <ZoneOverlay zone={activeZone} />
      {showIntro && <IntroCard onStart={() => setShowIntro(false)} />}

      <style>{`
        @keyframes toyPop { from { transform: translateY(16px) scale(.96); opacity: 0 } to { transform: none; opacity: 1 } }
        .toy-pop { animation: toyPop .22s ease-out }
        @media (prefers-reduced-motion: reduce) { .toy-pop { animation: none } }
      `}</style>
    </div>
  );
}