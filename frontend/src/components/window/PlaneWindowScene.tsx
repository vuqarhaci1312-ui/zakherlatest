import { Canvas, useFrame } from '@react-three/fiber'
import { Cloud } from '@react-three/drei'
import { RepeatWrapping, TextureLoader } from 'three'
import { useMemo, useRef } from 'react'
import type { ShaderMaterial } from 'three'

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

function SkyClouds() {
  return (
    <>
      <ambientLight intensity={3} color="#e8f4ff" />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#fff8f0" />
      <Cloud position={[-1.5, -0.8, -16]} speed={0.04} opacity={0.35} segments={10} bounds={[1.5, 0.4, 0.4]} volume={0.4} seed={1} />
      <Cloud position={[0.5, -0.8, -16]} speed={0.03} opacity={0.3} segments={10} bounds={[1.8, 0.4, 0.4]} volume={0.4} seed={2} />
      <Cloud position={[2.5, -0.8, -16]} speed={0.04} opacity={0.32} segments={10} bounds={[1.6, 0.4, 0.4]} volume={0.4} seed={3} />
      <Cloud position={[0, -1.3, -2.5]} speed={0.48} opacity={0.7} segments={18} bounds={[3, 1, 1]} volume={1} seed={7} />
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
