import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { dayJobSystem, DayJob, JobCategory } from '@game/mechanics/DayJobSystem';
import { haptics } from '@utils/mobile';
import { Briefcase, Clock, DollarSign, Star, Users, X } from 'lucide-react';
import { SnesModal } from '@/components/ui/SnesModal';
import { PixelIcon } from '@components/ui/PixelIcon';

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

  const getCategoryIcon = (category: JobCategory): string => {
    switch (category) {
      case JobCategory.VENUE: return 'home';
      case JobCategory.CORPORATE: return 'tie';
      case JobCategory.COMMUNITY: return 'guitar';
      case JobCategory.SHOP: return 'shop';
      case JobCategory.CIVIC: return 'building';
      default: return 'briefcase';
    }
  };

  // Small chip used for a job's effect stats.
  const StatChip: React.FC<{ bg: string; color: string; children: React.ReactNode }> = ({ bg, color, children }) => (
    <span className="snes-pixel" style={{
      padding: '4px 7px',
      backgroundColor: 'var(--snes-bg-2)',
      color,
      fontSize: '11px',
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
      backgroundColor: 'var(--snes-void)',
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
        <Briefcase size={18} color="var(--snes-cyan)" />
        <div style={{ minWidth: 0 }}>
          <h2 className="snes-pixel" style={{
            fontSize: '12px',
            color: 'var(--snes-ink)',
            margin: 0,
            letterSpacing: 0
          }}>Day Job</h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--snes-ink-dim)',
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
              fontSize: '11px',
              color: 'var(--snes-ink-dim)',
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
                    color: 'var(--snes-ink)',
                    margin: '0 0 6px',
                    lineHeight: 1.3
                  }}>{currentJob.name}</h4>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--snes-ink-dim)',
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
                      <DollarSign size={14} color="var(--snes-green)" />
                      <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>+${currentJob.moneyPerTurn}/turn</span>
                    </div>
                    {currentJob.reputationChange !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Star size={14} color={currentJob.reputationChange > 0 ? 'var(--snes-gold)' : 'var(--snes-red)'} />
                        <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>
                          {currentJob.reputationChange > 0 ? '+' : ''}{currentJob.reputationChange} rep/turn
                        </span>
                      </div>
                    )}
                    {currentJob.fanChange !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color={currentJob.fanChange > 0 ? 'var(--snes-purple)' : 'var(--snes-red)'} />
                        <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>
                          {currentJob.fanChange > 0 ? '+' : ''}{currentJob.fanChange} fans/turn
                        </span>
                      </div>
                    )}
                    {currentJob.stressGain > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--snes-gold)" />
                        <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>+{currentJob.stressGain}% stress/turn</span>
                      </div>
                    )}
                  </div>

                  {/* Stress Warning */}
                  {stress > 70 && (
                    <div className="snes-panel-inset" style={{
                      border: '2px solid var(--snes-gold)',
                      padding: '8px 10px',
                      fontSize: '11px',
                      color: 'var(--snes-gold)',
                      fontWeight: 600,
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <PixelIcon name="warning" size={13} />
                      Burning out — high stress is dragging your performance down
                    </div>
                  )}
                </div>

                <button
                  onClick={handleQuitJob}
                  className="snes-pixel"
                  style={{
                    flexShrink: 0,
                    padding: '8px 12px',
                    backgroundColor: 'var(--snes-red)',
                    color: '#f7efe0',
                    border: '2px solid var(--snes-void)',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                    fontSize: '11px',
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
                padding: '6px 10px',
                backgroundColor: filterCategory === 'all' ? 'var(--snes-magenta)' : 'var(--snes-bg)',
                color: filterCategory === 'all' ? '#f7efe0' : 'var(--snes-ink-dim)',
                border: '2px solid var(--snes-void)',
                borderRadius: 0,
                boxShadow: filterCategory === 'all'
                  ? 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void), 0 0 0 1px var(--snes-magenta)'
                  : 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                fontSize: '11px',
                letterSpacing: 0,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '40px',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  backgroundColor: filterCategory === category ? 'var(--snes-magenta)' : 'var(--snes-bg)',
                  color: filterCategory === category ? '#f7efe0' : 'var(--snes-ink-dim)',
                  border: '2px solid var(--snes-void)',
                  borderRadius: 0,
                  boxShadow: filterCategory === category
                    ? 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void), 0 0 0 1px var(--snes-magenta)'
                    : 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                  fontSize: '11px',
                  letterSpacing: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '40px',
                  textTransform: 'capitalize',
                  transition: 'none'
                }}
              >
                <PixelIcon name={getCategoryIcon(category)} size={14} />
                {category.replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Available Jobs */}
        <section>
          <h3 className="snes-pixel" style={{
            fontSize: '11px',
            color: 'var(--snes-ink-dim)',
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
              <div style={{ marginBottom: '10px', lineHeight: 1, color: 'var(--snes-ink-mute)' }}>
                <PixelIcon name="briefcase" size={36} />
              </div>
              <p style={{ color: 'var(--snes-ink-dim)', fontSize: '13px', margin: 0 }}>No gigs in this category right now</p>
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
                      backgroundColor: 'var(--snes-bg)',
                      border: isSelected ? '2px solid var(--snes-magenta)' : '2px solid var(--snes-void)',
                      borderRadius: 0,
                      boxShadow: isSelected
                        ? 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void), 0 0 0 1px var(--snes-magenta)'
                        : 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
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
                        color: 'var(--snes-ink-dim)'
                      }}><PixelIcon name={getCategoryIcon(job.category)} size={20} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontFamily: SANS,
                          fontWeight: 700,
                          fontSize: '14px',
                          color: 'var(--snes-ink)',
                          margin: '0 0 5px',
                          lineHeight: 1.3
                        }}>{job.name}</h4>
                        {venue && (
                          <p style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '13px',
                            color: 'var(--snes-ink-dim)',
                            margin: '0 0 6px'
                          }}>
                            <PixelIcon name="pin" size={12} />
                            {venue.location.name}
                          </p>
                        )}
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--snes-ink-dim)',
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
                            <StatChip bg="var(--snes-green)" color="var(--snes-green)">+${job.moneyPerTurn}</StatChip>
                          )}
                          {job.reputationChange !== 0 && (
                            <StatChip
                              bg={job.reputationChange > 0 ? 'var(--snes-gold)' : 'var(--snes-red)'}
                              color={job.reputationChange > 0 ? 'var(--snes-gold)' : 'var(--snes-red)'}
                            >
                              {job.reputationChange > 0 ? '+' : ''}{job.reputationChange} rep
                            </StatChip>
                          )}
                          {job.fanChange !== 0 && (
                            <StatChip
                              bg={job.fanChange > 0 ? 'var(--snes-purple)' : 'var(--snes-red)'}
                              color={job.fanChange > 0 ? 'var(--snes-purple)' : 'var(--snes-red)'}
                            >
                              {job.fanChange > 0 ? '+' : ''}{job.fanChange} fans
                            </StatChip>
                          )}
                          {job.connectionGain && job.connectionGain > 0 && (
                            <StatChip bg="var(--snes-cyan)" color="var(--snes-cyan)">+{job.connectionGain} conn</StatChip>
                          )}
                        </div>

                        {/* Requirements */}
                        {job.requirements && (job.requirements.minReputation || job.requirements.minConnections) && (
                          <div className="snes-pixel" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginTop: '7px',
                            fontSize: '11px',
                            letterSpacing: 0
                          }}>
                            {job.requirements.minReputation && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: reputation >= job.requirements.minReputation ? 'var(--snes-green)' : 'var(--snes-red)' }}>
                                <PixelIcon name={reputation >= job.requirements.minReputation ? 'check' : 'x'} size={11} />
                                {job.requirements.minReputation}+ REP
                              </span>
                            )}
                            {job.requirements.minConnections && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: connections >= job.requirements.minConnections ? 'var(--snes-green)' : 'var(--snes-red)' }}>
                                <PixelIcon name={connections >= job.requirements.minConnections ? 'check' : 'x'} size={11} />
                                {job.requirements.minConnections}+ CONN
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
          <SnesModal variant="sheet" accent="var(--snes-magenta)" onClose={() => setSelectedJob(null)} title="Take This Job?">
              <h4 style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--snes-ink)',
                margin: '0 0 6px',
                lineHeight: 1.3
              }}>{selectedJob.name}</h4>
              <p style={{
                fontSize: '12px',
                color: 'var(--snes-ink-dim)',
                margin: '0 0 16px',
                lineHeight: 1.5
              }}>{selectedJob.description}</p>

              {currentJob && (
                <div className="snes-panel-inset" style={{
                  border: '2px solid var(--snes-gold)',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: 'var(--snes-gold)',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <PixelIcon name="warning" size={13} />
                  This kicks {currentJob.name} to the curb
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="snes-pixel"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'var(--snes-bg-3)',
                    color: 'var(--snes-ink-dim)',
                    border: '2px solid var(--snes-void)',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                    fontSize: '11px',
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
                    backgroundColor: 'var(--snes-magenta)',
                    color: '#f7efe0',
                    border: '2px solid var(--snes-void)',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                    fontSize: '11px',
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
          </SnesModal>
        )}
      </div>
    </div>
  );
};
