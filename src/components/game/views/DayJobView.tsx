import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { dayJobSystem, DayJob, JobCategory } from '@game/mechanics/DayJobSystem';
import { haptics } from '@utils/mobile';

// Job Card Component
const JobCard: React.FC<{ job: DayJob; onTake: (job: DayJob) => void }> = ({ job, onTake }) => {
  const { reputation, connections, venues } = useGameStore();
  const venue = job.location?.venueId ? venues.find(v => v.id === job.location?.venueId) : null;
  
  const meetsRequirements = !job.requirements || (
    (!job.requirements.minReputation || reputation >= job.requirements.minReputation) &&
    (!job.requirements.minConnections || connections >= job.requirements.minConnections)
  );
  
  return (
    <motion.div 
      className="job-card"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <h4>{job.name}</h4>
      {venue && <p className="job-location">📍 {venue.location.name}</p>}
      <p className="job-desc">{job.description}</p>
      
      <div className="job-stats">
        {job.moneyPerTurn > 0 && (
          <span className="stat positive">+${job.moneyPerTurn}</span>
        )}
        {job.reputationChange !== 0 && (
          <span className={`stat ${job.reputationChange > 0 ? 'positive' : 'negative'}`}>
            {job.reputationChange > 0 ? '+' : ''}{job.reputationChange} rep
          </span>
        )}
        {job.fanChange !== 0 && (
          <span className={`stat ${job.fanChange > 0 ? 'positive' : 'negative'}`}>
            {job.fanChange > 0 ? '+' : ''}{job.fanChange} fans
          </span>
        )}
        {job.connectionGain && job.connectionGain > 0 && (
          <span className="stat positive">+{job.connectionGain} conn</span>
        )}
      </div>
      
      {job.requirements && (
        <div className="requirements">
          {job.requirements.minReputation && (
            <span className={reputation >= job.requirements.minReputation ? 'met' : 'unmet'}>
              {job.requirements.minReputation} rep required
            </span>
          )}
          {job.requirements.minConnections && (
            <span className={connections >= job.requirements.minConnections ? 'met' : 'unmet'}>
              {job.requirements.minConnections} connections required
            </span>
          )}
        </div>
      )}
      
      <button 
        className="take-job-button"
        onClick={() => onTake(job)}
        disabled={!meetsRequirements}
      >
        TAKE JOB
      </button>
    </motion.div>
  );
};

