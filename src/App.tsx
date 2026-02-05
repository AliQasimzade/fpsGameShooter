import { Game } from './Game'
import { useState, useEffect } from 'react'
import { useStore } from './store'
import { BuyMenu } from './components/BuyMenu'
import { Scoreboard } from './components/Scoreboard'
import { GameModeSelector } from './components/GameModeSelector'

function App() {
  const s = useStore()
  const [showBuyMenu, setShowBuyMenu] = useState(false)

  // Central Countdown Timer logic
  useEffect(() => {
    if (s.roundCountdown > 0) {
      const timer = setInterval(() => {
        if (s.roundCountdown <= 1) {
          s.startRound()
          clearInterval(timer)
        } else {
          s.setRoundCountdown(s.roundCountdown - 1)
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [s.roundCountdown])

  useEffect(() => {
    if (!s.gameMode) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyB' && !s.isDead) setShowBuyMenu(prev => !prev)
      if (e.code === 'Tab') { e.preventDefault(); s.setShowScoreboard(true) }
    }
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Tab') s.setShowScoreboard(false) }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp) }
  }, [s.gameMode, s.isDead, s.setShowScoreboard])

  if (!s.gameMode) return <GameModeSelector />

  return (
    <div className="w-full h-full bg-black select-none font-sans overflow-hidden">
      <Game />

      {/* 3-2-1 Countdown Overlay */}
      {s.roundCountdown > 0 && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-[500] backdrop-blur-sm">
          <div className="text-[180px] font-black text-white animate-pulse dropout-shadow">
            {s.roundCountdown}
          </div>
          <div className="text-3xl font-bold text-blue-400 tracking-[10px] uppercase mt-4">Hazırlaş!</div>
          <div className="mt-8 bg-black/60 px-6 py-2 rounded-full text-white/70 border border-white/20">
            {s.playerTeam === 'counter-terrorists' ? 'KOMANDASI: CT' : 'KOMANDASI: T'}
          </div>
        </div>
      )}

      {/* Flash Effect */}
      {s.isFlashed && (
        <div className="absolute inset-0 bg-white z-[1000]"
          style={{ opacity: Math.max(0, (s.flashEndTime - Date.now()) / 3000) }} />
      )}

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none z-50">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-green-500 shadow-lg" />
        <div className="absolute left-1/2 top-0 h-full w-[2px] bg-green-500 shadow-lg" />
      </div>

      {/* HUD Bottom Left */}
      <div className="absolute bottom-6 left-6 flex gap-4 z-50">
        <div className="bg-black/80 px-6 py-4 rounded-xl border-l-8 border-green-500 min-w-[140px] shadow-2xl backdrop-blur-md">
          <div className="text-gray-400 text-xs font-black tracking-widest">HP</div>
          <div className={`text-5xl font-black ${s.health < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{s.health}</div>
        </div>
        <div className="bg-black/80 px-6 py-4 rounded-xl border-l-8 border-yellow-500 min-w-[140px] shadow-2xl backdrop-blur-md">
          <div className="text-gray-400 text-xs font-black tracking-widest">PUL</div>
          <div className="text-5xl font-black text-yellow-400">${s.money}</div>
        </div>
      </div>

      {/* HUD Bottom Right - Slots */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        <div className="flex gap-1.5 p-2 bg-black/40 rounded-lg backdrop-blur">
          {s.slots.map((item, i) => (
            <div key={i} className={`w-12 h-10 rounded flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${s.currentSlot === i ? 'bg-blue-600 border-white scale-110 shadow-lg' : 'bg-black/60 border-gray-700 text-gray-400'}`}>
              <span className="text-[8px] opacity-50">{i + 1}</span>
              {item ? (i < 4 ? item.toUpperCase().slice(0, 3) : '💣') : ''}
            </div>
          ))}
        </div>
        {s.currentSlot < 4 && s.currentItem && (
          <div className="bg-black/80 px-8 py-5 rounded-xl border-r-8 border-blue-500 shadow-2xl backdrop-blur-md text-right">
            <div className="text-gray-400 text-xs font-black uppercase tracking-widest">{String(s.currentItem)}</div>
            <div className="text-6xl font-black text-white">
              {s.ammo[s.currentItem as keyof typeof s.ammo]} <span className="text-2xl text-gray-500">/ {s.reserves[s.currentItem as keyof typeof s.reserves]}</span>
            </div>
          </div>
        )}
      </div>

      {/* HUD Top - Rounds */}
      {(s.gameMode === '5v5' || s.gameMode === 'host') && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50 bg-black/60 px-8 py-3 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="text-4xl font-black text-blue-500 dropout-shadow">{s.ctScore}</div>
          <div className="text-white font-black px-6 border-x-2 border-white/10 text-center">
            <div className="text-[10px] text-gray-500 tracking-[4px]">ROUND</div>
            <div className="text-xl">{s.currentRound}</div>
          </div>
          <div className="text-4xl font-black text-red-600 dropout-shadow">{s.tScore}</div>
        </div>
      )}

      {/* Death Message */}
      {s.isDead && (
        <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center z-[600] backdrop-blur-xl">
          <div className="text-9xl font-black text-white italic mb-12 tracking-tighter dropout-shadow animate-bounce">MEHV OLDUN</div>
          {s.gameMode === 'deathmatch' ? (
            <button onClick={() => window.location.reload()} className="bg-white text-black px-16 py-6 rounded-full font-black text-2xl hover:scale-110 transition-transform shadow-2xl active:scale-95">RESTART</button>
          ) : (
            <div className="bg-black/40 px-8 py-4 rounded-xl border border-white/10 text-xl text-gray-400 font-bold uppercase tracking-widest">Növbəti roundu gözlə...</div>
          )}
        </div>
      )}

      {showBuyMenu && <BuyMenu onClose={() => setShowBuyMenu(false)} />}
      {s.showScoreboard && <Scoreboard />}

      {/* Controls */}
      <div className="absolute top-6 left-6 text-white/20 font-mono text-[9px] z-50 space-y-1">
        <div>[WASD] MOVE | [SPACE] JUMP | [Z] CROUCH</div>
        <div>[Q/E] PEAK | [1-4] GUNS | [5-8] GADES</div>
        <div>[B] BUY | [TAB] SCORE | [SCROLL] SELECT</div>
      </div>
    </div>
  )
}

export default App
