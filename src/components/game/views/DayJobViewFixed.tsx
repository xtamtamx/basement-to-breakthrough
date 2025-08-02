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
    const jobs = dayJobSystem.getAvailableJobs({ reputation, connections });
    setAvailableJobs(jobs);
  }, [reputation, connections]);

  const currentJob = dayJobSystem.getCurrentJob();
  
  const handleTakeJob = (job: DayJob) => {
    if (dayJobSystem.takeJob(job.id)) {
      haptics.success();
      setSelectedJob(null);
      // Refresh available jobs
      const jobs = dayJobSystem.getAvailableJobs({ reputation, connections });
      setAvailableJobs(jobs);
    } else {
      haptics.error();
    }
  };

  const handleQuitJob = () => {
    dayJobSystem.quitJob();
    haptics.light();
    // Refresh available jobs
    const jobs = dayJobSystem.getAvailableJobs({ reputation, connections });
    setAvailableJobs(jobs);
  };

  const filteredJobs = filterCategory === 'all' 
    ? availableJobs 
    : availableJobs.filter(job => job.category === filterCategory);

  const getCategoryIcon = (category: JobCategory) => {
    switch (category) {
      case JobCategory.MUSIC_STORE: return '🎸';
      case JobCategory.VENUE_STAFF: return '🏠';
      case JobCategory.FREELANCE: return '💻';
      case JobCategory.CORPORATE: return '👔';
      default: return '💼';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        borderBottom: '1px solid #374151',
        padding: '8px 12px',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ec4899',
          margin: 0
        }}>Day Job</h2>
        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginTop: '2px'
        }}>
          {currentJob ? `Current: ${currentJob.name}` : 'Find a job to earn steady income'}
        </p>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: '80px'
      }}>
        {/* Current Job */}
        {currentJob && (
          <section style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>Current Employment</h3>
            <div style={{
              backgroundImage: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))',
              border: '1px solid #374151',
              borderRadius: '10px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '4px'
                  }}>{currentJob.name}</h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>{currentJob.description}</p>
                  
                  {/* Job Benefits */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <DollarSign size={14} color="#10b981" />
                      <span style={{ fontSize: '12px', color: '#ffffff' }}>+${currentJob.moneyPerTurn}/turn</span>
                    </div>
                    {currentJob.reputationChange !== 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Star size={14} color={currentJob.reputationChange > 0 ? '#fbbf24' : '#ef4444'} />
                        <span style={{ fontSize: '12px', color: '#ffffff' }}>
                          {currentJob.reputationChange > 0 ? '+' : ''}{currentJob.reputationChange} rep/turn
                        </span>
                      </div>
                    )}
                    {currentJob.fanChange !== 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Users size={14} color={currentJob.fanChange > 0 ? '#ec4899' : '#ef4444'} />
                        <span style={{ fontSize: '12px', color: '#ffffff' }}>
                          {currentJob.fanChange > 0 ? '+' : ''}{currentJob.fanChange} fans/turn
                        </span>
                      </div>
                    )}
                    {currentJob.stressPerTurn && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={14} color="#fb923c" />
                        <span style={{ fontSize: '12px', color: '#ffffff' }}>+{currentJob.stressPerTurn}% stress/turn</span>
                      </div>
                    )}
                  </div>

                  {/* Stress Warning */}
                  {stress > 70 && (
                    <div style={{
                      backgroundColor: 'rgba(251, 146, 60, 0.2)',
                      border: '1px solid #fb923c',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '11px',
                      color: '#ffffff'
                    }}>
                      ⚠️ High stress levels affecting performance
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleQuitJob}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '32px'
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
                padding: '6px 12px',
                backgroundColor: filterCategory === 'all' ? '#ec4899' : '#1f2937',
                color: filterCategory === 'all' ? '#ffffff' : '#9ca3af',
                border: '1px solid',
                borderColor: filterCategory === 'all' ? '#ec4899' : '#374151',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '32px'
              }}
            >
              All Jobs
            </button>
            {Object.values(JobCategory).map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: filterCategory === category ? '#ec4899' : '#1f2937',
                  color: filterCategory === category ? '#ffffff' : '#9ca3af',
                  border: '1px solid',
                  borderColor: filterCategory === category ? '#ec4899' : '#374151',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '32px'
                }}
              >
                {getCategoryIcon(category)} {category.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* Available Jobs */}
        <section>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            {currentJob ? 'Other Available Jobs' : 'Available Jobs'}
          </h3>
          
          {filteredJobs.length === 0 ? (
            <div style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '10px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No jobs available in this category</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {filteredJobs.map(job => {
                const venue = job.location?.venueId ? venues.find(v => v.id === job.location?.venueId) : null;
                const meetsRequirements = !job.requirements || (
                  (!job.requirements.minReputation || reputation >= job.requirements.minReputation) &&
                  (!job.requirements.minConnections || connections >= job.requirements.minConnections)
                );
                
                return (
                  <div
                    key={job.id}
                    onClick={() => meetsRequirements && setSelectedJob(job)}
                    style={{
                      backgroundColor: '#1f2937',
                      border: selectedJob?.id === job.id ? '2px solid #ec4899' : '1px solid #374151',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: meetsRequirements ? 'pointer' : 'not-allowed',
                      opacity: meetsRequirements ? 1 : 0.5,
                      transition: 'all 0.2s',
                      minHeight: '44px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                      <div style={{ fontSize: '20px', flexShrink: 0 }}>{getCategoryIcon(job.category)}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#ffffff',
                          marginBottom: '2px'
                        }}>{job.name}</h4>
                        {venue && (
                          <p style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            marginBottom: '2px'
                          }}>📍 {venue.location.name}</p>
                        )}
                        <p style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginBottom: '6px'
                        }}>{job.description}</p>
                        
                        {/* Job Stats */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px'
                        }}>
                          {job.moneyPerTurn > 0 && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>+${job.moneyPerTurn}</span>
                          )}
                          {job.reputationChange !== 0 && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: job.reputationChange > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: job.reputationChange > 0 ? '#fbbf24' : '#ef4444',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              {job.reputationChange > 0 ? '+' : ''}{job.reputationChange} rep
                            </span>
                          )}
                          {job.fanChange !== 0 && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: job.fanChange > 0 ? 'rgba(236, 72, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: job.fanChange > 0 ? '#ec4899' : '#ef4444',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              {job.fanChange > 0 ? '+' : ''}{job.fanChange} fans
                            </span>
                          )}
                          {job.connectionGain && job.connectionGain > 0 && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: 'rgba(236, 72, 153, 0.2)',
                              color: '#ec4899',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>+{job.connectionGain} conn</span>
                          )}
                        </div>
                        
                        {/* Requirements */}
                        {job.requirements && (
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '4px',
                            fontSize: '11px'
                          }}>
                            {job.requirements.minReputation && (
                              <span style={{ color: reputation >= job.requirements.minReputation ? '#10b981' : '#ef4444' }}>
                                {job.requirements.minReputation}+ REP
                              </span>
                            )}
                            {job.requirements.minConnections && (
                              <span style={{ color: connections >= job.requirements.minConnections ? '#10b981' : '#ef4444' }}>
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
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              maxWidth: '448px',
              animation: 'slideUp 0.3s ease-out'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px'
              }}>Take This Job?</h3>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '4px'
              }}>{selectedJob.name}</h4>
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '16px'
              }}>{selectedJob.description}</p>
              
              {currentJob && (
                <div style={{
                  backgroundColor: 'rgba(251, 146, 60, 0.2)',
                  border: '1px solid #fb923c',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#ffffff'
                }}>
                  ⚠️ Taking this job will replace your current position
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
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
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
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
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
      
      <style jsx>{`
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