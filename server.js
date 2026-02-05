import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

// Store active rooms
const rooms = new Map()

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id)

    // Create a new room (host game)
    socket.on('create_room', ({ playerName }) => {
        const roomId = Math.random().toString(36).substr(2, 6).toUpperCase()

        const room = {
            id: roomId,
            hostId: socket.id,
            players: [{
                id: socket.id,
                name: playerName,
                team: null,
                position: [0, 2, 0],
                rotation: 0,
                health: 100,
                isAlive: true
            }],
            gameStarted: false,
            ctScore: 0,
            tScore: 0,
            currentRound: 1
        }

        rooms.set(roomId, room)
        socket.join(roomId)
        socket.roomId = roomId

        socket.emit('room_created', { roomId, players: room.players })
        console.log(`Room ${roomId} created by ${playerName}`)
    })

    // Join an existing room
    socket.on('join_room', ({ roomId, playerName }) => {
        const room = rooms.get(roomId.toUpperCase())

        if (!room) {
            socket.emit('join_error', { message: 'Room tapılmadı! Room ID yoxla.' })
            return
        }

        if (room.gameStarted) {
            socket.emit('join_error', { message: 'Oyun artıq başlayıb!' })
            return
        }

        const player = {
            id: socket.id,
            name: playerName,
            team: null,
            position: [0, 2, 0],
            rotation: 0,
            health: 100,
            isAlive: true
        }

        room.players.push(player)
        socket.join(roomId.toUpperCase())
        socket.roomId = roomId.toUpperCase()

        socket.emit('room_joined', { roomId: room.id, players: room.players })
        io.to(room.id).emit('player_joined', { player, players: room.players })

        console.log(`${playerName} joined room ${roomId}`)
    })

    // Player selects a team
    socket.on('select_team', ({ team }) => {
        const room = rooms.get(socket.roomId)
        if (!room) return

        const player = room.players.find(p => p.id === socket.id)
        if (player) {
            player.team = team
            io.to(room.id).emit('team_updated', { playerId: socket.id, team, players: room.players })
        }
    })

    // Host starts the game
    socket.on('start_game', () => {
        const room = rooms.get(socket.roomId)
        if (!room || room.hostId !== socket.id) return

        room.gameStarted = true

        // Assign spawn positions
        const ctPlayers = room.players.filter(p => p.team === 'counter-terrorists')
        const tPlayers = room.players.filter(p => p.team === 'terrorists')

        const CT_SPAWNS = [[-20, 2, -20], [-18, 2, -20], [-16, 2, -20], [-14, 2, -20], [-12, 2, -20]]
        const T_SPAWNS = [[20, 2, 20], [18, 2, 20], [16, 2, 20], [14, 2, 20], [12, 2, 20]]

        ctPlayers.forEach((p, i) => {
            p.position = CT_SPAWNS[i % CT_SPAWNS.length]
        })
        tPlayers.forEach((p, i) => {
            p.position = T_SPAWNS[i % T_SPAWNS.length]
        })

        io.to(room.id).emit('game_started', { players: room.players })
        console.log(`Game started in room ${room.id}`)
    })

    // Player position update (frequent)
    socket.on('player_update', ({ position, rotation, isShooting, health, isAlive }) => {
        const room = rooms.get(socket.roomId)
        if (!room) return

        const player = room.players.find(p => p.id === socket.id)
        if (player) {
            player.position = position
            player.rotation = rotation
            player.health = health
            player.isAlive = isAlive

            // Broadcast to other players in the room
            socket.to(room.id).emit('player_moved', {
                playerId: socket.id,
                position,
                rotation,
                isShooting,
                health,
                isAlive
            })
        }
    })

    // Helper to check round end
    const checkRoundEnd = (room) => {
        if (!room || !room.gameStarted || room.roundEnding) return

        const aliveCT = room.players.filter(p => p.team === 'counter-terrorists' && p.isAlive).length
        const aliveT = room.players.filter(p => p.team === 'terrorists' && p.isAlive).length

        // If game has started and players are assigned teams
        const totalCT = room.players.filter(p => p.team === 'counter-terrorists').length
        const totalT = room.players.filter(p => p.team === 'terrorists').length

        if (totalCT > 0 && totalT > 0) {
            let winner = null
            if (aliveCT === 0) winner = 'terrorists'
            else if (aliveT === 0) winner = 'counter-terrorists'

            if (winner) {
                room.roundEnding = true
                if (winner === 'counter-terrorists') room.ctScore++
                else room.tScore++

                io.to(room.id).emit('round_ended', {
                    winner,
                    ctScore: room.ctScore,
                    tScore: room.tScore,
                    currentRound: room.currentRound
                })

                console.log(`Round ${room.currentRound} ended. Winner: ${winner}`)

                // Start next round after 5 seconds
                setTimeout(() => {
                    room.currentRound++
                    room.roundEnding = false

                    // Reset players
                    const CT_SPAWNS = [[-20, 2, -20], [-18, 2, -20], [-16, 2, -20], [-14, 2, -20], [-12, 2, -20]]
                    const T_SPAWNS = [[20, 2, 20], [18, 2, 20], [16, 2, 20], [14, 2, 20], [12, 2, 20]]

                    const ctPlayers = room.players.filter(p => p.team === 'counter-terrorists')
                    const tPlayers = room.players.filter(p => p.team === 'terrorists')

                    room.players.forEach(p => {
                        p.health = 100
                        p.isAlive = true
                    })

                    ctPlayers.forEach((p, i) => { p.position = CT_SPAWNS[i % CT_SPAWNS.length] })
                    tPlayers.forEach((p, i) => { p.position = T_SPAWNS[i % T_SPAWNS.length] })

                    io.to(room.id).emit('round_started', {
                        players: room.players,
                        currentRound: room.currentRound
                    })
                    console.log(`Round ${room.currentRound} started in room ${room.id}`)
                }, 5000)
            }
        }
    }

    // Player shoots
    socket.on('player_shoot', ({ targetId, damage, isHeadshot }) => {
        const room = rooms.get(socket.roomId)
        if (!room) return

        const target = room.players.find(p => p.id === targetId)
        if (target && target.isAlive) {
            target.health -= damage
            if (target.health <= 0) {
                target.health = 0
                target.isAlive = false
            }

            io.to(room.id).emit('player_hit', {
                targetId,
                attackerId: socket.id,
                damage,
                isHeadshot,
                newHealth: target.health,
                isAlive: target.isAlive
            })

            // Check if round ended after this kill
            if (!target.isAlive) {
                checkRoundEnd(room)
            }
        }
    })

    // Chat message
    socket.on('chat_message', ({ message }) => {
        const room = rooms.get(socket.roomId)
        if (!room) return

        const player = room.players.find(p => p.id === socket.id)
        if (player) {
            io.to(room.id).emit('chat_message', {
                playerName: player.name,
                message
            })
        }
    })

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id)

        const room = rooms.get(socket.roomId)
        if (!room) return

        room.players = room.players.filter(p => p.id !== socket.id)

        if (room.players.length === 0) {
            rooms.delete(socket.roomId)
            console.log(`Room ${socket.roomId} deleted (empty)`)
        } else {
            io.to(room.id).emit('player_left', { playerId: socket.id, players: room.players })

            // If host left, assign new host
            if (room.hostId === socket.id && room.players.length > 0) {
                room.hostId = room.players[0].id
                io.to(room.id).emit('new_host', { hostId: room.hostId })
            }
        }
    })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     FPS SHOOTER - MULTIPLAYER SERVER           ║
╠════════════════════════════════════════════════╣
║  Server running on port ${PORT}                    ║
║                                                ║
║  Local:   http://localhost:${PORT}                 ║
║  Network: http://<YOUR_IP>:${PORT}                 ║
║                                                ║
║  Share your IP with friends to join!           ║
╚════════════════════════════════════════════════╝
  `)
})
