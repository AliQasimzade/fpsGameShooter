import { useState } from 'react'
import { useStore, type GameMode, type Team } from '../store'
import { useMultiplayer } from '../useMultiplayer'

export const GameModeSelector = () => {
    const setGameMode = useStore(state => state.setGameMode)
    const mp = useMultiplayer();

    const [showHostLobby, setShowHostLobby] = useState(false)
    const [showJoinScreen, setShowJoinScreen] = useState(false)
    const [playerName, setPlayerName] = useState('Player')
    const [joinRoomId, setJoinRoomId] = useState('')

    const handleSelectMode = (mode: GameMode) => {
        setGameMode(mode)
    }

    const handleHostGame = () => {
        if (!playerName.trim()) return
        mp.createRoom(playerName)
        setShowHostLobby(true)
    }

    const handleJoinGame = () => {
        if (!playerName.trim() || !joinRoomId.trim()) return
        mp.joinRoom(joinRoomId, playerName)
        setShowHostLobby(true)
    }

    const handleJoinTeam = (team: Team) => {
        mp.selectTeam(team)
    }

    const handleStartGame = () => {
        const ctPlayers = mp.lobbyPlayers.filter(p => p.team === 'counter-terrorists')
        const tPlayers = mp.lobbyPlayers.filter(p => p.team === 'terrorists')
        if (ctPlayers.length === 0 && tPlayers.length === 0) return
        mp.startGame()
    }

    // Multiplayer Lobby Screen
    if (showHostLobby && (mp.isHost || mp.roomId)) {
        const ctPlayers = mp.lobbyPlayers.filter(p => p.team === 'counter-terrorists')
        const tPlayers = mp.lobbyPlayers.filter(p => p.team === 'terrorists')
        const myTeam = mp.lobbyPlayers.find(p => p.id === mp.myId)?.team

        return (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-[300]">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="relative z-10 w-full max-w-4xl px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 mb-2">
                            {mp.isHost ? 'HOST GAME LOBBY' : 'MULTIPLAYER LOBBY'}
                        </h1>

                        {/* Connection Status */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className={`w-3 h-3 rounded-full ${mp.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-gray-400 text-sm">{mp.isConnected ? 'Serverə qoşulub' : 'Qoşulmayıb'}</span>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <span className="text-gray-400">Room ID:</span>
                            <span className="bg-gray-800 px-4 py-2 rounded-lg text-2xl font-mono text-yellow-400 tracking-widest select-all cursor-pointer" title="Kopyalamaq üçün seç">
                                {mp.roomId || 'Yaradılır...'}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-2">Bu Room ID-ni dostlarına paylaş ki, onlar da qoşulsun!</p>

                        {mp.error && (
                            <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded-lg">
                                {mp.error}
                            </div>
                        )}
                    </div>

                    {/* Team Selection */}
                    <div className="flex gap-6 mb-8">
                        {/* Counter-Terrorists */}
                        <div className="flex-1 bg-blue-900/30 border-2 border-blue-500/50 rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">
                                COUNTER-TERRORISTS
                                <span className="ml-2 text-lg text-blue-300">({ctPlayers.length})</span>
                            </h2>
                            <div className="min-h-[200px] space-y-2">
                                {ctPlayers.map(p => (
                                    <div key={p.id} className={`px-4 py-3 rounded-lg flex items-center gap-2 ${p.id === mp.myId ? 'bg-blue-600 text-white' : 'bg-blue-900/50 text-blue-200'}`}>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        {p.name} {p.id === mp.myId && '(Sən)'}
                                    </div>
                                ))}
                                {ctPlayers.length === 0 && (
                                    <div className="text-blue-300/50 text-center py-8">Oyunçu yoxdur</div>
                                )}
                            </div>
                            <button
                                onClick={() => handleJoinTeam('counter-terrorists')}
                                disabled={myTeam === 'counter-terrorists'}
                                className={`w-full mt-4 py-3 rounded-lg font-bold transition-all ${myTeam === 'counter-terrorists' ? 'bg-blue-800 text-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                {myTeam === 'counter-terrorists' ? 'BU KOMANDADASAN' : 'CT KOMANDAYA QOŞUL'}
                            </button>
                        </div>

                        {/* Terrorists */}
                        <div className="flex-1 bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-red-400 mb-4 text-center">
                                TERRORISTS
                                <span className="ml-2 text-lg text-red-300">({tPlayers.length})</span>
                            </h2>
                            <div className="min-h-[200px] space-y-2">
                                {tPlayers.map(p => (
                                    <div key={p.id} className={`px-4 py-3 rounded-lg flex items-center gap-2 ${p.id === mp.myId ? 'bg-red-600 text-white' : 'bg-red-900/50 text-red-200'}`}>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        {p.name} {p.id === mp.myId && '(Sən)'}
                                    </div>
                                ))}
                                {tPlayers.length === 0 && (
                                    <div className="text-red-300/50 text-center py-8">Oyunçu yoxdur</div>
                                )}
                            </div>
                            <button
                                onClick={() => handleJoinTeam('terrorists')}
                                disabled={myTeam === 'terrorists'}
                                className={`w-full mt-4 py-3 rounded-lg font-bold transition-all ${myTeam === 'terrorists' ? 'bg-red-800 text-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                            >
                                {myTeam === 'terrorists' ? 'BU KOMANDADASAN' : 'T KOMANDAYA QOŞUL'}
                            </button>
                        </div>
                    </div>

                    {/* Info & Actions */}
                    <div className="text-center">
                        <p className="text-gray-400 mb-4">
                            Oyunçu sayı: {mp.lobbyPlayers.length} • Komanda limiti yoxdur - 1v5, 2v3, 5v5 və s.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => { setShowHostLobby(false); window.location.reload() }}
                                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                            >
                                GERİ
                            </button>
                            {mp.isHost && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={!myTeam || (ctPlayers.length === 0 && tPlayers.length === 0)}
                                    className={`px-12 py-4 rounded-xl font-bold text-xl transition-all ${myTeam && (ctPlayers.length > 0 || tPlayers.length > 0) ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                >
                                    OYUNU BAŞLAT
                                </button>
                            )}
                            {!mp.isHost && (
                                <div className="px-12 py-4 bg-gray-800 rounded-xl text-gray-400 font-bold">
                                    Host oyunu başlatmağı gözləyir...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Join Game Screen
    if (showJoinScreen) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-[300]">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="relative z-10 w-full max-w-md px-8">
                    <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
                        <h2 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
                            OYUNA QOŞUL
                        </h2>

                        {/* Connection Status */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className={`w-3 h-3 rounded-full ${mp.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-gray-400 text-sm">{mp.isConnected ? 'Serverə qoşulub' : 'Serverə qoşulmağa çalışır...'}</span>
                        </div>

                        {mp.error && (
                            <div className="mb-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-center">
                                {mp.error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Adın:</label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Player adı"
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Room ID:</label>
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                    placeholder="Məs: ABC123"
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-purple-500 transition-colors uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowJoinScreen(false)}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                            >
                                GERİ
                            </button>
                            <button
                                onClick={handleJoinGame}
                                disabled={!playerName.trim() || !joinRoomId.trim() || !mp.isConnected}
                                className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${playerName.trim() && joinRoomId.trim() && mp.isConnected ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                            >
                                QOŞUL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-[300]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center">
                {/* Title */}
                <div className="mb-12">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 mb-4 tracking-wider animate-pulse">
                        FPS SHOOTER
                    </h1>
                    <p className="text-gray-400 text-lg">Oyun rejimini seçin</p>

                    {/* Server Status */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`w-2 h-2 rounded-full ${mp.isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        <span className="text-gray-500 text-sm">
                            {mp.isConnected ? 'Server: Online' : 'Serverə qoşulur...'}
                        </span>
                    </div>
                </div>

                {/* Mode Selection - First Row */}
                <div className="flex gap-6 justify-center flex-wrap mb-6">
                    {/* Deathmatch Mode */}
                    <button
                        className="group relative w-56 pb-4 px-2 rounded-2xl bg-gradient-to-b from-orange-900/50 to-red-900/50 border-2 border-orange-500/50 hover:border-orange-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 overflow-hidden"
                    >
                        <div className="mt-6 text-6xl">⚔️</div>
                        <h2 className="text-xl font-bold text-orange-400 mt-3 group-hover:text-orange-300 transition-colors">
                            DEATHMATCH
                        </h2>
                        <div className="px-4 mt-2 space-y-1">
                            <p className="text-gray-300 text-xs">🔫 Free for all</p>
                            <p className="text-gray-300 text-xs">💰 Limitsiz pul</p>
                        </div>
                        <div onClick={() => handleSelectMode('deathmatch')} className="bg-orange-600 mt-3 mx-4 cursor-pointer group-hover:bg-orange-500 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                            OYNA
                        </div>
                    </button>

                    {/* 5v5 Mode */}
                    <button
                        className="group relative w-56 pb-4 px-2 rounded-2xl bg-gradient-to-b from-blue-900/50 to-purple-900/50 border-2 border-blue-500/50 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden"
                    >
                        <div className="mt-6 text-6xl">🏆</div>
                        <h2 className="text-xl font-bold text-blue-400 mt-3 group-hover:text-blue-300 transition-colors">
                            5 vs 5
                        </h2>
                        <div className="px-4 mt-2 space-y-1">
                            <p className="text-gray-300 text-xs">👥 Sən + Botlar</p>
                            <p className="text-gray-300 text-xs">🎯 13 Round</p>
                        </div>
                        <div onClick={() => handleSelectMode('5v5')} className="bg-blue-600 mt-3 mx-4 cursor-pointer group-hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                            OYNA
                        </div>
                    </button>
                </div>

                {/* Mode Selection - Multiplayer Row */}
                <div className="flex gap-6 justify-center flex-wrap">
                    {/* Host Game Mode */}
                    <div className="group relative w-56 pb-4 px-2 rounded-2xl bg-gradient-to-b from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 hover:border-green-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 overflow-hidden">
                        <div className="mt-6 text-6xl">🌐</div>
                        <h2 className="text-xl font-bold text-green-400 mt-3 group-hover:text-green-300 transition-colors">
                            HOST GAME
                        </h2>
                        <div className="px-4 mt-2 space-y-1">
                            <p className="text-gray-300 text-xs">👥 Oyun yarat</p>
                            <p className="text-gray-300 text-xs">🎮 Multiplayer</p>
                        </div>

                        {/* Player Name Input */}
                        <div className="px-4 mt-2">
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Adın"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        <div onClick={handleHostGame} className={`mt-3 mx-4 cursor-pointer text-white font-bold py-2 rounded-lg transition-colors text-sm ${mp.isConnected ? 'bg-green-600 group-hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'}`}>
                            {mp.isConnected ? 'OYUN YARAT' : 'Server gözlənilir...'}
                        </div>
                    </div>

                    {/* Join Game Mode */}
                    <div
                        onClick={() => setShowJoinScreen(true)}
                        className="group relative w-56 pb-4 px-2 rounded-2xl bg-gradient-to-b from-purple-900/50 to-pink-900/50 border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden cursor-pointer"
                    >
                        <div className="mt-6 text-6xl">🚀</div>
                        <h2 className="text-xl font-bold text-purple-400 mt-3 group-hover:text-purple-300 transition-colors">
                            JOIN GAME
                        </h2>
                        <div className="px-4 mt-2 space-y-1">
                            <p className="text-gray-300 text-xs">🔗 Room ID ilə qoşul</p>
                            <p className="text-gray-300 text-xs">👥 Dosta qoşul</p>
                        </div>

                        <div className={`mt-6 mx-4 text-white font-bold py-2 rounded-lg transition-colors text-sm ${mp.isConnected ? 'bg-purple-600 group-hover:bg-purple-500' : 'bg-gray-600'}`}>
                            {mp.isConnected ? 'QOŞUL' : 'Server gözlənilir...'}
                        </div>
                    </div>
                </div>

                {/* Controls Info */}
                <div className="mt-10 text-gray-500 text-sm">
                    <p>[WASD] Hərəkət • [SPACE] Tullan • [Mouse] Nişan al və at</p>
                    <p>[B] Silah al • [TAB] Scoreboard • [R] Reload</p>
                </div>
            </div>
        </div>
    )
}
