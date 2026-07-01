import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { dayJobSystem, DayJob, JobCategory } from '@game/mechanics/DayJobSystem';
import { haptics } from '@utils/mobile';
import { Briefcase, Clock, DollarSign, Star, Users, X } from 'lucide-react';

// Prose/name font — job names read as names, not chrome (canon: Inter).
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

export const DayJobView: React.FC = () => {
  const { reputation, connections, venues, stress } = useGameStore();
  const [availableJobs, setAvailableJobs] = useState<DayJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DayJob | null>(null);
  const [filterCategory, setFilterCategory] = useState<JobCategory | 'all'>('all');

  useEffect(() => {
    // Load available jobs
    const jobs = dayJobSystem.getAvailableJobs();
    setAvailableJobs(jobs);
  }, [reputation, connections]);

  const currentJob = dayJobSystem.getCurrentJob();

  const handleTakeJob = (job: DayJob) => {
    if (dayJobSystem.setJob(job)) {
      haptics.success();
      setSelectedJob(null);
      // Refresh available jobs
      const jobs = dayJobSystem.getAvailableJobs();
      setAvailableJobs(jobs);
    } else {
      haptics.error();
    }
  };

  const handleQuitJob = () => {
    dayJobSystem.quitJob();
    haptics.light();
    // Refresh available jobs
    const jobs = dayJobSystem.getAvailableJobs();
    setAvailableJobs(jobs);
  };

  const filteredJobs = filterCategory === 'all'
    ? availableJobs
    : availableJobs.filter(job => job.category === filterCategory);

  const getCategoryIcon = (category: JobCategory) => {
    switch (category) {
      case JobCategory.VENUE: return '🏠';
      case JobCategory.CORPORATE: return '👔';
      case JobCategory.COMMUNITY: return '🎸';
      case JobCategory.SHOP: return '🛍️';
      case JobCategory.CIVIC: return '🏛️';
      default: return '💼';
    }
  };

  // Small chip used for a job's effect stats.
  const StatChip: React.FC<{ bg: string; color: string; children: React.ReactNode }> = ({ bg, color, children }) => (
    <span className="snes-pixel" style={{
      padding: '4px 7px',
      backgroundColor: '#0f0b1e',
      color,
      fontSize: '9px',
      borderRadius: 0,
      border: `2px solid ${bg}`,
      letterSpacing: 0,
      lineHeight: 1
    }}>{children}</span>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0814',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="snes-bar snes-bar--top" style={{
        padding: '10px 14px',
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Briefcase size={18} color="#4cc9f0" />
        <div style={{ minWidth: 0 }}>
          <h2 className="snes-pixel" style={{
            fontSize: '12px',
            color: '#ffffff',
            margin: 0,
            letterSpacing: 0
          }}>Day Job</h2>
          <p style={{
            fontSize: '11px',
            color: '#b9b3d6',
            margin: '3px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentJob ? `Clocking in at ${currentJob.name}` : 'Pay rent so the dream survives'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: 'calc(88px + env(safe-area-inset-bottom))'
      }}>
        {/* Current Job */}
        {currentJob && (
          <section style={{ marginBottom: '16px' }}>
            <h3 className="snes-pixel" style={{
              fontSize: '9px',
              color: '#6f6796',
              textTransform: 'uppercase',
              letterSpacing: 0,
              margin: '0 0 8px 2px'
            }}>Current Employment</h3>
            <div className="snes-panel snes-panel--cyan" style={{
              padding: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontFamily: SANS,
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#ffffff',
                    margin: '0 0 6px',
                    lineHeight: 1.3
                  }}>{currentJob.name}</h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#b9b3d6',
                    margin: '0 0 10px',
                    lineHeight: 1.4
                  }}>{currentJob.description}</p>

                  {/* Job Benefits */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: stress > 70 ? '10px' : 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DollarSign size={14} color="#3ad17e" />
                      <span className="snes-pixel" style={{ fontSize: '9px', color: '#ffffff' }}>+${currentJob.moneyPerTurn}/turn</span>
                    </div>
                    {currentJob.reputationChange !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Star size={14} color={currentJob.reputationChange > 0 ? '#ffd23f' : '#ff5c57'} />
                        <span className="snes-pixel" style={{ fontSize: '9px', color: '#ffffff' }}>
                          {currentJob.reputationChange > 0 ? '+' : ''}{currentJob.reputationChange} rep/turn
                        </span>
                      </div>
                    )}
                    {currentJob.fanChange !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color={currentJob.fanChange > 0 ? '#c77dff' : '#ff5c57'} />
                        <span className="snes-pixel" style={{ fontSize: '9px', color: '#ffffff' }}>
                          {currentJob.fanChange > 0 ? '+' : ''}{currentJob.fanChange} fans/turn
                        </span>
                      </div>
                    )}
                    {currentJob.stressGain > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#ffd23f" />
                        <span className="snes-pixel" style={{ fontSize: '9px', color: '#ffffff' }}>+{currentJob.stressGain}% stress/turn</span>
                      </div>
                    )}
                  </div>

                  {/* Stress Warning */}
                  {stress > 70 && (
                    <div className="snes-panel-inset" style={{
                      border: '2px solid #ffd23f',
                      padding: '8px 10px',
                      fontSize: '11px',
                      color: '#ffd23f',
                      fontWeight: 600,
                      lineHeight: 1.4
                    }}>
                      ⚠️ Burning out — high stress is dragging your performance down
                    </div>
                  )}
                </div>

                <button
                  onClick={handleQuitJob}
                  className="snes-pixel"
                  style={{
                    flexShrink: 0,
                    padding: '8px 12px',
                    backgroundColor: '#ff5c57',
                    color: '#1a0a14',
                    border: '2px solid #0a0814',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                    fontSize: '9px',
                    letterSpacing: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '44px',
                    transition: 'none'
                  }}
                  aria-label="Quit job"
                >
                  <X size={14} />
                  Quit
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Category Filter */}
        <section style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}>
            <button
              onClick={() => setFilterCategory('all')}
              className="snes-pixel"
              style={{
                padding: '8px 12px',
                backgroundColor: filterCategory === 'all' ? '#f72585' : '#171327',
                color: filterCategory === 'all' ? '#ffffff' : '#b9b3d6',
                border: '2px solid #0a0814',
                borderRadius: 0,
                boxShadow: filterCategory === 'all'
                  ? 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #f72585'
                  : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                fontSize: '9px',
                letterSpacing: 0,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                transition: 'none'
              }}
            >
              All Jobs
            </button>
            {Object.values(JobCategory).map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className="snes-pixel"
                style={{
                  padding: '8px 12px',
                  backgroundColor: filterCategory === category ? '#f72585' : '#171327',
                  color: filterCategory === category ? '#ffffff' : '#b9b3d6',
                  border: '2px solid #0a0814',
                  borderRadius: 0,
                  boxShadow: filterCategory === category
                    ? 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #f72585'
                    : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                  fontSize: '9px',
                  letterSpacing: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  textTransform: 'capitalize',
                  transition: 'none'
                }}
              >
                {getCategoryIcon(category)} {category.replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Available Jobs */}
        <section>
          <h3 className="snes-pixel" style={{
            fontSize: '9px',
            color: '#6f6796',
            textTransform: 'uppercase',
            letterSpacing: 0,
            margin: '0 0 8px 2px'
          }}>
            {currentJob ? 'Other Available Jobs' : 'Available Jobs'}
          </h3>

          {filteredJobs.length === 0 ? (
            <div className="snes-panel-inset" style={{
              padding: '40px 24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '10px', lineHeight: 1 }}>💼</div>
              <p style={{ color: '#b9b3d6', fontSize: '13px', margin: 0 }}>No gigs in this category right now</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {filteredJobs.map(job => {
                const venue = job.location?.venueId ? venues.find(v => v.id === job.location?.venueId) : null;
                const meetsRequirements = !job.requirements || (
                  (!job.requirements.minReputation || reputation >= job.requirements.minReputation) &&
                  (!job.requirements.minConnections || connections >= job.requirements.minConnections)
                );
                const isSelected = selectedJob?.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => meetsRequirements && setSelectedJob(job)}
                    className="snes-panel"
                    style={{
                      backgroundColor: '#171327',
                      border: isSelected ? '2px solid #f72585' : '2px solid #0a0814',
                      borderRadius: 0,
                      boxShadow: isSelected
                        ? 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #f72585'
                        : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                      padding: '12px',
                      cursor: meetsRequirements ? 'pointer' : 'not-allowed',
                      opacity: meetsRequirements ? 1 : 0.55,
                      transition: 'none',
                      minHeight: '44px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div className="snes-panel-inset" style={{
                        flexShrink: 0,
                        width: '38px',
                        height: '38px',
                        borderRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>{getCategoryIcon(job.category)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontFamily: SANS,
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#ffffff',
                          margin: '0 0 5px',
                          lineHeight: 1.3
                        }}>{job.name}</h4>
                        {venue && (
                          <p style={{
                            fontSize: '11px',
                            color: '#b9b3d6',
                            margin: '0 0 3px'
                          }}>📍 {venue.location.name}</p>
                        )}
                        <p style={{
                          fontSize: '12px',
                          color: '#b9b3d6',
                          margin: '0 0 8px',
                          lineHeight: 1.4
                        }}>{job.description}</p>

                        {/* Job Stats */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '5px'
                        }}>
                          {job.moneyPerTurn > 0 && (
                            <StatChip bg="#3ad17e" color="#3ad17e">+${job.moneyPerTurn}</StatChip>
                          )}
                          {job.reputationChange !== 0 && (
                            <StatChip
                              bg={job.reputationChange > 0 ? '#ffd23f' : '#ff5c57'}
                              color={job.reputationChange > 0 ? '#ffd23f' : '#ff5c57'}
                            >
                              {job.reputationChange > 0 ? '+' : ''}{job.reputationChange} rep
                            </StatChip>
                          )}
                          {job.fanChange !== 0 && (
                            <StatChip
                              bg={job.fanChange > 0 ? '#c77dff' : '#ff5c57'}
                              color={job.fanChange > 0 ? '#c77dff' : '#ff5c57'}
                            >
                              {job.fanChange > 0 ? '+' : ''}{job.fanChange} fans
                            </StatChip>
                          )}
                          {job.connectionGain && job.connectionGain > 0 && (
                            <StatChip bg="#4cc9f0" color="#4cc9f0">+{job.connectionGain} conn</StatChip>
                          )}
                        </div>

                        {/* Requirements */}
                        {job.requirements && (job.requirements.minReputation || job.requirements.minConnections) && (
                          <div className="snes-pixel" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '7px',
                            fontSize: '9px',
                            letterSpacing: 0
                          }}>
                            {job.requirements.minReputation && (
                              <span style={{ color: reputation >= job.requirements.minReputation ? '#3ad17e' : '#ff5c57' }}>
                                {reputation >= job.requirements.minReputation ? '✓' : '✕'} {job.requirements.minReputation}+ REP
                              </span>
                            )}
                            {job.requirements.minConnections && (
                              <span style={{ color: connections >= job.requirements.minConnections ? '#3ad17e' : '#ff5c57' }}>
                                {connections >= job.requirements.minConnections ? '✓' : '✕'} {job.requirements.minConnections}+ CONN
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Job Action Modal */}
        {selectedJob && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(8, 6, 18, 0.86)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedJob(null)}
          >
            <div style={{
              backgroundColor: '#171327',
              border: '2px solid #0a0814',
              borderTop: '3px solid #f72585',
              borderRadius: 0,
              boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
              padding: '20px',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
              width: '100%',
              maxWidth: '448px'
            }}
            onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px', marginBottom: '10px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: '#6f6796',
                  textTransform: 'uppercase',
                  letterSpacing: 0,
                  margin: 0
                }}>Take This Job?</h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  aria-label="Close"
                  style={{
                    flexShrink: 0,
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#1f1a3a',
                    border: '2px solid #0a0814',
                    borderRadius: 0,
                    color: '#b9b3d6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <h4 className="snes-pixel" style={{
                fontSize: '11px',
                color: '#ffffff',
                margin: '0 0 6px',
                lineHeight: 1.4
              }}>{selectedJob.name}</h4>
              <p style={{
                fontSize: '12px',
                color: '#b9b3d6',
                margin: '0 0 16px',
                lineHeight: 1.5
              }}>{selectedJob.description}</p>

              {currentJob && (
                <div className="snes-panel-inset" style={{
                  border: '2px solid #ffd23f',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#ffd23f',
                  fontWeight: 600,
                  lineHeight: 1.4
                }}>
                  ⚠️ This kicks {currentJob.name} to the curb
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="snes-pixel"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#1f1a3a',
                    color: '#b9b3d6',
                    border: '2px solid #0a0814',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                    fontSize: '9px',
                    letterSpacing: 0,
                    cursor: 'pointer',
                    minHeight: '44px',
                    transition: 'none'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTakeJob(selectedJob)}
                  className="snes-pixel"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f72585',
                    color: '#1a0a14',
                    border: '2px solid #0a0814',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                    fontSize: '9px',
                    letterSpacing: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '44px',
                    transition: 'none'
                  }}
                >
                  <Briefcase size={16} />
                  Take Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
