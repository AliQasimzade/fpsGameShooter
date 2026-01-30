import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { Sky, Stars, PointerLockControls } from '@react-three/drei'
import { Player } from './components/Player'
import { Level } from './components/Level'
import { Weapon } from './components/Weapon'

export const Game = () => {
  return (
    <Canvas shadows camera={{ fov: 75 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <Stars />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} castShadow />
      
      <Physics gravity={[0, -9.8, 0]}>
        <Player />
        <Level />
      </Physics>
      <Weapon />
      <PointerLockControls />
    </Canvas>
  )
}
