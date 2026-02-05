import { create } from 'zustand'

export type WeaponType = 'deagle' | 'smg' | 'rifle' | 'sniper'
export type GrenadeType = 'flash' | 'smoke' | 'molotov' | 'heGrenade'
export type ItemType = WeaponType | GrenadeType
export type GameMode = 'deathmatch' | '5v5' | 'host' | null
export type Team = 'counter-terrorists' | 'terrorists'

export interface TeamMember {
  id: string; name: string; isPlayer: boolean; isAlive: boolean; kills: number; deaths: number; assists: number; health: number
}

export interface GrenadeEffect {
  id: string; type: GrenadeType; position: [number, number, number]; startTime: number; duration: number
}

interface GameState {
  gameMode: GameMode; setGameMode: (mode: GameMode) => void
  currentRound: number; maxRounds: number; ctScore: number; tScore: number; playerTeam: Team
  ctTeam: TeamMember[]; tTeam: TeamMember[]; roundActive: boolean; roundCountdown: number; halfTime: boolean
  buyPhaseActive: boolean; buyPhaseTimeLeft: number; health: number; maxHealth: number; money: number; isDead: boolean
  playerStats: { kills: number; deaths: number; assists: number }
  hasHelmet: boolean; hasArmor: boolean; grenades: Record<GrenadeType, number>
  currentSlot: number; slots: AllSlots; currentItem: ItemType | null; currentWeapon: WeaponType
  isFlashed: boolean; flashEndTime: number; setFlashed: (f: boolean, d?: number) => void
  activeEffects: GrenadeEffect[]; addEffect: (e: Omit<GrenadeEffect, 'id'>) => void
  ammo: Record<WeaponType, number>; reserves: Record<WeaponType, number>
  isReloading: boolean; isScoped: boolean; isShooting: boolean; showScoreboard: boolean; setShowScoreboard: (s: boolean) => void
  killLogs: any[]; addKill: (l: any) => void; damageRecords: any[]; addDamageRecord: (dm: string, v: string, d: number) => void
  damagePlayer: (a: number, att?: string) => void;
  addMoney: (a: number) => void;
  buyWeapon: (w: WeaponType) => void; buyGrenade: (g: GrenadeType) => void
  buyEquipment: (t: 'helmet' | 'armor' | 'fullArmor') => void;
  switchToSlot: (i: number) => void; shoot: () => boolean; useGrenade: () => void
  reload: () => void; setScoped: (s: boolean) => void; setCrouching: (c: boolean) => void; setPeak: (d: 'left' | 'right' | 'none') => void
  startRound: () => void; endRound: (w: Team) => void; incrementKills: () => void; incrementAssists: () => void
  resetToMenu: () => void; isCrouching: boolean; peakDirection: 'left' | 'right' | 'none'
  setShooting: (s: boolean) => void; setRoundCountdown: (c: number) => void
  // Multiplayer Host Game State
  isHost: boolean; isConnected: boolean; roomId: string; playerName: string; error: string
  myId: string; setMyId: (id: string) => void
  setIsConnected: (c: boolean) => void; setRoomId: (id: string) => void; setError: (e: string) => void
  remotePlayers: RemotePlayer[]
  setRemotePlayers: (p: RemotePlayer[] | ((prev: RemotePlayer[]) => RemotePlayer[])) => void
  connectedPlayers: { id: string; name: string; team: Team; isReady: boolean }[]
  setPlayerTeam: (team: Team) => void; setPlayerName: (name: string) => void
  hostGame: (roomId: string) => void; joinTeam: (team: Team) => void
  lobbyPlayers: { id: string; name: string; team: Team | null }[]
  setLobbyPlayers: (p: any[]) => void
  addLobbyPlayer: (player: { id: string; name: string; team: Team | null }) => void
  removeLobbyPlayer: (id: string) => void
  updateLobbyPlayerTeam: (id: string, team: Team) => void
  startHostGame: () => void
}

export interface RemotePlayer {
  id: string; name: string; team: Team | null; position: [number, number, number]
  rotation: number; health: number; isAlive: boolean; isShooting?: boolean
}

