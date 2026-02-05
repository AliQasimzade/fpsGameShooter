import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { Sky, Stars, PointerLockControls } from '@react-three/drei'
import { Player } from './components/Player'
import { Level } from './components/Level'
import { Weapon } from './components/Weapon'
import { useMultiplayer } from './useMultiplayer'
import { RemotePlayer } from './components/RemotePlayer'
import { GrenadeEffects } from './components/GrenadeEffects'

export const Game = () => {
  const { remotePlayers } = useMultiplayer()

  return (
    <Canvas shadows camera={{ fov: 75 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <Stars />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} castShadow />

      <Physics gravity={[0, -9.8, 0]}>
        <Player />
        <Level />
        {remotePlayers.map((player) => (
          <RemotePlayer
            key={player.id}
            id={player.id}
            position={player.position}
            rotation={player.rotation}
            name={player.name}
            team={player.team}
            isAlive={player.isAlive}
            health={player.health}
          />
        ))}
      </Physics>
      <Weapon />
      <GrenadeEffects />
      <PointerLockControls />
    </Canvas>
  )
}
