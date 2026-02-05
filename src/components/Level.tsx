import { usePlane, useBox } from '@react-three/cannon'
import { useState, useEffect, useRef } from 'react'
import { Bot } from './Bot'
import { GrenadeEffects } from './GrenadeEffects'
import { useStore, CT_SPAWNS, T_SPAWNS } from '../store'
import { Sky, Stars, Environment, ContactShadows } from '@react-three/drei'

export const Level = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { friction: 0.1 }
  }))

  const s = useStore()
  const [bots, setBots] = useState<any[]>([])
  const botCounter = useRef(1)

  useEffect(() => {
    setBots([])
    if (s.gameMode === 'deathmatch') {
      for (let i = 0; i < 8; i++) spawnBot()
    } else if (s.gameMode === '5v5') {
      const newBots: any[] = []
      const ctBots = s.ctTeam.filter(m => !m.isPlayer)
      ctBots.forEach((member, i) => {
        const spawnPos = CT_SPAWNS[i + 1] || CT_SPAWNS[0]
        newBots.push({ id: `ct-${i}`, pos: spawnPos, name: member.name, team: 'counter-terrorists' })
      })
      const tBots = s.tTeam.filter(m => !m.isPlayer)
      tBots.forEach((member, i) => {
        const spawnPos = T_SPAWNS[i] || T_SPAWNS[0]
        newBots.push({ id: `t-${i}`, pos: spawnPos, name: member.name, team: 'terrorists' })
      })
      setBots(newBots)
    } else if (s.gameMode === 'host') {
      setBots([])
    }
  }, [s.gameMode, s.currentRound, s.playerTeam])

  const spawnBot = () => {
    const id = Date.now() + Math.random()
    const x = (Math.random() - 0.5) * 60; const z = (Math.random() - 0.5) * 60
    setBots(prev => [...prev, { id, pos: [x, 2, z], name: `Bot ${botCounter.current++}`, team: Math.random() > 0.5 ? 'counter-terrorists' : 'terrorists' }])
  }

  const handleBotDeath = (id: any, name: string, head: boolean, killer: string) => {
    setBots(prev => prev.filter(b => b.id !== id))
    s.addKill({
      killer, victim: name, weapon: s.currentWeapon, headshot: head,
      killerTeam: killer === 'You' ? s.playerTeam : (s.playerTeam === 'counter-terrorists' ? 'terrorists' : 'counter-terrorists'),
      victimTeam: s.playerTeam === 'counter-terrorists' ? 'terrorists' : 'counter-terrorists'
    })

    if (s.gameMode === '5v5') {
      const enemyTeam = s.playerTeam === 'counter-terrorists' ? 'terrorists' : 'counter-terrorists'
      const stillAlive = bots.filter(b => b.team === enemyTeam && b.id !== id)
      if (stillAlive.length === 0) {
        setTimeout(() => s.endRound(s.playerTeam), 2000)
      }
    }
  }

  return (
    <group>
      {/* Environmental Lighting & Sky */}
      <Sky sunPosition={[100, 10, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="city" />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={100}
        blur={2}
        far={10}
        resolution={256}
        color="#000000"
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <mesh ref={ref as any} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#d2b48c" roughness={0.9} metalness={0.1} />
      </mesh>

      <GrenadeEffects />

      {/* --- DUST 2 INSPIRED MAP --- */}

      {/* --- MID AREA --- */}
      {/* Mid Lane */}
      <Wall position={[0, 4, 0]} args={[15, 8, 80]} color="#c2a47c" /> {/* West wall of mid */}
      <Wall position={[25, 4, 0]} args={[15, 8, 80]} color="#c2a47c" /> {/* East wall of mid */}
      <Wall position={[12.5, 4, 40]} args={[10, 8, 2]} color="#6b4423" /> {/* Mid Doors area (open) */}
      <Wall position={[5, 4, 40]} args={[5, 8, 1]} color="#6b4423" /> {/* Mid Door Left */}
      <Wall position={[20, 4, 40]} args={[5, 8, 1]} color="#6b4423" /> {/* Mid Door Right */}

      {/* --- A SITE AREA --- */}
      {/* Long A path */}
      <Wall position={[80, 4, 20]} args={[2, 8, 100]} color="#c2a47c" /> {/* Long A outer wall */}
      <Wall position={[50, 4, 50]} args={[60, 8, 2]} color="#c2a47c" /> {/* Long A corner */}

      {/* Pit area */}
      <Wall position={[80, 2, 75]} args={[15, 4, 15]} color="#b2946c" /> {/* Pit walls */}

      {/* A Platform / Bombsite A */}
      <group position={[60, 0, -60]}>
        <Wall position={[0, 1, 0]} args={[25, 2, 25]} color="#8b7355" /> {/* A Platform */}
        <Wall position={[0, 1.5, 0]} args={[3, 1, 3]} color="#5c3c10" /> {/* Box on A */}
        {/* Goose area */}
        <Wall position={[-12, 3, -12]} args={[5, 6, 5]} color="#c2a47c" />
      </group>

      {/* A Ramp */}
      <Wall position={[60, 0.5, -35]} args={[10, 1, 20]} rotation={[-0.2, 0, 0]} color="#8b7355" />

      {/* --- B SITE AREA --- */}
      {/* B Tunnels (Upper) */}
      <group position={[-60, 0, 0]}>
        <Wall position={[0, 5, 0]} args={[20, 10, 40]} color="#756555" />
        <Wall position={[0, 2.5, -20]} args={[8, 5, 1]} color="#000" /> {/* Tunnel exit to B */}
      </group>

      {/* B Platform / Bombsite B */}
      <group position={[-70, 0, -60]}>
        <Wall position={[0, 1.5, 0]} args={[30, 3, 30]} color="#8b7355" />
        <Wall position={[0, 3.5, 0]} args={[4, 2, 4]} color="#b71c1c" /> {/* Red container on B */}
      </group>

      {/* B Doors */}
      <Wall position={[-45, 4, -50]} args={[2, 8, 10]} color="#6b4423" />
      <Wall position={[-55, 4, -45]} args={[10, 8, 2]} color="#c2a47c" />

      {/* --- CT SPAWN --- */}
      <Wall position={[0, 4, -100]} args={[60, 8, 2]} color="#c2a47c" />

      {/* --- T SPAWN --- */}
      <Wall position={[0, 4, 120]} args={[80, 8, 2]} color="#c2a47c" />

      {/* Outer Boundary Walls */}
      <Wall position={[0, 10, -150]} args={[300, 20, 5]} color="#a2845c" />
      <Wall position={[0, 10, 150]} args={[300, 20, 5]} color="#a2845c" />
      <Wall position={[-150, 10, 0]} args={[5, 20, 300]} color="#a2845c" />
      <Wall position={[150, 10, 0]} args={[5, 20, 300]} color="#a2845c" />

      {/* Boxes and Obstacles throughout mid/long */}
      <Wall position={[40, 1, 10]} args={[4, 2, 4]} color="#5c3c10" />
      <Wall position={[12, 1, -20]} args={[3, 2, 3]} color="#5c3c10" />
      <Wall position={[-20, 1.5, 40]} args={[5, 3, 5]} color="#5c3c10" />

      {bots.map(b => (
        <Bot key={b.id} position={b.pos} name={b.name} team={b.team} onDeath={(h, k) => handleBotDeath(b.id, b.name, h, k)} />
      ))}
    </group>
  )
}

const Wall = ({ position, args, color, rotation = [0, 0, 0], materialProps = {} }: any) => {
  const [ref] = useBox(() => ({ mass: 0, position, args, rotation, type: 'Static' }))
  return (
    <mesh ref={ref as any} castShadow receiveShadow userData={{ isWall: true }}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} {...materialProps} />
    </mesh>
  )
}


