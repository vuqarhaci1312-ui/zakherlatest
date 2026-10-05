import { Canvas, useFrame } from '@react-three/fiber'
import { Cloud, Clouds } from '@react-three/drei'
import {
  MeshBasicMaterial,
  NormalBlending,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type Mesh,
  type ShaderMaterial,
} from 'three'
import { useMemo, useRef } from 'react'

function Water() {
  const mat = useRef<ShaderMaterial>(null)
  const time = useRef(0)
  const normalMap = useMemo(() => {
    const tex = new TextureLoader().load('/waternormals.jpg')
    tex.wrapS = tex.wrapT = RepeatWrapping
    return tex
  }, [])

  const shader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uNormalMap: { value: normalMap },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uNormalMap;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv * 120.0;
          vec2 uv1 = uv * 0.8 + vec2(uTime * 0.02, uTime * 0.01);
          vec2 uv2 = uv * 0.5 - vec2(uTime * 0.015, uTime * 0.008);
          vec3 n1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
          vec3 n2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
          float waves = (n1.r + n2.r) * 0.5;
          vec3 deepBlue = vec3(0.00, 0.25, 0.60);
          vec3 midBlue = vec3(0.05, 0.40, 0.75);
          vec3 lightBlue = vec3(0.20, 0.60, 0.90);
          vec3 colour = mix(deepBlue, midBlue, waves * 0.7);
          colour = mix(colour, lightBlue, waves * waves * 0.3);
          float glint = pow(waves, 8.0) * 0.2;
          colour += vec3(0.8, 0.9, 1.0) * glint;
          float horizonFade = smoothstep(0.0, 0.6, vUv.y);
          vec3 hazeColour = vec3(0.96, 0.98, 1.00);
          colour = mix(colour, hazeColour, horizonFade * 0.98);
          gl_FragColor = vec4(colour, 1.0);
        }
      `,
    }),
    [normalMap],
  )

  useFrame((_, delta) => {
    time.current += Math.min(delta, 1 / 30)
    if (mat.current) mat.current.uniforms.uTime.value = time.current
  })

  return (
    <mesh rotation={[-Math.PI * 0.42, 0, 0]} position={[0, -1.9, 0.8]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial ref={mat} {...shader} />
    </mesh>
  )
}

const cirrusMap = new TextureLoader().load('/CirrusCloud.png')
cirrusMap.colorSpace = SRGBColorSpace

const cirrusLayers = [
  { x: 0, y: 2, z: -24, w: 18, h: 1, opacity: 0.2, speed: 0.001 },
  { x: -4, y: 2.1, z: -24, w: 18, h: 1, opacity: 0.6, speed: 0.001 },
  { x: 3, y: 1.5, z: -24, w: 18, h: 1, opacity: 0.2, speed: 0.001 },
  { x: 2, y: 1.3, z: -24, w: 18, h: 1, opacity: 0.4, speed: 0.001 },
  { x: -5, y: 1.9, z: -24, w: 18, h: 1, opacity: 0.3, speed: 0.001 },
  { x: -4, y: 1, z: -40, w: 40, h: 10, opacity: 1, speed: 0.001 },
]

function Cirrus() {
  const meshes = useRef<(Mesh | null)[]>([])
  const materials = useMemo(
    () =>
      cirrusLayers.map(
        (layer) =>
          new MeshBasicMaterial({
            map: cirrusMap,
            transparent: true,
            opacity: layer.opacity,
            depthWrite: false,
            blending: NormalBlending,
          }),
      ),
    [],
  )

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30)
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.x -= step * cirrusLayers[i].speed
      if (mesh.position.x < -6) mesh.position.x = 6
    })
  })

  return (
    <>
      {cirrusLayers.map((layer, i) => (
        <mesh
          key={i}
          ref={(node) => {
            meshes.current[i] = node
          }}
          position={[layer.x, layer.y, layer.z]}
          material={materials[i]}
        >
          <planeGeometry args={[layer.w, layer.h]} />
        </mesh>
      ))}
    </>
  )
}

type DriftProps = {
  position: [number, number, number]
  speed: number
  opacity: number
  segments: number
  bounds: [number, number, number]
  volume: number
  seed: number
  resetX: number
  color: string
  shadowColor: string
}

function DriftingCloud({
  position,
  speed,
  opacity,
  segments,
  bounds,
  volume,
  seed,
  resetX,
  color,
  shadowColor,
}: DriftProps) {
  const group = useRef<Group>(null)
  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    g.position.x -= Math.min(delta, 1 / 30) * speed
    if (g.position.x < -resetX) g.position.x = resetX
  })
  return (
    <group ref={group} position={position}>
      <Cloud
        opacity={opacity}
        color={color}
        segments={segments}
        bounds={bounds}
        volume={volume}
        seed={seed}
        position={[0, bounds[1] * 0.15, 0]}
      />
      <Cloud
        opacity={opacity * 0.7}
        color={shadowColor}
        segments={Math.floor(segments * 0.7)}
        bounds={[bounds[0], bounds[1] * 0.5, bounds[2]]}
        volume={volume * 0.6}
        seed={seed + 100}
        position={[0, -bounds[1] * 0.25, 0]}
      />
    </group>
  )
}

function SkyClouds() {
  return (
    <>
      <ambientLight intensity={3} color="#e8f4ff" />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#fff8f0" />
      <Cirrus />
      <Clouds texture="/cloud.png" limit={400}>
        <DriftingCloud position={[-1.5, -0.8, -16]} speed={0.04} opacity={0.35} segments={10} bounds={[1.5, 0.4, 0.4]} volume={0.4} seed={1} resetX={4} color="#c8d8e8" shadowColor="#4a6a8a" />
        <DriftingCloud position={[0.5, -0.8, -16]} speed={0.03} opacity={0.3} segments={10} bounds={[1.8, 0.4, 0.4]} volume={0.4} seed={2} resetX={4} color="#d0dce8" shadowColor="#4a6a8a" />
        <DriftingCloud position={[2.5, -0.8, -16]} speed={0.04} opacity={0.32} segments={10} bounds={[1.6, 0.4, 0.4]} volume={0.4} seed={3} resetX={4} color="#c8d8e8" shadowColor="#4a6a8a" />
        <DriftingCloud position={[-3, -0.85, -16]} speed={0.03} opacity={0.28} segments={10} bounds={[1.4, 0.35, 0.35]} volume={0.35} seed={10} resetX={4} color="#d0dce8" shadowColor="#4a6a8a" />
        <DriftingCloud position={[-1, -0.95, -9]} speed={0.08} opacity={0.55} segments={14} bounds={[2.2, 0.7, 0.7]} volume={0.7} seed={4} resetX={4} color="#f0f4f8" shadowColor="#8aa0b8" />
        <DriftingCloud position={[1, -0.9, -9]} speed={0.07} opacity={0.5} segments={14} bounds={[2, 0.65, 0.65]} volume={0.65} seed={5} resetX={4} color="#eef2f8" shadowColor="#5a7898" />
        <DriftingCloud position={[-3, -1, -9]} speed={0.09} opacity={0.48} segments={12} bounds={[1.8, 0.6, 0.6]} volume={0.6} seed={6} resetX={4} color="#f0f4f8" shadowColor="#5a7898" />
        <DriftingCloud position={[3, -0.62, -9]} speed={0.08} opacity={0.5} segments={12} bounds={[2, 0.6, 0.6]} volume={0.6} seed={11} resetX={4} color="#eef2f8" shadowColor="#5a7898" />
        <DriftingCloud position={[0, -1.3, -2.5]} speed={0.48} opacity={0.7} segments={18} bounds={[3, 1, 1]} volume={1} seed={7} resetX={5} color="#ffffff" shadowColor="#7a8fa8" />
        <DriftingCloud position={[-2, -1.4, -2.5]} speed={0.52} opacity={0.65} segments={16} bounds={[2.8, 0.9, 0.9]} volume={0.9} seed={8} resetX={5} color="#fffef8" shadowColor="#7a8fa8" />
        <DriftingCloud position={[2, -1.5, -2.5]} speed={0.44} opacity={0.6} segments={16} bounds={[2.5, 0.9, 0.9]} volume={0.9} seed={9} resetX={5} color="#ffffff" shadowColor="#7a8fa8" />
        <DriftingCloud position={[-4, -1.2, -2.5]} speed={0.5} opacity={0.62} segments={16} bounds={[2.6, 0.85, 0.85]} volume={0.85} seed={12} resetX={5} color="#fffef8" shadowColor="#7a8fa8" />
      </Clouds>
    </>
  )
}

type Props = { paused?: boolean }

export default function PlaneWindowScene({ paused = false }: Props) {
  const frameloop = paused ? 'demand' : 'always'
  return (
    <>
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [0, 0, 2], fov: 60 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        frameloop={frameloop}
        flat
      >
        <Water />
      </Canvas>
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [0, 0, 3], fov: 70 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        frameloop={frameloop}
      >
        <SkyClouds />
      </Canvas>
    </>
  )
}
