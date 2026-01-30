import { useStore, WEAPONS } from '../store'
import type { WeaponType } from '../store'


export const BuyMenu = ({ onClose }: { onClose: () => void }) => {
  const money = useStore(state => state.money)
  const buyWeapon = useStore(state => state.buyWeapon)
  const ownedWeapons = useStore(state => state.ownedWeapons)

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 w-[600px]">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-3xl font-bold text-white">Buy Menu</h2>
           <div className="text-2xl text-green-500 font-bold">${money}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(WEAPONS) as WeaponType[]).map((key) => {
            const weapon = WEAPONS[key]
            const isOwned = ownedWeapons.includes(key)
            const canAfford = money >= weapon.price

            return (
              <div key={key} className={`p-4 rounded border ${isOwned ? 'bg-green-900/20 border-green-500' : 'bg-gray-800 border-gray-600'} flex justify-between items-center`}>
                <div>
                  <h3 className="text-xl font-bold text-white">{weapon.name}</h3>
                  <p className="text-gray-400 text-sm">Damage: {weapon.damage} | Fire Rate: {weapon.fireRate}ms</p>
                </div>
                <button 
                  onClick={() => {
                    if (!isOwned && canAfford) buyWeapon(key)
                  }}
                  disabled={isOwned || !canAfford}
                  className={`px-4 py-2 rounded font-bold ${
                    isOwned 
                      ? 'text-green-500 cursor-default' 
                      : canAfford 
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isOwned ? 'OWNED' : `$${weapon.price}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded font-bold"
          >
            CLOSE MENU (B)
          </button>
        </div>
      </div>
    </div>
  )
}
