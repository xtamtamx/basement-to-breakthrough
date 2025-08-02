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
    } catch (err) {
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
      const saveId = await gameStore.saveGame(saveName || undefined);
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
    } catch (err) {
      setError('Failed to delete save');
      haptics.error();
    }
  };
  
  const formatDate = (timestamp: number) => {
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
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #ec4899',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ec4899',
            margin: 0
          }}>Save & Load</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #374151'
        }}>
          <button
            onClick={() => setActiveTab('save')}
            style={{
              flex: 1,
              padding: '16px',
              backgroundColor: activeTab === 'save' ? '#1f2937' : 'transparent',
              color: activeTab === 'save' ? '#ec4899' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === 'save' ? '2px solid #ec4899' : '2px solid transparent',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
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
            onClick={() => setActiveTab('load')}
            style={{
              flex: 1,
              padding: '16px',
              backgroundColor: activeTab === 'load' ? '#1f2937' : 'transparent',
              color: activeTab === 'load' ? '#ec4899' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === 'load' ? '2px solid #ec4899' : '2px solid transparent',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
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
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {activeTab === 'save' ? (
            // Save Tab
            <div>
              {/* Current Game Info */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '12px'
                }}>Current Game</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="#9ca3af" />
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                      Round {gameStore.currentRound}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="#10b981" />
                    <span style={{ color: '#10b981', fontSize: '14px' }}>
                      {formatMoney(gameStore.money)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={16} color="#fbbf24" />
                    <span style={{ color: '#fbbf24', fontSize: '14px' }}>
                      {gameStore.reputation} Rep
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#a78bfa" />
                    <span style={{ color: '#a78bfa', fontSize: '14px' }}>
                      {gameStore.fans} Fans
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Name Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#9ca3af',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>Save Name (optional)</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a name for this save..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#db2777')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ec4899'}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Game'}
              </button>
            </div>
          ) : (
            // Load Tab
            <div>
              {loading ? (
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  padding: '40px'
                }}>Loading saves...</div>
              ) : saves.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  padding: '40px'
                }}>
                  <p style={{ marginBottom: '8px' }}>No saved games found</p>
                  <p style={{ fontSize: '14px' }}>Save your game in the Save tab</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {saves.map((save) => (
                    <div
                      key={save.id}
                      style={{
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #374151',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '4px'
                          }}>{save.name}</h4>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#9ca3af',
                            fontSize: '12px'
                          }}>
                            <Clock size={12} />
                            {formatDate(save.timestamp)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleLoad(save.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#374151',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDelete(save.id)}
                            style={{
                              padding: '8px',
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              border: '1px solid #ef4444',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#ef4444';
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
                          <span style={{ color: '#6b7280' }}>Round</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>{save.gameData.round}</div>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Money</span>
                          <div style={{ color: '#10b981', fontWeight: '500' }}>{formatMoney(save.gameData.money)}</div>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Rep</span>
                          <div style={{ color: '#fbbf24', fontWeight: '500' }}>{save.gameData.reputation}</div>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Fans</span>
                          <div style={{ color: '#a78bfa', fontWeight: '500' }}>{save.gameData.fans}</div>
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