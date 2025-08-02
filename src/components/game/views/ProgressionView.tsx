// Re-export the fixed ProgressionView component
export { ProgressionView } from './ProgressionViewFixed';
  const { fans, reputation, showHistory } = useGameStore();
  const [selectedChoice, setSelectedChoice] = useState<PathChoice | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const isUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length
  });
  
  const progression = progressionPathSystem.getProgression();
  const availableChoices = progressionPathSystem.getAvailableChoices();
  const currentEffects = progressionPathSystem.getCurrentEffects();
  
  const handlePathChoice = (path: ProgressionPath) => {
    if (progressionPathSystem.choosePath(path)) {
      haptics.success();
    }
  };
  
  const handleChoiceClick = (choice: PathChoice) => {
    setSelectedChoice(choice);
    setShowConfirmation(true);
    haptics.light();
  };
  
  const confirmChoice = () => {
    if (selectedChoice && progressionPathSystem.makeChoice(selectedChoice.id)) {
      haptics.success();
      setShowConfirmation(false);
      setSelectedChoice(null);
    }
  };
  
  // Show unlock requirements if not unlocked
  if (!isUnlocked) {
    const requirements = progressionPathSystem.getUnlockRequirements({
      fans,
      reputation,
      totalShows: showHistory.length
    });
    
    return (
      <div className="progression-view locked">
        <div className="unlock-container">
          <h2>🔒 Progression Paths Locked</h2>
          <p>{requirements.description}</p>
          
          <div className="unlock-requirements">
            {requirements.requirements.map(req => (
              <div key={req.name} className="requirement">
                <h3>{req.name}</h3>
                <p>{req.description}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min((req.current / req.required) * 100, 100)}%` }}
                  />
                </div>
                <span className="progress-text">
                  {req.current} / {req.required}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <style jsx>{`
          .progression-view.locked {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .unlock-container {
            background: var(--bg-secondary);
            border: 2px solid var(--border-default);
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            width: 100%;
          }
          
          .unlock-container h2 {
            color: var(--text-primary);
            margin: 0 0 16px;
            font-size: 24px;
          }
          
          .unlock-container > p {
            color: var(--text-secondary);
            margin: 0 0 32px;
            font-size: 16px;
          }
          
          .unlock-requirements {
            display: grid;
            gap: 24px;
          }
          
          .requirement {
            background: var(--bg-tertiary);
            border-radius: 8px;
            padding: 20px;
            text-align: left;
          }
          
          .requirement h3 {
            color: var(--punk-magenta);
            margin: 0 0 8px;
            font-size: 18px;
          }
          
          .requirement p {
            color: var(--text-secondary);
            margin: 0 0 12px;
            font-size: 14px;
          }
          
          .progress-bar {
            background: var(--bg-primary);
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 8px;
          }
          
          .progress-fill {
            background: linear-gradient(90deg, var(--punk-magenta) 0%, var(--metal-red) 100%);
            height: 100%;
            transition: width 0.3s ease;
          }
          
          .progress-text {
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 600;
          }
          
          @media (max-width: 768px) {
            .unlock-container {
              padding: 24px 16px;
            }
          }
        `}</style>
      </div>
    );
  }
  
  // Show path selection if no path chosen
  if (progression.currentPath === ProgressionPath.NONE) {
    return (
      <div className="progression-view path-selection">
        <div className="path-header">
          <h1>Choose Your Path</h1>
          <p>This decision will shape the future of your music scene</p>
        </div>
        
        <div className="path-options">
          <motion.div 
            className="path-card diy"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePathChoice(ProgressionPath.DIY_COLLECTIVE)}
          >
            <div className="path-icon">✊</div>
            <h2>DIY Collective</h2>
            <p className="path-tagline">For the scene, by the scene</p>
            
            <div className="path-benefits">
              <h3>Path Benefits:</h3>
              <ul>
                <li>Lower costs, stronger community</li>
                <li>Higher authenticity & reputation</li>
                <li>Unlock co-op venues & mutual aid</li>
                <li>All-ages shows & safer spaces</li>
              </ul>
            </div>
            
            <div className="path-drawbacks">
              <h3>Path Challenges:</h3>
              <ul>
                <li>Lower profits & growth caps</li>
                <li>Limited venue options</li>
                <li>Consensus decision-making</li>
                <li>Constant struggle against gentrification</li>
              </ul>
            </div>
            
            <p className="path-flavor">"Keep it real, keep it community"</p>
          </motion.div>
          
          <motion.div 
            className="path-card corporate"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePathChoice(ProgressionPath.CORPORATE)}
          >
            <div className="path-icon">💰</div>
            <h2>Corporate Circuit</h2>
            <p className="path-tagline">Music as a business</p>
            
            <div className="path-benefits">
              <h3>Path Benefits:</h3>
              <ul>
                <li>Higher profits & faster growth</li>
                <li>Professional venues & equipment</li>
                <li>Sponsorship opportunities</li>
                <li>Data-driven booking</li>
              </ul>
            </div>
            
            <div className="path-drawbacks">
              <h3>Path Challenges:</h3>
              <ul>
                <li>Loss of scene credibility</li>
                <li>Unhappy bands & fans</li>
                <li>Soulless optimization</li>
                <li>Becoming what you once hated</li>
              </ul>
            </div>
            
            <p className="path-flavor">"Sell out to sell out shows"</p>
          </motion.div>
        </div>
        
        <p className="path-warning">⚠️ This choice is permanent and will define your entire journey</p>
        
        <style jsx>{`
          .progression-view.path-selection {
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
            height: 100%;
            overflow-y: auto;
          }
          
          .path-header {
            text-align: center;
            margin-bottom: 32px;
          }
          
          .path-header h1 {
            color: var(--text-primary);
            margin: 0 0 8px;
            font-size: 32px;
            font-weight: 900;
          }
          
          .path-header p {
            color: var(--text-secondary);
            margin: 0;
            font-size: 18px;
          }
          
          .path-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 24px;
            margin-bottom: 24px;
          }
          
          .path-card {
            background: var(--bg-secondary);
            border: 3px solid var(--border-default);
            border-radius: 16px;
            padding: 32px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .path-card.diy {
            border-color: var(--metal-red);
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%);
          }
          
          .path-card.diy:hover {
            border-color: var(--punk-magenta);
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
          }
          
          .path-card.corporate {
            border-color: var(--info-purple);
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
          }
          
          .path-card.corporate:hover {
            border-color: var(--info-blue);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          
          .path-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .path-card h2 {
            color: var(--text-primary);
            margin: 0 0 8px;
            font-size: 28px;
            font-weight: 900;
          }
          
          .path-tagline {
            color: var(--text-secondary);
            margin: 0 0 24px;
            font-size: 16px;
            font-style: italic;
          }
          
          .path-benefits, .path-drawbacks {
            margin-bottom: 20px;
          }
          
          .path-benefits h3, .path-drawbacks h3 {
            color: var(--text-primary);
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 700;
          }
          
          .path-benefits ul, .path-drawbacks ul {
            margin: 0;
            padding-left: 20px;
          }
          
          .path-benefits li, .path-drawbacks li {
            color: var(--text-secondary);
            margin-bottom: 4px;
            font-size: 14px;
          }
          
          .path-benefits li {
            color: var(--success-green);
          }
          
          .path-drawbacks li {
            color: var(--danger-red);
          }
          
          .path-flavor {
            color: var(--text-muted);
            margin: 16px 0 0;
            font-style: italic;
            text-align: center;
            font-size: 14px;
          }
          
          .path-warning {
            text-align: center;
            color: var(--warning-amber);
            font-weight: 600;
            margin: 0;
          }
          
          @media (max-width: 900px) {
            .path-options {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 768px) {
            .path-card {
              padding: 24px 16px;
            }
            
            .path-icon {
              font-size: 36px;
            }
            
            .path-card h2 {
              font-size: 24px;
            }
          }
        `}</style>
      </div>
    );
  }
  
  // Show progression tree
  return (
    <div className="progression-view">
      <div className="progression-header">
        <h1 className={`path-title ${progression.currentPath.toLowerCase()}`}>
          {progression.currentPath === ProgressionPath.DIY_COLLECTIVE ? 'DIY Collective' : 'Corporate Circuit'}
        </h1>
        <p className="tier-indicator">Tier {progression.currentTier} of 5</p>
      </div>
      
      {/* Active Effects Summary */}
      <div className="effects-summary">
        <h3>Active Path Effects:</h3>
        <div className="effect-list">
          {currentEffects.modifiers.ticketPriceMultiplier !== 1 && (
            <span className="effect">
              Ticket Prices: {(currentEffects.modifiers.ticketPriceMultiplier * 100).toFixed(0)}%
            </span>
          )}
          {currentEffects.modifiers.bandHappinessModifier !== 0 && (
            <span className="effect">
              Band Happiness: {currentEffects.modifiers.bandHappinessModifier > 0 ? '+' : ''}{(currentEffects.modifiers.bandHappinessModifier * 100).toFixed(0)}%
            </span>
          )}
          {currentEffects.modifiers.venueRentMultiplier !== 1 && (
            <span className="effect">
              Venue Costs: {(currentEffects.modifiers.venueRentMultiplier * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      
      {/* Available Choices */}
      {availableChoices.length > 0 && (
        <div className="choices-section">
          <h2>Available Choices:</h2>
          <div className="choices-grid">
            {availableChoices.map(choice => (
              <motion.div 
                key={choice.id}
                className={`choice-card ${choice.permanent ? 'permanent' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChoiceClick(choice)}
              >
                <h3>{choice.name}</h3>
                <p className="choice-description">{choice.description}</p>
                {choice.permanent && <span className="permanent-badge">PERMANENT</span>}
                <p className="choice-flavor">"{choice.satiricalFlavor}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Choices */}
      {progression.unlockedChoices.length > 0 && (
        <div className="completed-section">
          <h2>Completed Choices:</h2>
          <div className="completed-list">
            {progression.unlockedChoices.map(choiceId => {
              const choice = availableChoices.find(c => c.id === choiceId);
              return choice ? (
                <div key={choiceId} className="completed-choice">
                  <span className="choice-name">{choice.name}</span>
                  <span className="choice-tier">Tier {choice.tier}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedChoice && (
          <motion.div 
            className="confirmation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div 
              className="confirmation-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>Confirm Choice</h2>
              <h3>{selectedChoice.name}</h3>
              <p>{selectedChoice.description}</p>
              
              {selectedChoice.permanent && (
                <p className="permanent-warning">
                  ⚠️ This choice is PERMANENT and cannot be undone!
                </p>
              )}
              
              {selectedChoice.conflicts && selectedChoice.conflicts.length > 0 && (
                <p className="conflict-warning">
                  ⚠️ This choice conflicts with other options
                </p>
              )}
              
              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm"
                  onClick={confirmChoice}
                >
                  Confirm Choice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        .progression-view {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
          height: 100%;
          overflow-y: auto;
        }
        
        .progression-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .path-title {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 900;
        }
        
        .path-title.diy_collective {
          color: var(--metal-red);
        }
        
        .path-title.corporate {
          color: var(--info-purple);
        }
        
        .tier-indicator {
          color: var(--text-secondary);
          margin: 0;
          font-size: 18px;
        }
        
        .effects-summary {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 32px;
        }
        
        .effects-summary h3 {
          color: var(--text-primary);
          margin: 0 0 12px;
          font-size: 16px;
        }
        
        .effect-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .effect {
          background: var(--bg-tertiary);
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .choices-section, .completed-section {
          margin-bottom: 32px;
        }
        
        .choices-section h2, .completed-section h2 {
          color: var(--text-primary);
          margin: 0 0 16px;
          font-size: 24px;
        }
        
        .choices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        
        .choice-card {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .choice-card:hover {
          border-color: var(--punk-magenta);
          transform: translateY(-2px);
        }
        
        .choice-card.permanent {
          border-color: var(--warning-amber);
        }
        
        .choice-card h3 {
          color: var(--text-primary);
          margin: 0 0 8px;
          font-size: 18px;
        }
        
        .choice-description {
          color: var(--text-secondary);
          margin: 0 0 12px;
          font-size: 14px;
        }
        
        .permanent-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--warning-amber);
          color: var(--bg-primary);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }
        
        .choice-flavor {
          color: var(--text-muted);
          margin: 0;
          font-style: italic;
          font-size: 13px;
        }
        
        .completed-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .completed-choice {
          background: var(--bg-secondary);
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .choice-name {
          color: var(--text-primary);
          font-weight: 600;
        }
        
        .choice-tier {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .confirmation-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .confirmation-modal {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
        }
        
        .confirmation-modal h2 {
          color: var(--text-primary);
          margin: 0 0 16px;
          font-size: 24px;
        }
        
        .confirmation-modal h3 {
          color: var(--punk-magenta);
          margin: 0 0 8px;
          font-size: 20px;
        }
        
        .confirmation-modal p {
          color: var(--text-secondary);
          margin: 0 0 16px;
        }
        
        .permanent-warning, .conflict-warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid var(--warning-amber);
          color: var(--warning-amber);
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .btn-cancel, .btn-confirm {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .btn-cancel:hover {
          background: var(--bg-hover);
        }
        
        .btn-confirm {
          background: var(--punk-magenta);
          color: white;
        }
        
        .btn-confirm:hover {
          background: var(--metal-red);
        }
        
        @media (max-width: 768px) {
          .progression-view {
            padding: 16px;
          }
          
          .path-title {
            font-size: 24px;
          }
          
          .choices-grid {
            grid-template-columns: 1fr;
          }
          
          .confirmation-modal {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  );
};