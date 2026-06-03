import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import type { Group, Mesh } from 'three'

/**
 * The "Yantra" — a precision instrument rendered in WebGL.
 * A solid signal core nested inside two counter-rotating wireframe shells, ringed
 * by a tilted radar torus and a field of drifting signal particles.
 *
 * This whole module (and three.js) is lazy-loaded by HeroScene, so it only ships
 * to clients that actually render the hero.
 */

const SIGNAL = '#3ce0a0'
const CYAN = '#34d3ee'
const BLUE = '#5b9dff'

function Yantra() {
  const mid = useRef<Mesh>(null)
  const outer = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const ring2 = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (mid.current) mid.current.rotation.y += delta * 0.32
    if (outer.current) {
      outer.current.rotation.y -= delta * 0.18
      outer.current.rotation.x += delta * 0.08
    }
    if (ring.current) ring.current.rotation.z += delta * 0.5
    if (ring2.current) ring2.current.rotation.z -= delta * 0.3
  })

  return (
    <group scale={1.15}>
      {/* Solid emissive core */}
      <mesh>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshStandardMaterial
          color="#0c1a16"
          emissive={SIGNAL}
          emissiveIntensity={0.7}
          metalness={0.6}
          roughness={0.25}
          flatShading
        />
      </mesh>

      {/* Mid wireframe shell */}
      <mesh ref={mid}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color={SIGNAL} wireframe transparent opacity={0.55} />
      </mesh>

      {/* Outer faint wireframe shell */}
      <mesh ref={outer}>
        <dodecahedronGeometry args={[1.85, 0]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.22} />
      </mesh>

      {/* Radar rings */}
      <mesh ref={ring} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[2.15, 0.012, 16, 120]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 1.7, Math.PI / 6, 0]}>
        <torusGeometry args={[2.45, 0.008, 16, 120]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export default function YantraOrb() {
  const group = useRef<Group>(null)

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 5]} intensity={50} color={SIGNAL} />
      <pointLight position={[-5, -3, 2]} intensity={40} color={CYAN} />
      <pointLight position={[0, 2, -4]} intensity={25} color={BLUE} />

      <Float speed={1.6} rotationIntensity={0.5} floatIntensity={0.9}>
        <group ref={group}>
          <Yantra />
        </group>
      </Float>

      <Sparkles count={50} scale={7} size={2.4} speed={0.3} color={CYAN} opacity={0.7} />
    </Canvas>
  )
}
