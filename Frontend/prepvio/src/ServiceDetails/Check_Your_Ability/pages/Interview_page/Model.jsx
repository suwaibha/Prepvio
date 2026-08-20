// Actual final

// import React, { useRef, useState, useEffect } from 'react'
// import { useGLTF } from '@react-three/drei'
// import { useFrame } from '@react-three/fiber'

// export function Model(props) {
//   const { nodes, materials } = useGLTF('/Blink.glb')
//   const meshRef = useRef()
//   const headBoneRef = useRef(null)

//   // Blink state
//   const blinkTimerRef = useRef(0)
//   const isBlinkingRef = useRef(false)
//   const blinkProgressRef = useRef(0)

//   // Enable morph targets AND morphNormals
//   Object.values(materials || {}).forEach((mat) => {
//     mat.morphTargets = true
//     mat.morphNormals = true
//   })

//   const sentence = "Hello world, My name is Mohammed, Afnan Ahmed"
//   const chars = sentence.toLowerCase().split('')

//   const letterToViseme = {
//     a: 'aa', b: 'PP', c: 'CH', d: 'DD', e: 'E', f: 'FF',
//     g: 'DD', h: 'sil', i: 'E', k: 'DD', l: 'nn', m: 'PP',
//     n: 'nn', o: 'oh', p: 'PP', r: 'aa', s: 'SS', t: 'DD',
//     u: 'oh', v: 'FF', w: 'oh', x: 'SS', y: 'E', z: 'SS',
//     ' ': 'sil'
//   }

//   const [currentCharIndex, setCurrentCharIndex] = useState(0)
//   const morphKeys = nodes?.rp_carla_rigged_001_geo?.morphTargetDictionary || {}

//   // Speech function
//   const speakText = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text)
//     utterance.rate = 1.2
//     speechSynthesis.speak(utterance)

//     let i = 0
//     const interval = setInterval(() => {
//       setCurrentCharIndex(i)
//       i++
//       if (i >= chars.length) clearInterval(interval)
//     }, 150)
//   }

//   useEffect(() => {
//     speakText(sentence)

//     // Assign head bone after nodes are loaded
//     if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
//       const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
//         b.name.toLowerCase().includes('head')
//       )
//       if (head) headBoneRef.current = head
//     }

//     // Log shape keys
//     console.log('Available shape keys:', Object.keys(morphKeys))
//   }, [nodes])

//   // Randomized offsets for natural motion
//   const offsetY = useRef(Math.random() * 0.08)
//   const offsetX = useRef(Math.random() * 0.05)

//   // Animate
//   useFrame((state, delta) => {
//     const t = state.clock.getElapsedTime()

//     // Only rotate head if bone exists
//     if (headBoneRef.current) {
//       headBoneRef.current.rotation.y = Math.sin(t * 0.4 + offsetY.current) * 0.02
//       headBoneRef.current.rotation.x = Math.sin(t * 0.3 + offsetX.current) * 0.04
//     }

//     // Blink logic - trigger blink every 2 seconds
//     blinkTimerRef.current += delta

//     if (blinkTimerRef.current >= 2 && !isBlinkingRef.current) {
//       isBlinkingRef.current = true
//       blinkProgressRef.current = 0
//       blinkTimerRef.current = 0
//     }

//     // Animate blink
//     if (isBlinkingRef.current) {
//       blinkProgressRef.current += delta * 10

//       if (blinkProgressRef.current >= 1) {
//         isBlinkingRef.current = false
//         blinkProgressRef.current = 0
//       }
//     }

//     // Calculate blink influence
//     let blinkInfluence = 0
//     if (isBlinkingRef.current) {
//       const progress = blinkProgressRef.current
//       blinkInfluence = Math.sin(progress * Math.PI)
//     }

//     // Apply morph targets
//     if (meshRef.current?.morphTargetInfluences) {
//       const influences = meshRef.current.morphTargetInfluences

//       // Find blink index
//       const blinkIndex = morphKeys['Blink']

