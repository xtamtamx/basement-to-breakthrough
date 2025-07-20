import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';

interface Transaction {
  id: string;
  type: 'money' | 'reputation' | 'fans';
  amount: number;
  reason: string;
  timestamp: number;
}

export const ResourceManager: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { money, reputation, fans, addMoney, addReputation, addFans } = useGameStore();

  const addTransaction = (type: Transaction['type'], amount: number, reason: string) => {
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      type,
      amount,
      reason,
      timestamp: Date.now(),
    };

    setTransactions(prev => [transaction, ...prev].slice(0, 20)); // Keep last 20

    // Apply the transaction
    switch (type) {
      case 'money':
        addMoney(amount);
        break;
      case 'reputation':
        addReputation(amount);
        break;
      case 'fans':
        addFans(amount);
        break;
    }

    // Haptic feedback
    if (amount > 0) {
      haptics.success();
    } else if (amount < 0) {
      haptics.light();
    }
  };

  const quickActions = [
    { label: 'Pay Rent', cost: -50, type: 'money' as const, reason: 'Monthly venue rent' },
    { label: 'Buy Equipment', cost: -100, type: 'money' as const, reason: 'New gear' },
    { label: 'Promote Show', cost: -25, type: 'money' as const, reason: 'Show promotion' },
  ];

  return (
    <div className="space-y-4">
      {/* Current Resources */}
      <div className="bg-metal-900 rounded-lg p-4">
        <h3 className="font-bold mb-3">Resources</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">${money}</p>
            <p className="text-xs text-metal-400">Cash</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-punk-400">{reputation}</p>
            <p className="text-xs text-metal-400">Rep</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{fans}</p>
            <p className="text-xs text-metal-400">Fans</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm">Quick Actions</h4>
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              if (action.type === 'money' && money + action.cost < 0) {
                haptics.error();
                return;
              }
              addTransaction(action.type, action.cost, action.reason);
            }}
            disabled={action.type === 'money' && money + action.cost < 0}
            className={`w-full flex justify-between items-center p-3 rounded-lg transition-colors ${
              action.type === 'money' && money + action.cost < 0
                ? 'bg-metal-800 text-metal-600 cursor-not-allowed'
                : 'bg-metal-800 hover:bg-metal-700'
            }`}
          >
            <span>{action.label}</span>
            <span className={action.cost < 0 ? 'text-red-400' : 'text-green-400'}>
              {action.cost > 0 ? '+' : ''}{action.cost}
            </span>
          </button>
        ))}
      </div>

      {/* Transaction History */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full text-left font-bold text-sm mb-2 flex justify-between items-center"
        >
          <span>Transaction History</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${showHistory ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showHistory && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-xs text-metal-500 text-center py-4">No transactions yet</p>
            ) : (
              transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center p-2 bg-metal-900 rounded text-xs"
                >
                  <span className="text-metal-400">{tx.reason}</span>
                  <span className={`font-bold ${
                    tx.amount > 0 
                      ? tx.type === 'money' ? 'text-green-400' 
                        : tx.type === 'reputation' ? 'text-punk-400' 
                        : 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};