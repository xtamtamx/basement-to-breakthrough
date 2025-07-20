import React, { useState } from 'react';
import { Band, Venue } from '@game/types';
import { bookingSystem } from '@game/mechanics/BookingSystem';
import { synergyEngine } from '@game/mechanics/SynergyEngine';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';

interface BookingInterfaceProps {
  selectedBand: Band | null;
  selectedVenue: Venue | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BookingInterface: React.FC<BookingInterfaceProps> = ({
  selectedBand,
  selectedVenue,
  onConfirm,
  onCancel,
}) => {
  const [ticketPrice, setTicketPrice] = useState(10);
  const gameStore = useGameStore();
  
  if (!selectedBand || !selectedVenue) {
    return (
      <div className="card p-6 text-center">
        <p className="text-metal-300 mb-4">
          Select a band and venue to create a booking
        </p>
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-metal-800 rounded-lg mb-2 flex items-center justify-center">
              {selectedBand ? '🎸' : '?'}
            </div>
            <p className="text-xs text-metal-400">
              {selectedBand ? selectedBand.name : 'No Band'}
            </p>
          </div>
          <div className="text-2xl self-center">+</div>
          <div className="text-center">
            <div className="w-16 h-16 bg-metal-800 rounded-lg mb-2 flex items-center justify-center">
              {selectedVenue ? '🏠' : '?'}
            </div>
            <p className="text-xs text-metal-400">
              {selectedVenue ? selectedVenue.name : 'No Venue'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if booking is valid
  const canBookResult = bookingSystem.canBook(selectedBand, selectedVenue, {
    id: 'current',
    turn: 1,
    phase: 'BOOKING' as any,
    resources: {
      money: gameStore.money,
      reputation: gameStore.reputation,
      connections: 0,
      stress: 0,
    },
    bookedShows: [],
    availableBands: [],
    sceneReputation: { overall: gameStore.reputation, factions: [], relationships: [] },
    unlockedContent: [],
    achievements: [],
    settings: {} as any,
  });

  // Preview synergies
  const synergies = synergyEngine.calculateSynergies([selectedBand], selectedVenue);
  const totalMultiplier = synergyEngine.getTotalMultiplier([selectedBand], selectedVenue);

  // Calculate expected metrics
  const baseAttendance = Math.floor(selectedVenue.capacity * 0.6 * (selectedBand.popularity / 100));
  const expectedAttendance = Math.floor(baseAttendance * totalMultiplier);
  const finalAttendance = Math.min(expectedAttendance, selectedVenue.capacity);
  const expectedRevenue = finalAttendance * ticketPrice;

  const handleConfirm = () => {
    haptics.success();
    onConfirm();
  };

  const handleCancel = () => {
    haptics.light();
    onCancel();
  };

  return (
    <div className="space-y-4">
      {/* Booking Header */}
      <div className="card p-4">
        <h3 className="font-bold text-lg mb-2">Booking Preview</h3>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-bold">{selectedBand.name}</p>
            <p className="text-metal-400">at {selectedVenue.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-metal-400">Venue Cost</p>
            <p className="font-bold">-${selectedVenue.rent}</p>
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {!canBookResult.valid && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{canBookResult.reason}</p>
        </div>
      )}

      {/* Synergies */}
      {synergies.length > 0 && (
        <div className="card p-4">
          <h4 className="font-bold mb-2">Active Synergies 🔥</h4>
          <div className="space-y-2">
            {synergies.map((synergy) => (
              <div key={synergy.id} className="text-sm">
                <p className="text-punk-400 font-bold">{synergy.name}</p>
                <p className="text-metal-300 text-xs">{synergy.description}</p>
                <p className="text-xs text-metal-500">
                  {synergy.multiplier}x attendance • +{synergy.reputationBonus} rep
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Price Slider */}
      <div className="card p-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-bold">Ticket Price</label>
          <span className="text-lg font-bold">${ticketPrice}</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={ticketPrice}
          onChange={(e) => setTicketPrice(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-metal-500 mt-1">
          <span>Free</span>
          <span>$25</span>
          <span>$50</span>
        </div>
      </div>

      {/* Expected Outcomes */}
      <div className="card p-4">
        <h4 className="font-bold mb-2">Expected Outcomes</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-metal-400">Attendance</p>
            <p className="font-bold">{finalAttendance}/{selectedVenue.capacity}</p>
          </div>
          <div>
            <p className="text-metal-400">Revenue</p>
            <p className="font-bold">${expectedRevenue}</p>
          </div>
          <div>
            <p className="text-metal-400">Total Multi</p>
            <p className="font-bold text-punk-400">{totalMultiplier.toFixed(1)}x</p>
          </div>
          <div>
            <p className="text-metal-400">Profit</p>
            <p className={`font-bold ${expectedRevenue - selectedVenue.rent > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${expectedRevenue - selectedVenue.rent}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          className="metal-button flex-1"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className={`flex-1 ${canBookResult.valid ? 'punk-button' : 'metal-button opacity-50'}`}
          onClick={handleConfirm}
          disabled={!canBookResult.valid}
        >
          Book Show
        </button>
      </div>
    </div>
  );
};