export const WEAPONS: Record<WeaponType, { name: string; damage: number; fireRate: number; magSize: number; reloadTime: number; price: number; color: string; scope?: boolean; automatic: boolean }> = {
  deagle: { name: 'Desert Eagle', damage: 35, fireRate: 400, magSize: 7, reloadTime: 1500, price: 0, color: '#C0C0C0', automatic: false },
  smg: { name: 'MP5 SMG', damage: 15, fireRate: 100, magSize: 30, reloadTime: 2000, price: 1500, color: '#444', automatic: true },
  rifle: { name: 'AK-47', damage: 30, fireRate: 150, magSize: 30, reloadTime: 2500, price: 2700, color: '#8B4513', automatic: true },
  sniper: { name: 'AWP', damage: 100, fireRate: 1500, magSize: 10, reloadTime: 3000, price: 4750, color: '#2E8B57', scope: true, automatic: false },
}

export const GRENADES: Record<GrenadeType, { name: string, price: number, slot: number }> = {
  flash: { name: 'Flashbang', price: 200, slot: 4 },
  smoke: { name: 'Smoke', price: 300, slot: 5 },
  molotov: { name: 'Molotov', price: 400, slot: 6 },
  heGrenade: { name: 'HE Bomba', price: 300, slot: 7 }
}

export const EQUIPMENT = {
  helmet: { name: 'Kask', price: 350, healthBonus: 25 },
  armor: { name: 'Bronejilet', price: 650, healthBonus: 50 },
  fullArmor: { name: 'Kask + Bronejilet', price: 1000, healthBonus: 75 }
}

export const CT_SPAWNS: [number, number, number][] = [[-100, 2, -100], [-95, 2, -100], [-90, 2, -100], [-85, 2, -100], [-80, 2, -100]]
export const T_SPAWNS: [number, number, number][] = [[100, 2, 100], [95, 2, 100], [90, 2, 100], [85, 2, 100], [80, 2, 100]]

export type AllSlots = [WeaponType | null, WeaponType | null, WeaponType | null, WeaponType | null, GrenadeType | null, GrenadeType | null, GrenadeType | null, GrenadeType | null]

const createInitialTeams = (playerTeam: Team): { ctTeam: TeamMember[], tTeam: TeamMember[] } => {
  const ctTeam = Array.from({ length: 5 }, (_, i) => ({
    id: `ct${i}`, name: i === 0 && playerTeam === 'counter-terrorists' ? 'You' : `CT Bot ${i}`,
    isPlayer: i === 0 && playerTeam === 'counter-terrorists', isAlive: true, kills: 0, deaths: 0, assists: 0, health: 100
  }))
  const tTeam = Array.from({ length: 5 }, (_, i) => ({
    id: `t${i}`, name: i === 0 && playerTeam === 'terrorists' ? 'You' : `T Bot ${i}`,
    isPlayer: i === 0 && playerTeam === 'terrorists', isAlive: true, kills: 0, deaths: 0, assists: 0, health: 100
  }))
  return { ctTeam, tTeam }
}