export const DayJobView: React.FC = () => {
  const { money, reputation, fans, stress, connections, venues } = useGameStore();
  const [currentJob, setCurrentJob] = useState<DayJob | null>(dayJobSystem.getCurrentJob());
  const [showingJobs, setShowingJobs] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<DayJob[]>([]);
  
  useEffect(() => {
    // Refresh jobs when component mounts or venues change
    dayJobSystem.refreshJobs();
    const jobs = dayJobSystem.getAvailableJobs();
    setAvailableJobs(jobs);
    console.log('Generated jobs:', jobs.length);
  }, [venues.length]);
  
  const handleTakeJob = (job: DayJob) => {
    if (dayJobSystem.setJob(job)) {
      setCurrentJob(job);
      setShowingJobs(false);
      haptics.success();
    } else {
      haptics.error();
    }
  };
  
  const handleQuitJob = () => {
    dayJobSystem.quitJob();
    setCurrentJob(null);
    haptics.light();
  };
  
  const handleShowJobs = () => {
    dayJobSystem.refreshJobs();
    const jobs = dayJobSystem.getAvailableJobs();
    console.log('Available jobs on show:', jobs);
    setAvailableJobs(jobs);
    setShowingJobs(true);
    haptics.light();
  };
  
  // Group jobs by category
  const jobsByCategory = availableJobs.reduce((acc, job) => {
    if (!acc[job.category]) acc[job.category] = [];
    acc[job.category].push(job);
    return acc;
  }, {} as Record<JobCategory, DayJob[]>);
  
  return (
    <div className="day-job-view">
      <div className="view-header">
        <h2 className="view-title">SURVIVAL MODE</h2>
        <p className="view-subtitle">Sometimes you gotta sell out to pay the bills</p>
      </div>
      
      {/* Current Job Status */}
      <div className="current-job-card">
        {currentJob ? (
          <>
            <div className="job-header">
              <h3 className="job-title">{currentJob.name}</h3>
              <button 
                className="quit-button"
                onClick={handleQuitJob}
              >
                QUIT
              </button>
            </div>
            <p className="job-description">{currentJob.description}</p>
            
            <div className="job-effects">
              {currentJob.moneyPerTurn > 0 && (
                <div className="effect positive">
                  <span className="effect-icon">💰</span>
                  <span className="effect-value">+${currentJob.moneyPerTurn}/turn</span>
                </div>
              )}
              {currentJob.reputationChange !== 0 && (
                <div className={`effect ${currentJob.reputationChange > 0 ? 'positive' : 'negative'}`}>
                  <span className="effect-icon">⭐</span>
                  <span className="effect-value">
                    {currentJob.reputationChange > 0 ? '+' : ''}{currentJob.reputationChange}/turn
                  </span>
                </div>
              )}
              {currentJob.fanChange !== 0 && (
                <div className={`effect ${currentJob.fanChange > 0 ? 'positive' : 'negative'}`}>
                  <span className="effect-icon">👥</span>
                  <span className="effect-value">
                    {currentJob.fanChange > 0 ? '+' : ''}{currentJob.fanChange}/turn
                  </span>
                </div>
              )}
              {currentJob.connectionGain && currentJob.connectionGain > 0 && (
                <div className="effect positive">
                  <span className="effect-icon">🤝</span>
                  <span className="effect-value">+{currentJob.connectionGain}/turn</span>
                </div>
              )}
              <div className="effect negative">
                <span className="effect-icon">😰</span>
                <span className="effect-value">+{currentJob.stressGain}% stress</span>
              </div>
            </div>
            
            <p className="job-flavor">{currentJob.satiricalFlavor}</p>
          </>
        ) : (
          <div className="no-job">
            <h3>UNEMPLOYED</h3>
            <p>Living the dream... until the rent's due</p>
            <button 
              className="find-job-button"
              onClick={handleShowJobs}
            >
              FIND A DAY JOB
            </button>
          </div>
        )}
      </div>
      
      {/* Job Listings */}
      <AnimatePresence>
        {showingJobs && (
          <motion.div 
            className="job-listings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowingJobs(false)}
          >
            <motion.div 
              className="job-listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="listings-header">
                <h3>AVAILABLE SOUL-CRUSHING OPPORTUNITIES</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowingJobs(false)}
                >
                  ✕
                </button>
              </div>
            
            {availableJobs.length === 0 ? (
              <div className="no-jobs-available">
                <p>No jobs available right now. Check back later!</p>
                <p className="hint">Jobs appear based on your scene connections and reputation.</p>
              </div>
            ) : (
              <div className="jobs-by-category">
                {/* Venue Jobs */}
                {jobsByCategory[JobCategory.VENUE] && jobsByCategory[JobCategory.VENUE].length > 0 && (
                <div className="job-category">
                  <h4 className="category-title">🎸 Venue Jobs</h4>
                  <p className="category-desc">Work at the venues you dream of playing</p>
                  <div className="jobs-grid">
                    {jobsByCategory[JobCategory.VENUE].map(job => (
                      <JobCard key={job.id} job={job} onTake={handleTakeJob} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Corporate Jobs */}
              {jobsByCategory[JobCategory.CORPORATE] && jobsByCategory[JobCategory.CORPORATE].length > 0 && (
                <div className="job-category">
                  <h4 className="category-title">💼 Corporate Jobs</h4>
                  <p className="category-desc">Sell your soul for rent money</p>
                  <div className="jobs-grid">
                    {jobsByCategory[JobCategory.CORPORATE].map(job => (
                      <JobCard key={job.id} job={job} onTake={handleTakeJob} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Community Jobs */}
              {jobsByCategory[JobCategory.COMMUNITY] && jobsByCategory[JobCategory.COMMUNITY].length > 0 && (
                <div className="job-category">
                  <h4 className="category-title">🤝 Community Jobs</h4>
                  <p className="category-desc">Build the scene while staying true</p>
                  <div className="jobs-grid">
                    {jobsByCategory[JobCategory.COMMUNITY].map(job => (
                      <JobCard key={job.id} job={job} onTake={handleTakeJob} />
                    ))}
                  </div>
                </div>
              )}
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stress Warning */}
      {stress > 80 && (
        <motion.div 
          className="stress-warning"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="warning-icon">⚠️</span>
          <span>Your stress is dangerously high! Consider quitting your day job.</span>
        </motion.div>
      )}
      
      {/* Motivational Quote */}
      {!currentJob && (
        <motion.div
          className="motivational-quote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>"The only way to do great work is to love what you do... or starve trying."</p>
          <span>- Every Broke Musician Ever</span>
        </motion.div>
      )}

      <style jsx>{`
        .day-job-view {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .view-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .view-title {
          font-size: 2rem;
          font-weight: 900;
          color: var(--punk-magenta);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .view-subtitle {
          color: var(--text-secondary);
          margin-top: 8px;
          font-style: italic;
        }

        .current-job-card {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .job-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .quit-button {
          padding: 8px 16px;
          background: var(--danger-red);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .quit-button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .job-description {
          color: var(--text-secondary);
          margin-bottom: 20px;
          font-size: 1.1rem;
        }

        .job-effects {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .effect {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          font-weight: 600;
        }

        .effect.positive {
          border: 1px solid var(--success-green);
          color: var(--success-green);
        }

        .effect.negative {
          border: 1px solid var(--danger-red);
          color: var(--danger-red);
        }

        .effect-icon {
          font-size: 1.2rem;
        }

        .job-flavor {
          font-style: italic;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 12px;
          border-radius: 8px;
          margin: 0;
        }

        .no-job {
          text-align: center;
          padding: 40px 20px;
        }

        .no-job h3 {
          font-size: 1.5rem;
          color: var(--punk-magenta);
          margin-bottom: 12px;
        }

        .no-job p {
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .find-job-button {
          padding: 12px 24px;
          background: var(--punk-magenta);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all var(--transition-base);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .find-job-button:hover {
          background: var(--metal-red);
          transform: translateY(-2px);
        }

        .job-listings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .job-listings {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
          max-height: 80vh;
          max-width: 800px;
          width: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .listings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .listings-header h3 {
          font-size: 1.2rem;
          color: var(--text-primary);
          margin: 0;
        }

        .close-button {
          width: 32px;
          height: 32px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .close-button:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .jobs-by-category {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .job-category {
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 16px;
        }
        
        .category-title {
          font-size: 1.2rem;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .category-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0 0 16px 0;
          font-style: italic;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .job-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .job-card:hover {
          border-color: var(--punk-magenta);
          background: var(--bg-hover);
        }

        .job-card h4 {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .job-location {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 4px 0 8px 0;
        }
        
        .job-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .job-stats {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .stat {
          font-size: 0.85rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .stat.positive {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-green);
        }

        .stat.negative {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-red);
        }

        .requirements {
          margin-bottom: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .requirements span {
          font-size: 0.8rem;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .requirements .met {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-green);
        }

        .requirements .unmet {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-red);
        }

        .take-job-button {
          width: 100%;
          padding: 10px;
          background: var(--punk-magenta);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .take-job-button:hover:not(:disabled) {
          background: var(--metal-red);
        }

        .take-job-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stress-warning {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger-red);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
        }

        .warning-icon {
          font-size: 1.5rem;
        }
        
        .motivational-quote {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-default);
        }
        
        .motivational-quote p {
          font-size: 1.1rem;
          font-style: italic;
          color: var(--text-secondary);
          margin: 0 0 8px 0;
        }
        
        .motivational-quote span {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .no-jobs-available {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .no-jobs-available p {
          margin: 0 0 12px;
        }

        .no-jobs-available .hint {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .day-job-view {
            padding: 16px;
          }

          .job-listings-overlay {
            padding: 0;
          }

          .job-listings {
            border-radius: 0;
            max-height: 100vh;
            height: 100%;
            padding: 16px;
          }

          .jobs-grid {
            grid-template-columns: 1fr;
          }
          
          .job-effects {
            flex-direction: column;
            gap: 8px;
          }
          
          .effect {
            width: 100%;
            justify-content: space-between;
          }
          
          .view-title {
            font-size: 1.5rem;
          }
          
          .job-title {
            font-size: 1.2rem;
          }

          .listings-header h3 {
            font-size: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .job-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .quit-button {
            width: 100%;
          }
          
          .job-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};