import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { saveGameManager, SaveMetadata } from '@game/persistence/SaveGameManager';
import { formatMoney } from '@utils/formatters';
import { haptics } from '@utils/mobile';
import { Save, Upload, Trash2, Calendar, DollarSign, Star, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { SnesModal } from './SnesModal';
import { useConfirm } from './ConfirmDialog';

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
  const confirm = useConfirm();

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
    if (!(await confirm({
      title: 'Load Game',
      message: 'Loading will overwrite your current game. Continue?',
      confirmLabel: 'Load',
    }))) {
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
    if (!(await confirm({
      title: 'Delete Save',
      message: 'Are you sure you want to delete this save?',
      confirmLabel: 'Delete',
      danger: true,
    }))) {
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
    <SnesModal
      onClose={onClose}
      title="Save & Load"
      ariaLabel="Save and load"
      maxWidth={600}
      accent="var(--snes-magenta)"
    >
      <div>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--snes-line)'
        }}>
          <button
            className="snes-pixel"
            onClick={() => setActiveTab('save')}
            style={{
              flex: 1,
              padding: '16px',
              minHeight: '44px',
              backgroundColor: activeTab === 'save' ? 'var(--snes-bg-2)' : 'transparent',
              color: activeTab === 'save' ? 'var(--snes-magenta)' : 'var(--snes-ink-mute)',
              border: 'none',
              borderBottom: activeTab === 'save' ? '2px solid var(--snes-magenta)' : '2px solid transparent',
              fontSize: 'var(--t-sm)',
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
              backgroundColor: activeTab === 'load' ? 'var(--snes-bg-2)' : 'transparent',
              color: activeTab === 'load' ? 'var(--snes-magenta)' : 'var(--snes-ink-mute)',
              border: 'none',
              borderBottom: activeTab === 'load' ? '2px solid var(--snes-magenta)' : '2px solid transparent',
              fontSize: 'var(--t-sm)',
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
            <div className="snes-panel-inset" style={{
              backgroundColor: 'var(--snes-bg-2)',
              border: '2px solid var(--snes-red)',
              color: 'var(--snes-red)',
              padding: '12px 16px',
              borderRadius: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="snes-panel-inset" style={{
              backgroundColor: 'var(--snes-bg-2)',
              border: '2px solid var(--snes-green)',
              color: 'var(--snes-green)',
              padding: '12px 16px',
              borderRadius: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
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
                  fontSize: 'var(--t-sm)',
                  color: 'var(--snes-ink)',
                  marginBottom: '14px',
                  textTransform: 'uppercase'
                }}>Current Game</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="var(--snes-ink-dim)" />
                    <span className="snes-pixel" style={{ color: 'var(--snes-ink-dim)', fontSize: 'var(--t-sm)' }}>
                      Round {gameStore.currentRound}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="var(--snes-green)" />
                    <span className="snes-pixel" style={{ color: 'var(--snes-green)', fontSize: 'var(--t-sm)' }}>
                      {formatMoney(gameStore.money)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={16} color="var(--snes-gold)" />
                    <span className="snes-pixel" style={{ color: 'var(--snes-gold)', fontSize: 'var(--t-sm)' }}>
                      {gameStore.reputation} Rep
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="var(--snes-purple)" />
                    <span className="snes-pixel" style={{ color: 'var(--snes-purple)', fontSize: 'var(--t-sm)' }}>
                      {gameStore.fans} Fans
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Name Input */}
              <div style={{ marginBottom: '20px' }}>
                <label className="snes-pixel" style={{
                  display: 'block',
                  color: 'var(--snes-ink-dim)',
                  fontSize: 'var(--t-sm)',
                  marginBottom: '10px',
                  textTransform: 'uppercase'
                }}>Save Name (optional)</label>
                <input
                  type="text"
                  className="snes-panel-inset"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a name for this save..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    minHeight: '44px',
                    backgroundColor: 'var(--snes-bg-2)',
                    border: '2px solid var(--snes-void)',
                    borderRadius: 0,
                    color: 'var(--snes-ink)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--snes-magenta)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--snes-void)'}
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
                  color: 'var(--snes-ink-dim)',
                  fontSize: 'var(--t-sm)',
                  padding: '40px'
                }}>Loading saves...</div>
              ) : saves.length === 0 ? (
                <div className="snes-panel-inset" style={{
                  textAlign: 'center',
                  color: 'var(--snes-ink-dim)',
                  padding: '40px'
                }}>
                  <p className="snes-pixel" style={{ marginBottom: '12px', fontSize: 'var(--t-sm)', color: 'var(--snes-ink)' }}>No saved games found</p>
                  <p style={{ fontSize: '13px', color: 'var(--snes-ink-mute)' }}>Save your game in the Save tab</p>
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
                            fontSize: 'var(--t-sm)',
                            color: 'var(--snes-ink)',
                            marginBottom: '8px'
                          }}>{save.name}</h4>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--snes-ink-mute)',
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
                            className="snes-panel-inset"
                            onClick={() => handleDelete(save.id)}
                            aria-label={`Delete save ${save.name}`}
                            style={{
                              width: '44px',
                              height: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              backgroundColor: 'var(--snes-bg-2)',
                              color: 'var(--snes-red)',
                              border: '2px solid var(--snes-red)',
                              borderRadius: 0,
                              cursor: 'pointer',
                              transition: 'none'
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
                          <span className="snes-pixel" style={{ color: 'var(--snes-ink-mute)', fontSize: 'var(--t-xs)' }}>Round</span>
                          <div className="snes-pixel" style={{ color: 'var(--snes-ink)', fontSize: 'var(--t-sm)', marginTop: '4px' }}>{save.turnNumber}</div>
                        </div>
                        <div>
                          <span className="snes-pixel" style={{ color: 'var(--snes-ink-mute)', fontSize: 'var(--t-xs)' }}>Money</span>
                          <div className="snes-pixel" style={{ color: 'var(--snes-green)', fontSize: 'var(--t-sm)', marginTop: '4px' }}>{formatMoney(save.money)}</div>
                        </div>
                        <div>
                          <span className="snes-pixel" style={{ color: 'var(--snes-ink-mute)', fontSize: 'var(--t-xs)' }}>Rep</span>
                          <div className="snes-pixel" style={{ color: 'var(--snes-gold)', fontSize: 'var(--t-sm)', marginTop: '4px' }}>{save.reputation}</div>
                        </div>
                        <div>
                          <span className="snes-pixel" style={{ color: 'var(--snes-ink-mute)', fontSize: 'var(--t-xs)' }}>Fans</span>
                          <div className="snes-pixel" style={{ color: 'var(--snes-purple)', fontSize: 'var(--t-sm)', marginTop: '4px' }}>{save.fans}</div>
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
    </SnesModal>
  );
};