export const useStore = create<GameState>((set, get) => ({
  gameMode: null, currentRound: 1, maxRounds: 13, ctScore: 0, tScore: 0, playerTeam: 'counter-terrorists',
  ctTeam: [], tTeam: [], roundActive: false, roundCountdown: 0, halfTime: false, buyPhaseActive: false, buyPhaseTimeLeft: 0,
  health: 100, maxHealth: 100, money: 800, isDead: false, playerStats: { kills: 0, deaths: 0, assists: 0 },
  hasHelmet: false, hasArmor: false, grenades: { flash: 0, smoke: 0, molotov: 0, heGrenade: 0 },
  currentSlot: 0, slots: ['deagle', null, null, null, null, null, null, null], currentItem: 'deagle', currentWeapon: 'deagle',
  isFlashed: false, flashEndTime: 0, activeEffects: [],
  ammo: { deagle: 7, smg: 30, rifle: 30, sniper: 10 }, reserves: { deagle: 35, smg: 120, rifle: 90, sniper: 30 },
  isReloading: false, isScoped: false, isShooting: false, showScoreboard: false, killLogs: [], damageRecords: [],
  isCrouching: false, peakDirection: 'none',
  // Multiplayer Host Game State
  isHost: false, isConnected: false, roomId: '', playerName: 'Player', error: '',
  myId: '', remotePlayers: [],
  setMyId: (id) => set({ myId: id }),
  setIsConnected: (c) => set({ isConnected: c }),
  setRoomId: (id) => set({ roomId: id }),
  setError: (e) => set({ error: e }),
  setRemotePlayers: (p) => set(state => ({
    remotePlayers: typeof p === 'function' ? p(state.remotePlayers) : p
  })),
  connectedPlayers: [], lobbyPlayers: [],
  setLobbyPlayers: (p) => set({ lobbyPlayers: p }),

  setGameMode: (mode) => {
    const teams = createInitialTeams('counter-terrorists')
    set({
      gameMode: mode, ...teams, money: mode === '5v5' ? 800 : 16000, currentSlot: 0, currentItem: 'deagle', currentWeapon: 'deagle',
      slots: ['deagle', null, null, null, null, null, null, null], playerStats: { kills: 0, deaths: 0, assists: 0 },
      ctScore: 0, tScore: 0, currentRound: 1, health: 100, isDead: false, roundActive: false, roundCountdown: 0, activeEffects: []
    })
  },
  setRoundCountdown: (c) => set({ roundCountdown: c }),
  setFlashed: (f, d = 3000) => set({ isFlashed: f, flashEndTime: f ? Date.now() + d : 0 }),
  addEffect: (e) => set(s => {
    const id = Math.random().toString(36).substr(2, 9)
    const newEffect = { ...e, id }
    setTimeout(() => {
      set(curr => ({ activeEffects: curr.activeEffects.filter(fx => fx.id !== id) }))
    }, e.duration)
    return { activeEffects: [...s.activeEffects, newEffect] }
  }),
  setShowScoreboard: (s) => set({ showScoreboard: s }),
  setShooting: (s) => set({ isShooting: s }),
  setCrouching: (c) => set({ isCrouching: c }),
  setPeak: (d) => set({ peakDirection: d }),
  setScoped: (s) => set({ isScoped: s }),
  addMoney: (a) => set(s => ({ money: Math.min(16000, s.money + a) })),

  switchToSlot: (i) => set((s) => s.slots[i] ? { currentSlot: i, currentItem: s.slots[i], currentWeapon: i < 4 ? (s.slots[i] as WeaponType) : s.currentWeapon, isReloading: false, isScoped: false } : {}),

  buyWeapon: (w) => set((s) => {
    if (s.money < WEAPONS[w].price) return {}
    const newSlots = [...s.slots] as AllSlots
    const emptyIdx = newSlots.slice(0, 4).findIndex(s => s === null)
    const idx = emptyIdx !== -1 ? emptyIdx : s.currentSlot
    if (idx > 3) return {}
    newSlots[idx] = w
    return { money: s.money - WEAPONS[w].price, slots: newSlots, currentItem: w, currentWeapon: w, currentSlot: idx }
  }),

  buyGrenade: (g) => set((s) => {
    if (s.money < GRENADES[g].price) return {}
    const newSlots = [...s.slots] as AllSlots
    newSlots[GRENADES[g].slot] = g
    return { money: s.money - GRENADES[g].price, slots: newSlots, grenades: { ...s.grenades, [g]: s.grenades[g] + 1 } }
  }),

  useGrenade: () => {
    const s = get(); const g = s.currentItem as GrenadeType
    if (s.currentSlot < 4 || s.grenades[g] <= 0) return
    set((state) => {
      const newG = { ...state.grenades, [g]: state.grenades[g] - 1 }
      const newSl = [...state.slots] as AllSlots
      let nItem = s.currentItem; let nSl = s.currentSlot; let nWep = s.currentWeapon
      if (newG[g] <= 0) { newSl[s.currentSlot] = null; nSl = 0; nItem = newSl[0]; nWep = newSl[0] as WeaponType }
      return { grenades: newG, slots: newSl, currentItem: nItem, currentSlot: nSl, currentWeapon: nWep }
    })
  },

  damagePlayer: (amount) => set((s) => {
    if (s.isDead) return {}
    const newH = s.health - amount
    if (newH <= 0) return { health: 0, isDead: true, playerStats: { ...s.playerStats, deaths: s.playerStats.deaths + 1 } }
    return { health: newH }
  }),

  shoot: () => {
    const s = get()
    if (s.currentSlot > 3 || !s.currentItem || s.roundCountdown > 0) return false
    const w = s.currentItem as WeaponType
    if (s.isReloading || s.ammo[w] <= 0) return false
    set({ ammo: { ...s.ammo, [w]: s.ammo[w] - 1 } })
    return true
  },

  reload: () => {
    const s = get(); if (s.currentSlot > 3 || !s.currentItem) return
    const w = s.currentItem as WeaponType
    if (s.isReloading || s.ammo[w] >= WEAPONS[w].magSize) return
    set({ isReloading: true })
    setTimeout(() => {
      if (useStore.getState().currentItem === w) set((st) => ({ ammo: { ...st.ammo, [w]: WEAPONS[w].magSize }, isReloading: false }))
      else set({ isReloading: false })
    }, WEAPONS[w].reloadTime)
  },

  buyEquipment: (t) => set(s => {
    const eq = EQUIPMENT[t]; if (s.money < eq.price) return {}
    return { money: s.money - eq.price, health: Math.min(100 + eq.healthBonus, s.health + eq.healthBonus), maxHealth: 100 + eq.healthBonus, hasHelmet: t === 'helmet' || t === 'fullArmor' ? true : s.hasHelmet, hasArmor: t === 'armor' || t === 'fullArmor' ? true : s.hasArmor }
  }),

  startRound: () => set({ roundActive: true, isDead: false, health: 100, roundCountdown: 0 }),
  endRound: (win) => set((s) => ({
    roundActive: false, ctScore: win === 'counter-terrorists' ? s.ctScore + 1 : s.ctScore, tScore: win === 'terrorists' ? s.tScore + 1 : s.tScore,
    currentRound: s.currentRound + 1, money: Math.min(16000, s.money + (win === s.playerTeam ? 3250 : 1400)),
    roundCountdown: 3 // Start countdown for next round
  })),
  incrementKills: () => set(s => ({ playerStats: { ...s.playerStats, kills: s.playerStats.kills + 1 } })),
  incrementAssists: () => set(s => ({ playerStats: { ...s.playerStats, assists: s.playerStats.assists + 1 } })),
  resetToMenu: () => set({ gameMode: null, currentRound: 0, ctScore: 0, tScore: 0, roundActive: false, isHost: false, isConnected: false, lobbyPlayers: [] }),
  addKill: (l) => set(s => ({ killLogs: [...s.killLogs, { ...l, id: Date.now() }] })),
  addDamageRecord: (dm, v, d) => set(s => ({ damageRecords: [...s.damageRecords, { dm, v, d, ts: Date.now() }] })),

  // Multiplayer Host Game Functions
  setPlayerTeam: (team) => set({ playerTeam: team }),
  setPlayerName: (name) => set({ playerName: name }),
  hostGame: (roomId) => {
    set({
      isHost: true,
      isConnected: true,
      roomId
    })
  },
  joinTeam: (team) => set(s => {
    const myId = s.lobbyPlayers.find(p => p.name === s.playerName)?.id
    if (!myId) return {}
    return {
      playerTeam: team,
      lobbyPlayers: s.lobbyPlayers.map(p => p.id === myId ? { ...p, team } : p)
    }
  }),
  addLobbyPlayer: (player) => set(s => ({ lobbyPlayers: [...s.lobbyPlayers, player] })),
  removeLobbyPlayer: (id) => set(s => ({ lobbyPlayers: s.lobbyPlayers.filter(p => p.id !== id) })),
  updateLobbyPlayerTeam: (id, team) => set(s => ({
    lobbyPlayers: s.lobbyPlayers.map(p => p.id === id ? { ...p, team } : p)
  })),
  startHostGame: () => {
    const s = get()
    const ctPlayers = s.lobbyPlayers.filter(p => p.team === 'counter-terrorists')
    const tPlayers = s.lobbyPlayers.filter(p => p.team === 'terrorists')

    const ctTeam: TeamMember[] = ctPlayers.map((p) => ({
      id: p.id, name: p.name, isPlayer: p.name === s.playerName, isAlive: true, kills: 0, deaths: 0, assists: 0, health: 100
    }))
    const tTeam: TeamMember[] = tPlayers.map((p) => ({
      id: p.id, name: p.name, isPlayer: p.name === s.playerName, isAlive: true, kills: 0, deaths: 0, assists: 0, health: 100
    }))

    set({
      gameMode: 'host',
      ctTeam,
      tTeam,
      money: 800,
      currentSlot: 0,
      currentItem: 'deagle',
      currentWeapon: 'deagle',
      slots: ['deagle', null, null, null, null, null, null, null],
      playerStats: { kills: 0, deaths: 0, assists: 0 },
      ctScore: 0,
      tScore: 0,
      currentRound: 1,
      health: 100,
      isDead: false,
      roundActive: false,
      roundCountdown: 3,
      activeEffects: []
    })
  }
}))
