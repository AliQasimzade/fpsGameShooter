import { create } from 'zustand'

export type WeaponType = 'deagle' | 'smg' | 'rifle' | 'sniper'

interface WeaponStats {
  name: string
  damage: number
  fireRate: number // ms between shots
  magSize: number
  reloadTime: number // ms
  price: number
  color: string
  scope?: boolean
}

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  deagle: { name: 'Desert Eagle', damage: 35, fireRate: 400, magSize: 7, reloadTime: 1500, price: 0, color: '#C0C0C0' },
  smg: { name: 'MP5 SMG', damage: 15, fireRate: 100, magSize: 30, reloadTime: 2000, price: 1500, color: '#444' },
  rifle: { name: 'AK-47', damage: 30, fireRate: 150, magSize: 30, reloadTime: 2500, price: 2700, color: '#8B4513' },
  sniper: { name: 'AWP', damage: 100, fireRate: 1500, magSize: 10, reloadTime: 3000, price: 4750, color: '#2E8B57', scope: true },
}

interface GameState {
  health: number
  money: number
  isDead: boolean
  
  // Weapon State
  currentWeapon: WeaponType
  ammo: Record<WeaponType, number> // Current ammo in mag
  reserves: Record<WeaponType, number> // Reserve ammo (infinite for now for simplicity or managed)
  ownedWeapons: WeaponType[]
  isReloading: boolean
  isScoped: boolean

  // Actions
  damagePlayer: (amount: number) => void
  healPlayer: (amount: number) => void
  addMoney: (amount: number) => void
  buyWeapon: (weapon: WeaponType) => void
  switchWeapon: (weapon: WeaponType) => void
  shoot: () => boolean // returns true if shot fired
  reload: () => void
  setScoped: (scoped: boolean) => void
  resetGame: () => void
}

export const useStore = create<GameState>((set, get) => ({
  health: 100,
  money: 800,
  isDead: false,
  
  currentWeapon: 'deagle',
  ammo: { deagle: 7, smg: 30, rifle: 30, sniper: 10 },
  reserves: { deagle: 35, smg: 120, rifle: 90, sniper: 30 },
  ownedWeapons: ['deagle'],
  isReloading: false,
  isScoped: false,

  damagePlayer: (amount) => set((state) => {
    const newHealth = Math.max(0, state.health - amount)
    return { 
      health: newHealth, 
      isDead: newHealth === 0 
    }
  }),

  healPlayer: (amount) => set((state) => ({ health: Math.min(100, state.health + amount) })),
  
  addMoney: (amount) => set((state) => ({ money: state.money + amount })),

  buyWeapon: (weapon) => set((state) => {
    const cost = WEAPONS[weapon].price
    if (state.money >= cost && !state.ownedWeapons.includes(weapon)) {
      return {
        money: state.money - cost,
        ownedWeapons: [...state.ownedWeapons, weapon],
        currentWeapon: weapon, // Auto switch to new weapon
        isScoped: false
      }
    }
    return {}
  }),

  switchWeapon: (weapon) => set((state) => {
    if (state.ownedWeapons.includes(weapon)) {
      return { 
        currentWeapon: weapon, 
        isReloading: false,
        isScoped: false 
      }
    }
    return {}
  }),

  shoot: () => {
    const state = get()
    if (state.isReloading || state.ammo[state.currentWeapon] <= 0) return false
    
    set((state) => ({
      ammo: { ...state.ammo, [state.currentWeapon]: state.ammo[state.currentWeapon] - 1 }
    }))
    return true
  },

  reload: () => {
    const state = get()
    const weapon = WEAPONS[state.currentWeapon]
    if (state.isReloading || state.ammo[state.currentWeapon] >= weapon.magSize) return

    set({ isReloading: true })
    setTimeout(() => {
      set((state) => ({
        ammo: { ...state.ammo, [state.currentWeapon]: WEAPONS[state.currentWeapon].magSize },
        isReloading: false
      }))
    }, weapon.reloadTime)
  },

  setScoped: (scoped) => set({ isScoped: scoped }),

  resetGame: () => set({
    health: 100,
    isDead: false,
    money: 800,
    currentWeapon: 'deagle',
    ammo: { deagle: 7, smg: 30, rifle: 30, sniper: 10 },
    ownedWeapons: ['deagle'],
    isReloading: false,
    isScoped: false
  })
}))
