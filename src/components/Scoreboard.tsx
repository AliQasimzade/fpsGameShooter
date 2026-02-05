import { useStore, type TeamMember } from '../store'
import { useMultiplayer } from '../useMultiplayer'

export const Scoreboard = () => {
    const { remotePlayers, myId } = useMultiplayer()
    const playerStats = useStore(state => state.playerStats)
    const gameMode = useStore(state => state.gameMode)
    const ctTeam = useStore(state => state.ctTeam)
    const tTeam = useStore(state => state.tTeam)
    const ctScore = useStore(state => state.ctScore)
    const tScore = useStore(state => state.tScore)
    const currentRound = useStore(state => state.currentRound)
    const playerTeam = useStore(state => state.playerTeam)
    const playerName = useStore(state => state.playerName)
    const halfTime = useStore(state => state.halfTime)

    // Merge store teams with remote players for multiplayer
    const getFullTeam = (storeTeam: TeamMember[], teamType: 'counter-terrorists' | 'terrorists') => {
        if (gameMode !== 'host') return storeTeam

        // For multiplayer, we use the remotePlayers + ourselves
        const remoteTeam = remotePlayers
            .filter(p => p.team === teamType)
            .map(p => ({
                id: p.id,
                name: p.name,
                isPlayer: false,
                isAlive: p.isAlive,
                kills: 0, // Server-side tracking needed for these later
                deaths: 0,
                assists: 0,
                health: p.health
            }))

        // Find ourselves if we are in this team
        const me = playerTeam === teamType ? [{
            id: myId,
            name: playerName + " (Sən)",
            isPlayer: true,
            isAlive: useStore.getState().health > 0,
            kills: playerStats.kills,
            deaths: playerStats.deaths,
            assists: playerStats.assists,
            health: useStore.getState().health
        }] : []

        return [...me, ...remoteTeam]
    }

    const finalCTTeam = getFullTeam(ctTeam, 'counter-terrorists')
    const finalTTeam = getFullTeam(tTeam, 'terrorists')

    if (gameMode === 'deathmatch') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
                <div className="bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 p-8 min-w-[450px] shadow-2xl">
                    <h2 className="text-3xl font-black text-center text-white mb-6 tracking-[8px] uppercase">
                        Scoreboard
                    </h2>

                    <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 border border-white/10 shadow-inner">
                        <div className="text-center mb-6">
                            <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Oyunçu</div>
                            <div className="text-3xl font-black text-white italic">SİZ (DEATHMATCH)</div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-600/20 rounded-xl p-5 text-center border border-green-500/30">
                                <div className="text-5xl font-black text-green-400">{playerStats.kills}</div>
                                <div className="text-[10px] font-black text-green-300/60 mt-1 uppercase">Kills</div>
                            </div>
                            <div className="bg-red-600/20 rounded-xl p-5 text-center border border-red-500/30">
                                <div className="text-5xl font-black text-red-400">{playerStats.deaths}</div>
                                <div className="text-[10px] font-black text-red-300/60 mt-1 uppercase">Deaths</div>
                            </div>
                            <div className="bg-yellow-600/20 rounded-xl p-5 text-center border border-yellow-500/30">
                                <div className="text-5xl font-black text-yellow-400">{playerStats.assists}</div>
                                <div className="text-[10px] font-black text-yellow-300/60 mt-1 uppercase">Assists</div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-white/20 text-[10px] font-mono mt-8 uppercase tracking-[3px]">
                        Release [TAB] to close
                    </div>
                </div>
            </div>
        )
    }

    const renderTeamList = (team: any[], isCT: boolean) => (
        <div className={`flex flex-col gap-2`}>
            <div className="grid grid-cols-5 text-[10px] font-black text-gray-500 px-3 py-1 uppercase tracking-widest border-b border-white/5">
                <span className="col-span-2">İsim</span>
                <span className="text-center">K</span>
                <span className="text-center">D</span>
                <span className="text-center">A</span>
            </div>
            {team.map(m => (
                <div key={m.id} className={`grid grid-cols-5 items-center p-3 rounded-xl transition-all relative overflow-hidden ${m.isAlive
                    ? (m.isPlayer ? 'bg-white/15 border border-yellow-500/60 shadow-lg' : 'bg-white/5 border border-white/10')
                    : 'bg-black/80 border border-white/5 opacity-40 grayscale'
                    }`}>
                    {/* Status Indicator for Dead Players */}
                    {!m.isAlive && (
                        <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center pointer-events-none">
                            <span className="text-[40px] font-black text-red-600/5 uppercase -rotate-12 tracking-widest">RIP</span>
                        </div>
                    )}

                    <div className="col-span-2 flex items-center gap-2">
                        {/* Status Icon */}
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${m.isAlive ? (isCT ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400') : 'bg-red-900/60 text-red-100'}`}>
                            {m.isAlive ? (m.isPlayer ? '★' : '•') : '✕'}
                        </div>

                        <span className={`font-black tracking-tight truncate ${m.isAlive ? (isCT ? 'text-blue-400' : 'text-red-400') : 'text-gray-600'}`}>
                            {m.name}
                        </span>
                        {!m.isAlive && <span className="text-[10px] text-red-900 font-black ml-1 uppercase">DEAD</span>}
                    </div>
                    <span className={`text-center font-black ${m.isAlive ? 'text-white' : 'text-gray-700'}`}>{m.kills}</span>
                    <span className={`text-center font-black ${m.isAlive ? 'text-white/60' : 'text-gray-700'}`}>{m.deaths}</span>
                    <span className={`text-center font-black ${m.isAlive ? 'text-white/60' : 'text-gray-700'}`}>{m.assists}</span>
                </div>
            ))}
        </div>
    )

    return (
        <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none px-4">
            <div className="bg-black/95 backdrop-blur-3xl rounded-[40px] border border-white/10 p-10 w-full max-w-[1000px] shadow-[0_0_150px_rgba(0,0,0,0.9)] scale-90 md:scale-100">
                {/* Score Header */}
                <div className="flex items-center justify-between mb-12 px-10">
                    <div className="flex flex-col items-center">
                        <div className="text-[90px] font-black text-blue-500 leading-none dropout-shadow tracking-tighter">{ctScore}</div>
                        <div className="text-blue-400 font-black tracking-[12px] uppercase text-[10px] mt-4 opacity-70">Anti-Terror forces</div>
                    </div>

                    <div className="flex flex-col items-center bg-white/5 px-12 py-5 rounded-[30px] border border-white/10 shadow-2xl relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">Live Match</div>
                        <div className="text-[10px] font-black text-gray-500 tracking-[6px] uppercase mb-1 opacity-50">Round</div>
                        <div className="text-5xl font-black text-white italic leading-none">{currentRound}</div>
                        {halfTime && <div className="text-[9px] text-yellow-400 font-black mt-3 bg-yellow-400/10 px-4 py-1 rounded-full border border-yellow-400/20 animate-pulse uppercase tracking-[3px]">Side Switched</div>}
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="text-[90px] font-black text-red-600 leading-none dropout-shadow tracking-tighter">{tScore}</div>
                        <div className="text-red-400 font-black tracking-[12px] uppercase text-[10px] mt-4 opacity-70">Terrorist Cell</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-6 px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-10 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Team CT</h3>
                            </div>
                            <div className="text-[10px] text-blue-400/50 font-black tracking-widest">{finalCTTeam.filter(m => m.isAlive).length}/5 ALIVE</div>
                        </div>
                        {renderTeamList(finalCTTeam, true)}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-6 px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-10 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Team T</h3>
                            </div>
                            <div className="text-[10px] text-red-500/50 font-black tracking-widest">{finalTTeam.filter(m => m.isAlive).length}/5 ALIVE</div>
                        </div>
                        {renderTeamList(finalTTeam, false)}
                    </div>
                </div>

                <div className="text-center text-white/5 text-[9px] font-mono mt-12 uppercase tracking-[10px]">
                    Competitive Mode • Match Statistics
                </div>
            </div>
        </div>
    )
}
