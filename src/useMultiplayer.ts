import { io, Socket } from 'socket.io-client'
import { useEffect, useState } from 'react'
import { useStore, type Team, type RemotePlayer } from './store'

// Server URL - localhost və ya şəbəkə IP-sinə avtomatik uyğunlaşır
const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`

let socket: Socket | null = null

export const getSocket = () => socket

export const useMultiplayer = () => {
    const s = useStore()
    const [gameStartedLocal, setGameStartedLocal] = useState(false)

    useEffect(() => {
        if (socket) return // Prevent multiple connections

        // Connect to server
        socket = io(SERVER_URL, {
            transports: ['websocket', 'polling']
        })

        socket.on('connect', () => {
            console.log('Connected to server:', socket?.id)
            s.setIsConnected(true)
            s.setMyId(socket?.id || '')
        })

        socket.on('disconnect', () => {
            console.log('Disconnected from server')
            s.setIsConnected(false)
        })

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err)
            s.setError('Server-ə qoşula bilmədim. Server işləyirmi?')
        })

        // Room created
        socket.on('room_created', ({ roomId, players }) => {
            s.setRoomId(roomId)
            s.setLobbyPlayers(players)
            s.hostGame(roomId)
        })

        // Room joined
        socket.on('room_joined', ({ roomId, players }) => {
            s.setRoomId(roomId)
            s.setLobbyPlayers(players)
        })

        // Join error
        socket.on('join_error', ({ message }) => {
            s.setError(message)
            setTimeout(() => s.setError(''), 3000)
        })

        // Player joined
        socket.on('player_joined', ({ players }) => {
            s.setLobbyPlayers(players)
        })

        // Player left
        socket.on('player_left', ({ players }) => {
            s.setLobbyPlayers(players)
            s.setRemotePlayers(prev => prev.filter(p => players.some((lp: any) => lp.id === p.id)))
        })

        // Team updated
        socket.on('team_updated', ({ players }) => {
            s.setLobbyPlayers(players)
        })

        // New host assigned
        socket.on('new_host', ({ hostId }) => {
            if (socket?.id === hostId) {
                // We keep isHost locally if needed but it's better in store
                // s.setIsHost(true) 
            }
        })

        // Game started
        socket.on('game_started', ({ players }) => {
            console.log('Game started payload:', players)
            setGameStartedLocal(true)
            s.setRemotePlayers(players.filter((p: RemotePlayer) => p.id !== socket?.id))

            const me = players.find((p: RemotePlayer) => p.id === socket?.id)
            if (me) {
                s.setPlayerTeam(me.team!)
                s.startHostGame()
            }
        })

        // Remote player moved
        socket.on('player_moved', ({ playerId, position, rotation, isShooting, health, isAlive }) => {
            s.setRemotePlayers(prev => {
                const exists = prev.find(p => p.id === playerId)
                if (!exists) {
                    const lobbyPlayer = s.lobbyPlayers.find(lp => lp.id === playerId)
                    const newPlayer: RemotePlayer = {
                        id: playerId,
                        name: lobbyPlayer?.name || 'Player',
                        team: lobbyPlayer?.team || null,
                        position,
                        rotation,
                        isShooting,
                        health,
                        isAlive
                    }
                    return [...prev, newPlayer]
                }
                return prev.map(p =>
                    p.id === playerId
                        ? { ...p, position, rotation, isShooting, health, isAlive }
                        : p
                )
            })
        })

        // Player hit
        socket.on('player_hit', ({ targetId, damage, newHealth, isAlive }) => {
            if (socket?.id === targetId) {
                s.damagePlayer(damage)
            }

            s.setRemotePlayers(prev => prev.map(p =>
                p.id === targetId
                    ? { ...p, health: newHealth, isAlive }
                    : p
            ))
        })

        // Round ended
        socket.on('round_ended', ({ winner, ctScore, tScore, currentRound }) => {
            s.endRound(winner)
            // Sync scores just in case
            useStore.setState({ ctScore, tScore, currentRound })
        })

        // Round started
        socket.on('round_started', ({ players, currentRound }) => {
            s.startRound()
            useStore.setState({ currentRound })

            // Sync players health and positions
            s.setRemotePlayers(players.filter((p: RemotePlayer) => p.id !== socket?.id))

            // Re-spawn local player
            const me = players.find((p: RemotePlayer) => p.id === socket?.id)
            if (me) {
                // We'll let the Player.tsx component handle the actual position reset 
                // because it has access to the physics API, but we need to trigger it
                s.setRoundCountdown(3)
            }
        })

        return () => {
            // We don't disconnect here because multiple components use this hook
        }
    }, [])

    // Create room
    const createRoom = (playerName: string) => {
        if (!socket) return
        socket.emit('create_room', { playerName })
    }

    // Join room
    const joinRoom = (roomIdInput: string, playerName: string) => {
        if (!socket) return
        s.setError('')
        socket.emit('join_room', { roomId: roomIdInput, playerName })
    }

    // Select team
    const selectTeam = (team: Team) => {
        if (!socket) return
        socket.emit('select_team', { team })
        s.setPlayerTeam(team)
    }

    // Start game (host only)
    const startGame = () => {
        if (!socket || !s.isHost) return
        socket.emit('start_game')
    }

    // Update my position
    const updatePosition = (position: [number, number, number], rotation: number, isShooting: boolean) => {
        if (!socket || s.gameMode !== 'host') return
        socket.emit('player_update', {
            position,
            rotation,
            isShooting,
            health: s.health,
            isAlive: !s.isDead
        })
    }

    // Report hit on another player
    const reportHit = (targetId: string, damage: number, isHeadshot: boolean) => {
        if (!socket) return
        socket.emit('player_shoot', { targetId, damage, isHeadshot })
    }

    return {
        isConnected: s.isConnected,
        roomId: s.roomId,
        isHost: s.isHost,
        error: s.error,
        lobbyPlayers: s.lobbyPlayers,
        remotePlayers: s.remotePlayers,
        gameStarted: gameStartedLocal,
        myId: s.myId,
        createRoom,
        joinRoom,
        selectTeam,
        startGame,
        updatePosition,
        reportHit
    }
}
