import React, { useState } from 'react';
import { Venue, Equipment, EquipmentType } from '@game/types';
import { venueUpgradeSystem, EQUIPMENT_CATALOG } from '@game/mechanics/VenueUpgradeSystem';
import { useGameStore } from '@stores/gameStore';
import { formatMoney } from '@utils/formatters';
import { Tab } from '@headlessui/react';

interface VenueUpgradeModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
}

export const VenueUpgradeModal: React.FC<VenueUpgradeModalProps> = ({
  venue,
  isOpen,
  onClose
}) => {
  const store = useGameStore();
  const [selectedTab, setSelectedTab] = useState(0);
  
  if (!isOpen) return null;
  
  const availableUpgrades = venueUpgradeSystem.getAvailableUpgrades(venue);
  const availableEquipment = venueUpgradeSystem.getAvailableEquipment(venue);
  const upkeepCost = venueUpgradeSystem.calculateUpkeepCost(venue);
  
  const handleUpgrade = (upgradeId: string) => {
    const success = venueUpgradeSystem.applyUpgrade(venue.id, upgradeId);
    if (success) {
      // TODO: Show success feedback
    }
  };
  
  const handlePurchaseEquipment = (equipmentId: string) => {
    const success = venueUpgradeSystem.purchaseEquipment(venue.id, equipmentId);
    if (success) {
      // TODO: Show success feedback
    }
  };
  
  const handleRentEquipment = (equipmentId: string) => {
    const success = venueUpgradeSystem.rentEquipment(venue.id, equipmentId);
    if (success) {
      // TODO: Show success feedback
    }
  };
  
  const handleRepairEquipment = (equipmentId: string) => {
    const success = venueUpgradeSystem.repairEquipment(venue.id, equipmentId);
    if (success) {
      // TODO: Show success feedback
    }
  };
  
  const getEquipmentIcon = (type: EquipmentType) => {
    switch (type) {
      case EquipmentType.PA_SYSTEM: return '🔊';
      case EquipmentType.LIGHTING: return '💡';
      case EquipmentType.STAGE: return '🎪';
      case EquipmentType.BACKLINE: return '🎸';
      case EquipmentType.RECORDING: return '🎙️';
      default: return '📦';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{venue.name} - Upgrades</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Venue Stats */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div className="text-gray-300">
              <span className="text-gray-500">Capacity:</span> {venue.capacity}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Acoustics:</span> {venue.acoustics}%
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Atmosphere:</span> {venue.atmosphere}%
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Upkeep:</span> {formatMoney(upkeepCost)}/turn
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-6">
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                ${selected
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }>
                Upgrades ({availableUpgrades.length})
              </Tab>
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                ${selected
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }>
                Equipment ({availableEquipment.length})
              </Tab>
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                ${selected
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }>
                Owned Equipment ({venue.equipment.filter(e => e.owned).length})
              </Tab>
            </Tab.List>
            
            <Tab.Panels>
              {/* Upgrades Tab */}
              <Tab.Panel>
                {availableUpgrades.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No upgrades available. Check back when you have more money or reputation.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {availableUpgrades.map(upgrade => (
                      <div
                        key={upgrade.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-pink-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{upgrade.name}</h3>
                            <p className="text-gray-400 text-sm">{upgrade.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">
                              {formatMoney(upgrade.cost)}
                            </div>
                            {upgrade.upkeepCost && (
                              <div className="text-xs text-gray-500">
                                +{formatMoney(upgrade.upkeepCost)}/turn
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Effects */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {upgrade.effects.capacity && (
                            <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                              +{upgrade.effects.capacity} capacity
                            </span>
                          )}
                          {upgrade.effects.acoustics && (
                            <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                              +{upgrade.effects.acoustics}% acoustics
                            </span>
                          )}
                          {upgrade.effects.atmosphere && (
                            <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">
                              +{upgrade.effects.atmosphere}% atmosphere
                            </span>
                          )}
                          {upgrade.effects.authenticity && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              upgrade.effects.authenticity > 0
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-red-900 text-red-200'
                            }`}>
                              {upgrade.effects.authenticity > 0 ? '+' : ''}{upgrade.effects.authenticity}% authenticity
                            </span>
                          )}
                          {upgrade.effects.revenue && (
                            <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">
                              +{upgrade.effects.revenue}% revenue
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleUpgrade(upgrade.id)}
                          disabled={store.money < upgrade.cost}
                          className={`w-full py-2 rounded-lg font-medium transition-all ${
                            store.money >= upgrade.cost
                              ? 'bg-pink-600 hover:bg-pink-700 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {store.money >= upgrade.cost ? 'Purchase Upgrade' : 'Insufficient Funds'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
              
              {/* Equipment Tab */}
              <Tab.Panel>
                {availableEquipment.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No equipment available for this venue type.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {availableEquipment.map(equipment => (
                      <div
                        key={equipment.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-pink-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getEquipmentIcon(equipment.type)}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{equipment.name}</h3>
                              <p className="text-gray-400 text-sm">{equipment.description}</p>
                              <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs ${
                                      i < equipment.quality ? 'text-yellow-400' : 'text-gray-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">
                              {formatMoney(equipment.purchasePrice)}
                            </div>
                            <div className="text-xs text-gray-500">
                              or rent: {formatMoney(equipment.rentalPrice)}
                            </div>
                            <div className="text-xs text-gray-500">
                              upkeep: {formatMoney(equipment.maintenanceCost)}/turn
                            </div>
                          </div>
                        </div>
                        
                        {/* Effects */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {equipment.effects.acousticsBonus && (
                            <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                              +{equipment.effects.acousticsBonus}% acoustics
                            </span>
                          )}
                          {equipment.effects.atmosphereBonus && (
                            <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">
                              +{equipment.effects.atmosphereBonus}% atmosphere
                            </span>
                          )}
                          {equipment.effects.capacityBonus && (
                            <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                              +{equipment.effects.capacityBonus}% capacity
                            </span>
                          )}
                          {equipment.effects.reputationMultiplier && (
                            <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded">
                              x{equipment.effects.reputationMultiplier} reputation
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePurchaseEquipment(equipment.id)}
                            disabled={store.money < equipment.purchasePrice}
                            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                              store.money >= equipment.purchasePrice
                                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Purchase
                          </button>
                          <button
                            onClick={() => handleRentEquipment(equipment.id)}
                            disabled={store.money < equipment.rentalPrice}
                            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                              store.money >= equipment.rentalPrice
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Rent for Show
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
              
              {/* Owned Equipment Tab */}
              <Tab.Panel>
                {venue.equipment.filter(e => e.owned).length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No equipment owned yet. Purchase equipment from the Equipment tab.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {venue.equipment.filter(e => e.owned).map(equipment => (
                      <div
                        key={equipment.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getEquipmentIcon(equipment.type)}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{equipment.name}</h3>
                              <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs ${
                                      i < equipment.quality ? 'text-yellow-400' : 'text-gray-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">
                              Condition: {Math.round(equipment.condition)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              upkeep: {formatMoney(equipment.maintenanceCost)}/turn
                            </div>
                          </div>
                        </div>
                        
                        {/* Condition Bar */}
                        <div className="mt-3 mb-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                equipment.condition > 70 ? 'bg-green-500' :
                                equipment.condition > 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${equipment.condition}%` }}
                            />
                          </div>
                        </div>
                        
                        {equipment.condition < 100 && (
                          <button
                            onClick={() => handleRepairEquipment(equipment.id)}
                            className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                          >
                            Repair Equipment
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};