//       // Since you only have 1 morph target (Blink at index 0), just set it directly
//       if (blinkIndex !== undefined) {
//         // Apply blink with full strength
//         influences[blinkIndex] = blinkInfluence

//         // Force update
//         meshRef.current.morphTargetInfluences = influences
//       }

//       // Note: Lip sync won't work because Blink is your only morph target
//       // You'll need separate morph targets for lip sync visemes
//     }
//   })

//   // Only render mesh if it exists
//   if (!nodes?.rp_carla_rigged_001_geo) return null

//   return (
//     <group
//       {...props}
//       position={[-0.48, -1.22, 3.8]}
//       rotation={[2, 0, 0]}
//       scale={0.01}
//       dispose={null}
//     >
//       <skinnedMesh
//         ref={meshRef}
//         name="blinkMesh"
//         geometry={nodes.rp_carla_rigged_001_geo.geometry}
//         material={nodes.rp_carla_rigged_001_geo.material}
//         skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
//         morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
//         morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
//       />
//       <primitive object={nodes.root} />
//     </group>
//   )
// }

// useGLTF.preload('/Blink.glb')



import React, { useRef, useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

export function Model(props) {
  const { nodes, materials } = useGLTF('/final_prepvio_model.glb')
  const meshRef = useRef()
  const headBoneRef = useRef(null)

  // Enable morph targets
  Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true))

  const sentence = "Hello world, My name is Mohammed, Afnan Ahmed"
  const chars = sentence.toLowerCase().split('')

  const letterToViseme = {
    a: 'aa', b: 'PP', c: 'CH', d: 'DD', e: 'E', f: 'FF',
    g: 'DD', h: 'sil', i: 'E', k: 'DD', l: 'nn', m: 'PP',
    n: 'nn', o: 'oh', p: 'PP', r: 'aa', s: 'SS', t: 'DD',
    u: 'oh', v: 'FF', w: 'oh', x: 'SS', y: 'E', z: 'SS',
    ' ': 'sil'
  }

  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const morphKeys = nodes?.rp_carla_rigged_001_geo?.morphTargetDictionary || {}

  // Speech function
  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.2
    speechSynthesis.speak(utterance)

    let i = 0
    const interval = setInterval(() => {
      setCurrentCharIndex(i)
      i++
      if (i >= chars.length) clearInterval(interval)
    }, 150)
  }

  useEffect(() => {
    speakText(sentence)

    // Assign head bone after nodes are loaded
    if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
      const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
        b.name.toLowerCase().includes('head')
      )
      if (head) headBoneRef.current = head
    }
  }, [nodes])

  // Randomized offsets for natural motion
  const offsetY = useRef(Math.random() * 0.08) // small phase offset side-to-side
  const offsetX = useRef(Math.random() * 0.05) // small phase offset up-down

  // Animate
  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Only rotate head if bone exists
    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = Math.sin(t * 0.4 + offsetY.current) * 0.02
      headBoneRef.current.rotation.x = Math.sin(t * 0.3 + offsetX.current) * 0.04
    }

    // Lip-sync morph targets
    if (meshRef.current?.morphTargetInfluences) {
      const influences = meshRef.current.morphTargetInfluences
      influences.fill(0)

      const char = chars[currentCharIndex]
      const viseme = letterToViseme[char] || 'oh'
      const index = morphKeys[viseme]

      if (index !== undefined) influences[index] = 0.8
    }
  })

  // Only render mesh if it exists
  if (!nodes?.rp_carla_rigged_001_geo) return null

  return (
    <group
      {...props}
      position={[-0.48, -1.8, 3.967]}
      rotation={[1.9, 0, 0]}
      scale={0.012}
      dispose={null}
    >
      <skinnedMesh
        ref={meshRef}
        geometry={nodes.rp_carla_rigged_001_geo.geometry}
        material={nodes.rp_carla_rigged_001_geo.material}
        skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
        morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
        morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
      />
      <primitive object={nodes.root} />
    </group>
  )
}

useGLTF.preload('/final_prepvio_model.glb')
