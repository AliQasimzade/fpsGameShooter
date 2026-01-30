import { Game } from './Game'
import { useState, useEffect } from 'react'
import { useStore, WEAPONS } from './store'
import { BuyMenu } from './components/BuyMenu'

function App() {
  const health = useStore(state => state.health)
  const money = useStore(state => state.money)
  const currentWeapon = useStore(state => state.currentWeapon)
  const ammo = useStore(state => state.ammo[state.currentWeapon])
  const reserve = useStore(state => state.reserves[state.currentWeapon])
  const isReloading = useStore(state => state.isReloading)
  const isDead = useStore(state => state.isDead)
  const resetGame = useStore(state => state.resetGame)

  const [showBuyMenu, setShowBuyMenu] = useState(false)

  // Toggle buy menu with B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyB') {
        setShowBuyMenu(prev => {
           if (!prev) document.exitPointerLock()
           return !prev
        })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="w-full h-full bg-black select-none">
      <Game />
      
      {/* HUD */}
      {!isDead && !showBuyMenu && (
         <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference z-50 shadow-[0_0_2px_#fff]" />
      )}
      
      {/* Messages */}
      {isReloading && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 text-yellow-500 font-bold animate-pulse">
            RELOADING...
         </div>
      )}

      {isDead && (
         <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center z-[100]">
            <h1 className="text-6xl font-bold text-white mb-4">YOU DIED</h1>
            <button 
               onClick={resetGame}
               className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200"
            >
               RESPAWN
            </button>
         </div>
      )}

      {/* Stats HUD */}
      <div className="absolute bottom-4 left-4 text-white font-mono pointer-events-none select-none z-50 flex gap-4">
        <div className="bg-black/60 p-4 rounded min-w-[100px] border-l-4 border-green-500">
          <div className="text-xs text-gray-400">HEALTH</div>
          <div className={`text-3xl font-bold ${health < 30 ? 'text-red-500' : 'text-white'}`}>{health}</div>
        </div>
        <div className="bg-black/60 p-4 rounded min-w-[100px] border-l-4 border-yellow-500">
          <div className="text-xs text-gray-400">MONEY</div>
          <div className="text-3xl font-bold text-green-400">${money}</div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-white font-mono pointer-events-none select-none z-50 flex gap-4 items-end">
        <div className="text-right">
           <div className="text-xl font-bold uppercase text-gray-300">{WEAPONS[currentWeapon].name}</div>
        </div>
        <div className="bg-black/60 p-4 rounded min-w-[120px] text-right border-r-4 border-blue-500">
          <div className="text-xs text-gray-400">AMMO</div>
          <div className="text-3xl font-bold">
            <span className={ammo === 0 ? 'text-red-500' : 'text-white'}>{ammo}</span> 
            <span className="text-lg text-gray-500"> / {reserve}</span>
          </div>
        </div>
      </div>

      {/* Controls Helper */}
      <div className="absolute top-4 left-4 text-white/50 font-mono text-sm pointer-events-none">
        <p>[WASD] Move [SPACE] Jump</p>
        <p>[L-CLICK] Shoot [R-CLICK] Scope</p>
        <p>[R] Reload [B] Buy Menu</p>
      </div>

      {/* Buy Menu Overlay */}
      {showBuyMenu && (
        <BuyMenu onClose={() => {
           setShowBuyMenu(false)
           // Optionally re-lock pointer here or let user click game
        }} />
      )}
    </div>
  )
}

export default App
