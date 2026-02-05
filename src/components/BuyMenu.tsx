import { useStore, WEAPONS, EQUIPMENT, GRENADES, type GrenadeType } from '../store'
import type { WeaponType } from '../store'


export const BuyMenu = ({ onClose }: { onClose: () => void }) => {
  const money = useStore(state => state.money)
  const buyWeapon = useStore(state => state.buyWeapon)
  const buyEquipment = useStore(state => state.buyEquipment)
  const buyGrenade = useStore(state => state.buyGrenade)
  const slots = useStore(state => state.slots)
  const grenades = useStore(state => state.grenades)
  const hasHelmet = useStore(state => state.hasHelmet)
  const hasArmor = useStore(state => state.hasArmor)
  const gameMode = useStore(state => state.gameMode)
  const buyPhaseActive = useStore(state => state.buyPhaseActive)
  const buyPhaseTimeLeft = useStore(state => state.buyPhaseTimeLeft)

  const weaponSlotsPreview = slots.slice(0, 4) as (WeaponType | null)[]
  const isWeaponOwned = (weapon: WeaponType) => weaponSlotsPreview.includes(weapon)
  const emptySlotsCount = weaponSlotsPreview.filter(slot => slot === null).length
  const canBuyInDeathmatch = gameMode !== 'deathmatch' || buyPhaseActive

  const grenadeIcons: Record<GrenadeType, string> = {
    flash: '💥',
    smoke: '💨',
    molotov: '🔥',
    heGrenade: '💣'
  }

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 w-[850px] max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Silah Menyusu</h2>
          <div className="flex gap-4 items-center">
            {gameMode === 'deathmatch' && (
              <div className={`text-lg font-bold px-3 py-1 rounded ${buyPhaseActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {buyPhaseActive ? `⏱️ ${buyPhaseTimeLeft}s` : '🚫 Alma bitdi'}
              </div>
            )}
            <div className="text-sm text-gray-400">Silahlar: {4 - emptySlotsCount}/4</div>
            <div className="text-2xl text-green-500 font-bold">${money}</div>
          </div>
        </div>

        {gameMode === 'deathmatch' && !buyPhaseActive && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4 text-center">
            <p className="text-red-400 font-bold">⚠️ Silah alma müddəti bitdi!</p>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-700 pb-1">🛡️ Avadanlıq</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['helmet', 'armor', 'fullArmor'] as const).map(type => {
              const eq = EQUIPMENT[type]
              const owned = type === 'helmet' ? hasHelmet : type === 'armor' ? hasArmor : (hasHelmet && hasArmor)
              return (
                <div key={type} className={`p-3 rounded border ${owned ? 'bg-green-900/20 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-bold text-white">{eq.name}</h4>
                    <span className="text-xs text-green-400">+{eq.healthBonus} HP</span>
                  </div>
                  <button
                    onClick={() => buyEquipment(type)}
                    disabled={owned || money < eq.price || !canBuyInDeathmatch}
                    className={`w-full px-3 py-1.5 rounded font-bold text-sm transition-colors ${owned ? 'bg-green-800/30 text-green-500 border border-green-700' : money >= eq.price && canBuyInDeathmatch ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {owned ? '✓ VAR' : `$${eq.price}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-700 pb-1">💣 Qumbaralar</h3>
          <div className="grid grid-cols-4 gap-3">
            {(Object.keys(GRENADES) as GrenadeType[]).map((type) => {
              const grenade = GRENADES[type]
              const owned = grenades[type] > 0
              return (
                <div key={type} className={`p-3 rounded border ${owned ? 'bg-green-900/20 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
                  <div className="text-center mb-2">
                    <span className="text-2xl">{grenadeIcons[type]}</span>
                    <h4 className="text-sm font-bold text-white mt-1">{grenade.name}</h4>
                  </div>
                  <button
                    onClick={() => buyGrenade(type)}
                    disabled={owned || money < grenade.price || !canBuyInDeathmatch}
                    className={`w-full px-2 py-1.5 rounded font-bold text-sm transition-colors ${owned ? 'bg-green-800/30 text-green-500 border border-green-700' : money >= grenade.price && canBuyInDeathmatch ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {owned ? `✓ ${grenades[type]}` : `$${grenade.price}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(WEAPONS) as WeaponType[]).map((key) => {
            const weapon = WEAPONS[key]
            const isOwned = isWeaponOwned(key)
            const canAfford = money >= weapon.price
            const slotsAvailable = emptySlotsCount > 0 || isOwned
            return (
              <div key={key} className={`p-3 rounded border ${isOwned ? 'bg-green-900/20 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{weapon.name}</h3>
                  <div className="w-8 h-3 rounded" style={{ backgroundColor: weapon.color }} />
                </div>
                <div className="flex gap-2 mb-2 text-[10px] text-gray-400">
                  <span>DMG: {weapon.damage}</span> | <span>MAG: {weapon.magSize}</span>
                </div>
                <button
                  onClick={() => buyWeapon(key)}
                  disabled={isOwned || !canAfford || (!slotsAvailable && !isOwned) || !canBuyInDeathmatch}
                  className={`w-full px-3 py-1.5 rounded font-bold text-sm transition-colors ${isOwned ? 'bg-green-800/30 text-green-500 border border-green-700' : canAfford && slotsAvailable && canBuyInDeathmatch ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  {isOwned ? '✓ VAR' : !slotsAvailable ? 'SLOT YOX' : `$${weapon.price}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex justify-between items-center text-gray-500 text-xs font-mono">
          <div>
            <p>[1-4] SİLAH | [5-8] QUMBARA | [SCROLL] SEÇİM</p>
            <p>[B] BAĞLA | [TAB] REYTİNQ</p>
          </div>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-500 text-white px-8 py-2 rounded font-bold">BAĞLA</button>
        </div>
      </div>
    </div>
  )
}
