import React, { useState, useEffect } from 'react';
import { balanceTuner } from '@game/utils/balanceTuning';
import { BALANCE_CONFIG } from '@game/config/balanceConfig';
import { AccessibleButton } from '@components/ui/AccessibleButton';

export const BalanceTester: React.FC = () => {
  const [selectedRound, setSelectedRound] = useState(1);
  const [analysis, setAnalysis] = useState<ReturnType<typeof balanceTuner.simulateEconomy> | null>(null);
  const [scenarioResults, setScenarioResults] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const metrics = balanceTuner.simulateEconomy(selectedRound);
    setAnalysis(metrics);
  }, [selectedRound]);
  
  const testScenario = (scenario: 'perfect_show' | 'average_show' | 'disaster_show') => {
    const result = balanceTuner.testScenario(scenario, selectedRound);
    setScenarioResults(prev => ({ ...prev, [scenario]: result }));
  };
  
  const generateReport = () => {
    balanceTuner.generateBalanceReport();
    alert('Check console for balance report');
  };
  
  if (!analysis) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white p-8 overflow-auto">
      <h1 className="text-3xl font-bold mb-8">Game Balance Tester</h1>
      
      {/* Round Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Test Round: {selectedRound}
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={selectedRound}
          onChange={(e) => setSelectedRound(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Round 1</span>
          <span>Round 25</span>
          <span>Round 50</span>
          <span>Round 75</span>
          <span>Round 100</span>
        </div>
      </div>
      
      {/* Current Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Avg Show Revenue"
          value={`$${Math.floor(analysis.averageShowRevenue)}`}
          color="text-green-400"
        />
        <MetricCard
          label="Avg Show Cost"
          value={`$${Math.floor(analysis.averageShowCost)}`}
          color="text-red-400"
        />
        <MetricCard
          label="Profit Margin"
          value={`${(analysis.profitMargin * 100).toFixed(1)}%`}
          color={analysis.profitMargin > 0 ? "text-green-400" : "text-red-400"}
        />
        <MetricCard
          label="Survival Rate"
          value={`${(analysis.survivalRate * 100).toFixed(0)}%`}
          color="text-blue-400"
        />
        <MetricCard
          label="Optimal Ticket Price"
          value={`$${analysis.optimalTicketPrice}`}
          color="text-purple-400"
        />
        <MetricCard
          label="Avg Stress/Round"
          value={`+${analysis.averageStressPerRound}`}
          color="text-yellow-400"
        />
      </div>
      
      {/* Scenario Testing */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Scenario Testing</h2>
        <div className="flex gap-4 mb-4">
          <AccessibleButton onClick={() => testScenario('perfect_show')}>
            Perfect Show
          </AccessibleButton>
          <AccessibleButton onClick={() => testScenario('average_show')}>
            Average Show
          </AccessibleButton>
          <AccessibleButton onClick={() => testScenario('disaster_show')}>
            Disaster Show
          </AccessibleButton>
        </div>
        
        {/* Scenario Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(scenarioResults).map(([scenario, result]) => (
            <div key={scenario} className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2 capitalize">
                {scenario.replace('_', ' ')}
              </h3>
              <div className="space-y-1 text-sm">
                <div>Revenue: ${Math.floor(result.revenue)}</div>
                <div>Cost: ${Math.floor(result.cost)}</div>
                <div className={result.netProfit > 0 ? 'text-green-400' : 'text-red-400'}>
                  Net: ${Math.floor(result.netProfit)}
                </div>
                <div>Rep: {result.reputationGain > 0 ? '+' : ''}{result.reputationGain}</div>
                <div>Stress: +{result.stressGain}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Difficulty Progression */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Difficulty Progression</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-2">Tier</th>
                <th className="pb-2">Rounds</th>
                <th className="pb-2">Cost Multi</th>
                <th className="pb-2">Expect Multi</th>
                <th className="pb-2">Risk Multi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(BALANCE_CONFIG.DIFFICULTY.MULTIPLIERS).map(([tier, mults]) => (
                <tr key={tier} className="border-b border-gray-700/50">
                  <td className="py-2">{tier}</td>
                  <td className="py-2">
                    {tier === 'EASY' && '1-10'}
                    {tier === 'MEDIUM' && '11-25'}
                    {tier === 'HARD' && '26-50'}
                    {tier === 'EXTREME' && '51-100'}
                    {tier === 'ENDLESS' && '101+'}
                  </td>
                  <td className="py-2">{mults.COSTS}x</td>
                  <td className="py-2">{mults.EXPECTATIONS}x</td>
                  <td className="py-2">{mults.RISKS}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <AccessibleButton onClick={generateReport} variant="primary">
          Generate Full Report (Console)
        </AccessibleButton>
        <AccessibleButton 
          onClick={() => window.location.href = '/'} 
          variant="secondary"
        >
          Back to Game
        </AccessibleButton>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; color?: string }> = ({ 
  label, 
  value, 
  color = "text-white" 
}) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);