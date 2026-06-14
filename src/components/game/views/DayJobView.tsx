import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { dayJobSystem, DayJob, JobCategory } from '@game/mechanics/DayJobSystem';
import { haptics } from '@utils/mobile';
import { Briefcase, Clock, DollarSign, Star, Users, X } from 'lucide-react';

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
      default: return '💼';
    }
  };

  // Small chip used for a job's effect stats.
  const StatChip: React.FC<{ bg: string; color: string; children: React.ReactNode }> = ({ bg, color, children }) => (
    <span style={{
      padding: '3px 8px',
      backgroundColor: bg,
      color,
      fontSize: '11px',
      borderRadius: '6px',
      fontWeight: 600
    }}>{children}</span>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundImage: 'linear-gradient(to bottom, #1a1030, #0c0a14)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        borderBottom: '1px solid #1f2937',
        padding: '10px 14px',
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Briefcase size={18} color="#06b6d4" />
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '0.02em'
          }}>Day Job</h2>
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            margin: '1px 0 0',
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
            <h3 style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 8px 2px'
            }}>Current Employment</h3>
            <div style={{
              backgroundImage: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(168, 85, 247, 0.12))',
              border: '1px solid #06b6d4',
              borderRadius: '12px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: '0 0 4px'
                  }}>{currentJob.name}</h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
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
                      <DollarSign size={14} color="#10b981" />
                      <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>+${currentJob.moneyPerTurn}/turn</span>
                    </div>
                    {currentJob.reputationChange !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Star size={14} color={currentJob.reputationChange > 0 ? '#fbbf24' : '#ef4444'} />
                        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>
                          {currentJob.reputationChange > 0 ? '+' : ''}{currentJob.reputationChange} rep/turn
                        </span>
                      </div>
                    )}
                    {currentJob.fanChange !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color={currentJob.fanChange > 0 ? '#ec4899' : '#ef4444'} />
                        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>
                          {currentJob.fanChange > 0 ? '+' : ''}{currentJob.fanChange} fans/turn
                        </span>
                      </div>
                    )}
                    {currentJob.stressGain > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#f59e0b" />
                        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>+{currentJob.stressGain}% stress/turn</span>
                      </div>
                    )}
                  </div>

                  {/* Stress Warning */}
                  {stress > 70 && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      color: '#fbbf24',
                      fontWeight: 600
                    }}>
                      ⚠️ Burning out — high stress is dragging your performance down
                    </div>
                  )}
                </div>

                <button
                  onClick={handleQuitJob}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px',
                    backgroundColor: 'rgba(220, 38, 38, 0.15)',
                    color: '#f87171',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '44px'
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
              style={{
                padding: '8px 14px',
                backgroundColor: filterCategory === 'all' ? '#ec4899' : '#111827',
                color: filterCategory === 'all' ? '#ffffff' : '#9ca3af',
                border: '1px solid',
                borderColor: filterCategory === 'all' ? '#ec4899' : '#1f2937',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '36px'
              }}
            >
              All Jobs
            </button>
            {Object.values(JobCategory).map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: filterCategory === category ? '#ec4899' : '#111827',
                  color: filterCategory === category ? '#ffffff' : '#9ca3af',
                  border: '1px solid',
                  borderColor: filterCategory === category ? '#ec4899' : '#1f2937',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '36px',
                  textTransform: 'capitalize'
                }}
              >
                {getCategoryIcon(category)} {category.replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Available Jobs */}
        <section>
          <h3 style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 8px 2px'
          }}>
            {currentJob ? 'Other Available Jobs' : 'Available Jobs'}
          </h3>

          {filteredJobs.length === 0 ? (
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '10px', lineHeight: 1 }}>💼</div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No gigs in this category right now</p>
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
                    style={{
                      backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.08)' : '#111827',
                      border: isSelected ? '1px solid #ec4899' : '1px solid #1f2937',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: meetsRequirements ? 'pointer' : 'not-allowed',
                      opacity: meetsRequirements ? 1 : 0.55,
                      transition: 'all 0.2s',
                      minHeight: '44px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{
                        flexShrink: 0,
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(6, 182, 212, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>{getCategoryIcon(job.category)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#ffffff',
                          margin: '0 0 2px'
                        }}>{job.name}</h4>
                        {venue && (
                          <p style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            margin: '0 0 2px'
                          }}>📍 {venue.location.name}</p>
                        )}
                        <p style={{
                          fontSize: '12px',
                          color: '#9ca3af',
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
                            <StatChip bg="rgba(16, 185, 129, 0.15)" color="#10b981">+${job.moneyPerTurn}</StatChip>
                          )}
                          {job.reputationChange !== 0 && (
                            <StatChip
                              bg={job.reputationChange > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                              color={job.reputationChange > 0 ? '#fbbf24' : '#ef4444'}
                            >
                              {job.reputationChange > 0 ? '+' : ''}{job.reputationChange} rep
                            </StatChip>
                          )}
                          {job.fanChange !== 0 && (
                            <StatChip
                              bg={job.fanChange > 0 ? 'rgba(236, 72, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                              color={job.fanChange > 0 ? '#ec4899' : '#ef4444'}
                            >
                              {job.fanChange > 0 ? '+' : ''}{job.fanChange} fans
                            </StatChip>
                          )}
                          {job.connectionGain && job.connectionGain > 0 && (
                            <StatChip bg="rgba(6, 182, 212, 0.15)" color="#06b6d4">+{job.connectionGain} conn</StatChip>
                          )}
                        </div>

                        {/* Requirements */}
                        {job.requirements && (job.requirements.minReputation || job.requirements.minConnections) && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginTop: '6px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {job.requirements.minReputation && (
                              <span style={{ color: reputation >= job.requirements.minReputation ? '#10b981' : '#ef4444' }}>
                                {reputation >= job.requirements.minReputation ? '✓' : '✕'} {job.requirements.minReputation}+ REP
                              </span>
                            )}
                            {job.requirements.minConnections && (
                              <span style={{ color: connections >= job.requirements.minConnections ? '#10b981' : '#ef4444' }}>
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
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedJob(null)}
          >
            <div style={{
              backgroundImage: 'linear-gradient(to bottom, #1a1030, #0c0a14)',
              border: '1px solid #1f2937',
              borderTop: '2px solid #ec4899',
              borderRadius: '16px',
              padding: '20px',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
              width: '100%',
              maxWidth: '448px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={e => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: '0 0 10px'
              }}>Take This Job?</h3>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 4px'
              }}>{selectedJob.name}</h4>
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                margin: '0 0 16px',
                lineHeight: 1.5
              }}>{selectedJob.description}</p>

              {currentJob && (
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #f59e0b',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#fbbf24',
                  fontWeight: 600
                }}>
                  ⚠️ This kicks {currentJob.name} to the curb
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#374151',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTakeJob(selectedJob)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '44px'
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

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
