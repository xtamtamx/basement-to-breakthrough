import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { Band } from '@/game/types/core';
import { haptics } from '@/utils/mobile';
import { 
  Festival, 
  FestivalLineup, 
  checkFestivalRequirements,
  calculateFestivalCosts,
  calculateFestivalResults,
  FESTIVALS
} from '@/game/mechanics/FestivalSystem';
import { getFinalFestival, PathAlignment } from '@/game/mechanics/PathSystem';

interface FestivalPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FestivalPlanningModal: React.FC<FestivalPlanningModalProps> = ({
  isOpen,
  onClose
}) => {
  const gameState = useGameStore();
  const { money, reputation, allBands, rosterBandIds, pathAlignment, completedFestivals } = gameState;
  
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [lineup, setLineup] = useState<FestivalLineup | null>(null);
  
  // Get available festivals
  const availableFestivals = useMemo(() => {
    return FESTIVALS.filter(festival => checkFestivalRequirements(festival, gameState));
  }, [gameState]);
  
  // Check if it's time for the final festival
  const isFinalFestival = completedFestivals.length >= 3 || reputation > 800;
  const finalFestival = isFinalFestival ? getFinalFestival(pathAlignment as PathAlignment) : null;
  
  // Get roster bands
  const rosterBands = useMemo(() => {
    return allBands.filter(band => rosterBandIds.includes(band.id));
  }, [allBands, rosterBandIds]);
  
  const handleFestivalSelect = (festival: Festival) => {
    setSelectedFestival(festival);
    
    // Initialize empty lineup
    const newLineup: FestivalLineup = {
      festivalId: festival.id,
      headliners: [],
      stages: festival.stages.map(stage => ({
        stageId: stage.id,
        bands: []
      })),
      totalBands: 0,
      genreDiversity: []
    };
    
    setLineup(newLineup);
    haptics.light();
  };
  
  const addBandToStage = (band: Band, stageId: string, isHeadliner: boolean = false) => {
    if (!lineup || !selectedFestival) return;
    
    const newLineup = { ...lineup };
    
    if (isHeadliner) {
      if (!newLineup.headliners.find(b => b.id === band.id)) {
        newLineup.headliners = [...newLineup.headliners, band];
      }
    } else {
      const stage = newLineup.stages.find(s => s.stageId === stageId);
      if (stage && !stage.bands.find(b => b.id === band.id)) {
        stage.bands = [...stage.bands, band];
      }
    }
    
    // Update totals
    newLineup.totalBands = newLineup.headliners.length + 
                          newLineup.stages.reduce((sum, s) => sum + s.bands.length, 0);
    
    // Update genre diversity
    const allGenres = new Set([
      ...newLineup.headliners.map(b => b.genre),
      ...newLineup.stages.flatMap(s => s.bands.map(b => b.genre))
    ]);
    newLineup.genreDiversity = Array.from(allGenres);
    
    setLineup(newLineup);
    haptics.light();
  };
  
  const removeBandFromLineup = (bandId: string) => {
    if (!lineup) return;
    
    const newLineup = { ...lineup };
    
    // Remove from headliners
    newLineup.headliners = newLineup.headliners.filter(b => b.id !== bandId);
    
    // Remove from stages
    newLineup.stages.forEach(stage => {
      stage.bands = stage.bands.filter(b => b.id !== bandId);
    });
    
    // Update totals
    newLineup.totalBands = newLineup.headliners.length + 
                          newLineup.stages.reduce((sum, s) => sum + s.bands.length, 0);
    
    // Update genre diversity
    const allGenres = new Set([
      ...newLineup.headliners.map(b => b.genre),
      ...newLineup.stages.flatMap(s => s.bands.map(b => b.genre))
    ]);
    newLineup.genreDiversity = Array.from(allGenres);
    
    setLineup(newLineup);
    haptics.light();
  };
  
  const canHostFestival = selectedFestival && lineup && 
                         lineup.totalBands >= selectedFestival.stages.reduce((sum, s) => sum + s.slots, 0) * 0.7 &&
                         money >= calculateFestivalCosts(selectedFestival, lineup);
  
  const handleHostFestival = () => {
    if (!canHostFestival || !selectedFestival || !lineup) return;
    
    const result = calculateFestivalResults(selectedFestival, lineup, gameState);
    
    // Apply results to game state
    // This would need to be implemented in the game store
    devLog.log('Festival results:', result);
    
    haptics.success();
    onClose();
  };
  
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
    maxWidth: '800px',
    maxHeight: 'calc(100vh - 20px)',
    margin: '0 auto',
    backgroundColor: '#000',
    border: '2px solid #fff',
    boxShadow: '0 0 0 2px #000, 0 0 0 4px #fff',
    fontFamily: 'monospace',
    imageRendering: 'pixelated',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    overflow: 'hidden'
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 9998
            }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '12px',
              borderBottom: '2px solid #fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#fff',
                textTransform: 'uppercase'
              }}>
                FESTIVAL PLANNING
              </h2>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                X
              </button>
            </div>
            
            {/* Content */}
            <div style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden'
            }}>
              {/* Festival Selection */}
              <div style={{
                width: '300px',
                borderRight: '2px solid #333',
                padding: '12px',
                overflowY: 'auto',
                backgroundColor: '#0a0a0a'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  color: '#fff',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  {isFinalFestival ? 'FINAL FESTIVAL' : 'Available Festivals'}
                </h3>
                
                {isFinalFestival && finalFestival ? (
                  <div style={{
                    padding: '12px',
                    marginBottom: '16px',
                    backgroundColor: '#1a0a0a',
                    border: `3px solid ${
                      pathAlignment === 'PURE_DIY' ? '#10b981' :
                      pathAlignment === 'FULL_SELLOUT' ? '#ef4444' : '#fbbf24'
                    }`,
                    position: 'relative'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      color: '#fff', 
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}>
                      {finalFestival.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
                      {finalFestival.description}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                      Capacity: {finalFestival.capacity.toLocaleString()} • 
                      Tickets: ${finalFestival.ticketPriceRange.min}-${finalFestival.ticketPriceRange.max}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {finalFestival.characteristics.map(char => (
                        <span key={char} style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: '#333',
                          color: '#fff',
                          border: '1px solid #555'
                        }}>
                          {char}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: pathAlignment === 'PURE_DIY' ? '#10b981' :
                             pathAlignment === 'FULL_SELLOUT' ? '#ef4444' : '#fbbf24',
                      fontWeight: 'bold'
                    }}>
                      {pathAlignment === 'PURE_DIY' ? 'MAXIMUM AUTHENTICITY' :
                       pathAlignment === 'FULL_SELLOUT' ? 'MAXIMUM PROFIT' :
                       'BALANCED APPROACH'}
                    </div>
                  </div>
                ) : availableFestivals.length === 0 ? (
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    No festivals available yet. Build your reputation!
                  </div>
                ) : (
                  availableFestivals.map(festival => (
                    <div
                      key={festival.id}
                      onClick={() => handleFestivalSelect(festival)}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: selectedFestival?.id === festival.id ? '#222' : '#111',
                        border: selectedFestival?.id === festival.id ? '2px solid #fff' : '2px solid #333',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                        {festival.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {festival.tier} • {festival.capacity} capacity • ${festival.baseCost}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                        {festival.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Lineup Builder */}
              {selectedFestival && lineup && (
                <div style={{
                  flex: 1,
                  padding: '12px',
                  overflowY: 'auto',
                  backgroundColor: '#111'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    color: '#fff',
                    marginBottom: '12px',
                    textTransform: 'uppercase'
                  }}>
                    Build Your Lineup
                  </h3>
                  
                  {/* Headliners */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                      HEADLINERS ({lineup.headliners.length}/3)
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {lineup.headliners.map(band => (
                        <div
                          key={band.id}
                          onClick={() => removeBandFromLineup(band.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {band.name} ✕
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stages */}
                  {selectedFestival.stages.map(stage => {
                    const stageLineup = lineup.stages.find(s => s.stageId === stage.id);
                    return (
                      <div key={stage.id} style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                          {stage.name.toUpperCase()} ({stageLineup?.bands.length || 0}/{stage.slots})
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {stageLineup?.bands.map(band => (
                            <div
                              key={band.id}
                              onClick={() => removeBandFromLineup(band.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#666',
                                color: '#fff',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              {band.name} ✕
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Available Bands */}
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                      AVAILABLE BANDS
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {rosterBands
                        .filter(band => !lineup.headliners.find(b => b.id === band.id) &&
                                       !lineup.stages.some(s => s.bands.find(b => b.id === band.id)))
                        .map(band => (
                          <div
                            key={band.id}
                            onClick={() => {
                              if (band.popularity > 70 && lineup.headliners.length < 3) {
                                addBandToStage(band, '', true);
                              } else {
                                // Add to first available stage
                                const availableStage = selectedFestival.stages.find(stage => {
                                  const stageLineup = lineup.stages.find(s => s.stageId === stage.id);
                                  return !stageLineup || stageLineup.bands.length < stage.slots;
                                });
                                if (availableStage) {
                                  addBandToStage(band, availableStage.id);
                                }
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '11px',
                              cursor: 'pointer',
                              border: band.popularity > 70 ? '1px solid #fbbf24' : 'none'
                            }}
                          >
                            {band.name} ({band.genre})
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Cost Summary */}
                  <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #333'
                  }}>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      Festival Cost: ${lineup ? calculateFestivalCosts(selectedFestival, lineup) : 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      Available Money: ${money}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      Genre Diversity: {lineup.genreDiversity.length} genres
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div style={{
              borderTop: '2px solid #fff',
              padding: '12px',
              backgroundColor: '#222',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleHostFestival}
                disabled={!canHostFestival}
                style={{
                  backgroundColor: canHostFestival ? '#10b981' : '#444',
                  color: canHostFestival ? '#fff' : '#666',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  cursor: canHostFestival ? 'pointer' : 'not-allowed',
                  opacity: canHostFestival ? 1 : 0.5
                }}
              >
                HOST FESTIVAL
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};