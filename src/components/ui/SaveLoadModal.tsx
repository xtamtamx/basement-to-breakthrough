import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { saveGameManager, SaveMetadata } from '@game/persistence/SaveGameManager';
import { formatMoney } from '@utils/formatters';
import { haptics } from '@utils/mobile';
import { Save, Upload, Trash2, X, Calendar, DollarSign, Star, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ isOpen, onClose }) => {
  const gameStore = useGameStore();
  const [saves, setSaves] = useState<SaveMetadata[]>([]);
  const [saveName, setSaveName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  
  useEffect(() => {
    if (isOpen) {
      loadSaves();
    }
  }, [isOpen]);
  
  const loadSaves = async () => {
    setLoading(true);
    try {
      const saveList = await saveGameManager.getSaveList();
      setSaves(saveList);
    } catch {
      setError('Failed to load saves');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await gameStore.saveGame(saveName || undefined);
      setSuccess('Game saved successfully!');
      setSaveName('');
      await loadSaves();
      haptics.success();
      
      // Switch to load tab to show the new save
      setTimeout(() => {
        setActiveTab('load');
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoad = async (saveId: string) => {
    if (!confirm('Loading will overwrite your current game. Continue?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await gameStore.loadGame(saveId);
      haptics.success();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (saveId: string) => {
    if (!confirm('Are you sure you want to delete this save?')) {
      return;
    }
    
    try {
      await saveGameManager.deleteSave(saveId);
      await loadSaves();
      haptics.light();
    } catch {
      setError('Failed to delete save');
      haptics.error();
    }
  };
  
  const formatDate = (timestamp: number | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const mins = Math.floor(diffInHours * 60);
      return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(8, 6, 18, 0.86)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#171327',
        borderRadius: 0,
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #0a0814',
        borderTop: '3px solid #f72585',
        boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #2a2350',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 className="snes-pixel" style={{
            fontSize: '14px',
            color: '#f72585',
            textShadow: '3px 3px 0 #0a0814',
            margin: 0,
            textTransform: 'uppercase'
          }}>Save & Load</h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1f1a3a',
              border: '2px solid #0a0814',
              borderRadius: 0,
              color: '#b9b3d6',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #2a2350'
        }}>
          <button
            className="snes-pixel"
            onClick={() => setActiveTab('save')}
            style={{
              flex: 1,
              padding: '16px',
              minHeight: '44px',
              backgroundColor: activeTab === 'save' ? '#0f0b1e' : 'transparent',
              color: activeTab === 'save' ? '#f72585' : '#6f6796',
              border: 'none',
              borderBottom: activeTab === 'save' ? '2px solid #f72585' : '2px solid transparent',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: 0,
              cursor: 'pointer',
              transition: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} />
            Save Game
          </button>
          <button
            className="snes-pixel"
            onClick={() => setActiveTab('load')}
            style={{
              flex: 1,
              padding: '16px',
              minHeight: '44px',
              backgroundColor: activeTab === 'load' ? '#0f0b1e' : 'transparent',
              color: activeTab === 'load' ? '#f72585' : '#6f6796',
              border: 'none',
              borderBottom: activeTab === 'load' ? '2px solid #f72585' : '2px solid transparent',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: 0,
              cursor: 'pointer',
              transition: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Upload size={18} />
            Load Game
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Messages */}
          {error && (
            <div style={{
              backgroundColor: '#0f0b1e',
              border: '2px solid #ff5c57',
              color: '#ff5c57',
              padding: '12px 16px',
              borderRadius: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              boxShadow: 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #2a2350'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#0f0b1e',
              border: '2px solid #3ad17e',
              color: '#3ad17e',
              padding: '12px 16px',
              borderRadius: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              boxShadow: 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #2a2350'
            }}>
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {activeTab === 'save' ? (
            // Save Tab
            <div>
              {/* Current Game Info */}
              <div className="snes-panel-inset" style={{
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px',
                  color: '#ffffff',
                  marginBottom: '14px',
                  textTransform: 'uppercase'
                }}>Current Game</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="#b9b3d6" />
                    <span className="snes-pixel" style={{ color: '#b9b3d6', fontSize: '8px' }}>
                      Round {gameStore.currentRound}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="#3ad17e" />
                    <span className="snes-pixel" style={{ color: '#3ad17e', fontSize: '8px' }}>
                      {formatMoney(gameStore.money)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={16} color="#ffd23f" />
                    <span className="snes-pixel" style={{ color: '#ffd23f', fontSize: '8px' }}>
                      {gameStore.reputation} Rep
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#c77dff" />
                    <span className="snes-pixel" style={{ color: '#c77dff', fontSize: '8px' }}>
                      {gameStore.fans} Fans
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Name Input */}
              <div style={{ marginBottom: '20px' }}>
                <label className="snes-pixel" style={{
                  display: 'block',
                  color: '#b9b3d6',
                  fontSize: '8px',
                  marginBottom: '10px',
                  textTransform: 'uppercase'
                }}>Save Name (optional)</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a name for this save..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    minHeight: '44px',
                    backgroundColor: '#0f0b1e',
                    border: '2px solid #0a0814',
                    borderRadius: 0,
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #2a2350'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#f72585'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#0a0814'}
                />
              </div>

              {/* Save Button */}
              <button
                className="snes-btn"
                onClick={handleSave}
                disabled={loading}
                style={{
                  width: '100%'
                }}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Game'}
              </button>
            </div>
          ) : (
            // Load Tab
            <div>
              {loading ? (
                <div className="snes-pixel" style={{
                  textAlign: 'center',
                  color: '#b9b3d6',
                  fontSize: '9px',
                  padding: '40px'
                }}>Loading saves...</div>
              ) : saves.length === 0 ? (
                <div className="snes-panel-inset" style={{
                  textAlign: 'center',
                  color: '#b9b3d6',
                  padding: '40px'
                }}>
                  <p className="snes-pixel" style={{ marginBottom: '12px', fontSize: '9px', color: '#ffffff' }}>No saved games found</p>
                  <p style={{ fontSize: '13px', color: '#6f6796' }}>Save your game in the Save tab</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {saves.map((save) => (
                    <div
                      key={save.id}
                      className="snes-panel-inset"
                      style={{
                        padding: '16px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <h4 className="snes-pixel" style={{
                            fontSize: '10px',
                            color: '#ffffff',
                            marginBottom: '8px'
                          }}>{save.name}</h4>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#6f6796',
                            fontSize: '12px'
                          }}>
                            <Clock size={12} />
                            {formatDate(save.timestamp)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="snes-btn snes-btn--cyan snes-btn--sm"
                            onClick={() => handleLoad(save.id)}
                            style={{
                              minHeight: '44px'
                            }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDelete(save.id)}
                            style={{
                              width: '44px',
                              height: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              backgroundColor: '#0f0b1e',
                              color: '#ff5c57',
                              border: '2px solid #ff5c57',
                              borderRadius: 0,
                              cursor: 'pointer',
                              transition: 'none',
                              boxShadow: 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #2a2350'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        fontSize: '12px'
                      }}>
                        <div>
                          <span className="snes-pixel" style={{ color: '#6f6796', fontSize: '7px' }}>Round</span>
                          <div className="snes-pixel" style={{ color: '#ffffff', fontSize: '8px', marginTop: '4px' }}>{save.turnNumber}</div>
                        </div>
                        <div>
                          <span className="snes-pixel" style={{ color: '#6f6796', fontSize: '7px' }}>Money</span>
                          <div className="snes-pixel" style={{ color: '#3ad17e', fontSize: '8px', marginTop: '4px' }}>{formatMoney(save.money)}</div>
                        </div>
                        <div>
                          <span className="snes-pixel" style={{ color: '#6f6796', fontSize: '7px' }}>Rep</span>
                          <div className="snes-pixel" style={{ color: '#ffd23f', fontSize: '8px', marginTop: '4px' }}>{save.reputation}</div>
                        </div>
                        <div>
                          <span className="snes-pixel" style={{ color: '#6f6796', fontSize: '7px' }}>Fans</span>
                          <div className="snes-pixel" style={{ color: '#c77dff', fontSize: '8px', marginTop: '4px' }}>{save.fans}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};