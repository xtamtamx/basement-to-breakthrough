import React, { useState, useEffect } from 'react';
import { ShowOutcome } from '@game/mechanics/ShowExecutor';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface ShowResultsModalProps {
  results: any[];
  onClose: () => void;
}

export const ShowResultsModal: React.FC<ShowResultsModalProps> = ({
  results,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingValues, setAnimatingValues] = useState(false);
  const currentResult = results[currentIndex];

  // No longer need to update resources here - handled in parent

  useEffect(() => {
    // Animate values on mount
    setAnimatingValues(true);
    haptics.impact();
    
    // Play sound based on result
    if (currentResult?.isSuccess) {
      audio.play('success');
    } else {
      audio.play('error');
    }
  }, [currentIndex, currentResult]);

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
      haptics.light();
      audio.tap();
    } else {
      audio.success();
      onClose();
    }
  };

  const getAttendanceColor = (attendance: number, capacity: number) => {
    const ratio = attendance / capacity;
    if (ratio >= 0.9) return 'text-green-400';
    if (ratio >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSuccessMessage = (result: ShowOutcome) => {
    if (result.result.success) {
      const ratio = result.result.attendance / result.show.ticketsSold;
      if (ratio >= 0.9) return "PACKED HOUSE!";
      if (ratio >= 0.7) return "Great Show!";
      return "Decent Turnout";
    } else {
      return result.result.attendance > 0 ? "Rough Night..." : "Total Disaster";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-metal-950 rounded-lg max-w-md w-full p-6 border-2 border-metal-700">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {getSuccessMessage(currentResult)}
          </h2>
          <p className="text-metal-400">
            Show {currentIndex + 1} of {results.length}
          </p>
        </div>

        {/* Attendance */}
        <div className="mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-metal-400">Attendance</span>
            <span className={`text-2xl font-bold ${getAttendanceColor(
              currentResult.result.attendance,
              100 // Using a fixed capacity for now
            )}`}>
              {animatingValues ? (
                <CountUp
                  end={currentResult.result.attendance}
                  duration={1000}
                />
              ) : (
                currentResult.result.attendance
              )}
              <span className="text-base text-metal-400">
                /{currentResult.show.ticketsSold || 100}
              </span>
            </span>
          </div>
          <div className="w-full bg-metal-800 rounded-full h-3">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                currentResult.result.success
                  ? 'bg-green-500'
                  : currentResult.result.attendance > 30
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: animatingValues
                  ? `${Math.min((currentResult.result.attendance / 100) * 100, 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Resources Gained */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-metal-400">Money Earned</span>
            <span className="text-green-400 font-bold text-lg">
              +${animatingValues ? (
                <CountUp end={currentResult.result.revenue} duration={1200} />
              ) : (
                currentResult.result.revenue
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-metal-400">Reputation</span>
            <span className={`font-bold text-lg ${
              currentResult.result.reputationChange >= 0 ? 'text-punk-400' : 'text-red-400'
            }`}>
              {currentResult.result.reputationChange >= 0 ? '+' : ''}
              {animatingValues ? (
                <CountUp end={currentResult.result.reputationChange} duration={1200} />
              ) : (
                currentResult.result.reputationChange
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-metal-400">New Fans</span>
            <span className="text-blue-400 font-bold text-lg">
              +{animatingValues ? (
                <CountUp end={currentResult.result.fansGained} duration={1200} />
              ) : (
                currentResult.result.fansGained
              )}
            </span>
          </div>
        </div>

        {/* Synergies */}
        {currentResult.synergies.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-2 text-punk-400">Active Synergies</h3>
            <div className="space-y-1">
              {currentResult.synergies.map((synergy) => (
                <div key={synergy.id} className="flex items-center gap-2 text-sm">
                  <span className="text-punk-500">🔥</span>
                  <span>{synergy.name}</span>
                  <span className="text-metal-500">({synergy.multiplier}x)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incidents */}
        {currentResult.incidents.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-2 text-red-400">Incidents!</h3>
            <div className="space-y-2">
              {currentResult.incidents.map((incident, i) => (
                <div key={i} className="bg-red-900/20 rounded p-2 text-sm">
                  <p className="text-red-300">{incident.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleNext}
          className="punk-button w-full text-lg"
        >
          {currentIndex < results.length - 1 ? 'Next Show' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

// Simple count up animation component
const CountUp: React.FC<{ end: number; duration: number }> = ({ end, duration }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return <>{count}</>;
};