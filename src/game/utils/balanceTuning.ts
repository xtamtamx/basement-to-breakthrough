import { BALANCE_CONFIG } from '@game/config/balanceConfig';
import { devLog } from '@utils/devLogger';

/**
 * Balance tuning utilities for development and testing
 * These help analyze and adjust game balance
 */

export interface BalanceMetrics {
  averageShowRevenue: number;
  averageShowCost: number;
  profitMargin: number;
  survivalRate: number; // % of players reaching certain rounds
  averageStressPerRound: number;
  optimalTicketPrice: number;
}

export class BalanceTuner {
  private metrics: Map<number, BalanceMetrics> = new Map();

  // Simulate game economy at different rounds
  simulateEconomy(round: number): BalanceMetrics {
    const tier = this.getDifficultyTier(round);
    const multipliers = BALANCE_CONFIG.DIFFICULTY.MULTIPLIERS[tier];
    
    // Average show calculations
    const avgVenueRent = 300 * multipliers.COSTS; // Mid-tier venue
    const avgBandCost = 150 * multipliers.COSTS;
    const avgCapacity = 200;
    const avgAttendance = avgCapacity * 0.7; // 70% fill rate
    
    // Revenue calculations
    const optimalPrice = this.calculateOptimalTicketPrice(round);
    const ticketRevenue = avgAttendance * optimalPrice;
    const barRevenue = avgAttendance * BALANCE_CONFIG.ECONOMY.BAR_REVENUE_PER_PERSON;
    const totalRevenue = ticketRevenue + barRevenue;
    
    // Cost calculations
    const showCost = avgVenueRent + avgBandCost;
    const profitMargin = (totalRevenue - showCost) / totalRevenue;
    
    // Stress calculations
    const baseStress = BALANCE_CONFIG.PROGRESSION.STRESS.BASE_INCREASE_PER_TURN;
    const showStress = BALANCE_CONFIG.PROGRESSION.STRESS.SHOW_STRESS;
    const avgStressPerRound = baseStress + showStress;
    
    return {
      averageShowRevenue: totalRevenue,
      averageShowCost: showCost,
      profitMargin,
      survivalRate: this.calculateSurvivalRate(round),
      averageStressPerRound: avgStressPerRound,
      optimalTicketPrice: optimalPrice
    };
  }

  // Calculate optimal ticket price for a given round
  calculateOptimalTicketPrice(round: number): number {
    const tier = this.getDifficultyTier(round);
    const expectations = BALANCE_CONFIG.DIFFICULTY.MULTIPLIERS[tier].EXPECTATIONS;
    
    // Base optimal price adjusted for difficulty
    const basePrice = BALANCE_CONFIG.ECONOMY.TICKETS.SWEET_SPOT;
    const adjustedPrice = basePrice * (1 + (round / 100)); // Gradual increase
    
    // Account for fan expectations
    const finalPrice = adjustedPrice / Math.sqrt(expectations);
    
    return Math.floor(Math.max(
      BALANCE_CONFIG.ECONOMY.TICKETS.MIN_PRICE,
      Math.min(BALANCE_CONFIG.ECONOMY.TICKETS.MAX_PRICE, finalPrice)
    ));
  }

  // Estimate survival rate at different rounds
  calculateSurvivalRate(round: number): number {
    // Based on difficulty curve, estimate % of players surviving
    if (round <= 10) return 0.9; // 90% make it past tutorial
    if (round <= 25) return 0.7; // 70% reach medium difficulty
    if (round <= 50) return 0.4; // 40% reach hard difficulty
    if (round <= 100) return 0.1; // 10% reach extreme
    return 0.01; // 1% go beyond
  }

  // Get difficulty tier helper
  private getDifficultyTier(round: number): keyof typeof BALANCE_CONFIG.DIFFICULTY.MULTIPLIERS {
    if (round <= 10) return 'EASY';
    if (round <= 25) return 'MEDIUM';
    if (round <= 50) return 'HARD';
    if (round <= 100) return 'EXTREME';
    return 'ENDLESS';
  }

  // Analyze balance for a range of rounds
  analyzeBalance(startRound: number = 1, endRound: number = 100, step: number = 10) {
    const analysis: Record<number, BalanceMetrics> = {};
    
    for (let round = startRound; round <= endRound; round += step) {
      analysis[round] = this.simulateEconomy(round);
    }
    
    return analysis;
  }

  // Generate balance report
  generateBalanceReport() {
    const analysis = this.analyzeBalance();
    
    devLog.log('=== GAME BALANCE REPORT ===');
    devLog.log('Round | Revenue | Cost | Profit% | Survival% | Optimal Price');
    devLog.log('------|---------|------|---------|-----------|-------------');
    
    Object.entries(analysis).forEach(([round, metrics]) => {
      devLog.log(
        `${round.padStart(5)} | ` +
        `$${Math.floor(metrics.averageShowRevenue).toString().padStart(6)} | ` +
        `$${Math.floor(metrics.averageShowCost).toString().padStart(4)} | ` +
        `${(metrics.profitMargin * 100).toFixed(1).padStart(6)}% | ` +
        `${(metrics.survivalRate * 100).toFixed(0).padStart(8)}% | ` +
        `$${metrics.optimalTicketPrice.toString().padStart(12)}`
      );
    });
    
    // Recommendations
    devLog.log('\n=== BALANCE RECOMMENDATIONS ===');
    
    // Check if early game is too hard
    const round10 = analysis[10];
    if (round10 && round10.profitMargin < 0.2) {
      devLog.warn('Early game may be too difficult - profit margin below 20%');
    }
    
    // Check if late game scales properly
    const round50 = analysis[50];
    if (round50 && round50.profitMargin > 0.5) {
      devLog.warn('Late game may be too easy - profit margin above 50%');
    }
    
    // Check survival curve
    const round25 = analysis[25];
    if (round25 && round25.survivalRate < 0.5) {
      devLog.warn('Difficulty spike too harsh - less than 50% reach round 25');
    }
  }

  // Test specific scenarios
  testScenario(scenario: 'perfect_show' | 'average_show' | 'disaster_show', round: number) {
    const metrics = this.simulateEconomy(round);
    
    switch (scenario) {
      case 'perfect_show':
        return {
          revenue: metrics.averageShowRevenue * 1.5, // Synergy bonuses
          cost: metrics.averageShowCost,
          netProfit: (metrics.averageShowRevenue * 1.5) - metrics.averageShowCost,
          reputationGain: BALANCE_CONFIG.PROGRESSION.REPUTATION.GREAT_SHOW,
          stressGain: BALANCE_CONFIG.PROGRESSION.STRESS.SHOW_STRESS
        };
        
      case 'average_show':
        return {
          revenue: metrics.averageShowRevenue,
          cost: metrics.averageShowCost,
          netProfit: metrics.averageShowRevenue - metrics.averageShowCost,
          reputationGain: BALANCE_CONFIG.PROGRESSION.REPUTATION.AVERAGE_SHOW,
          stressGain: BALANCE_CONFIG.PROGRESSION.STRESS.SHOW_STRESS
        };
        
      case 'disaster_show':
        return {
          revenue: metrics.averageShowRevenue * 0.3,
          cost: metrics.averageShowCost,
          netProfit: (metrics.averageShowRevenue * 0.3) - metrics.averageShowCost,
          reputationGain: BALANCE_CONFIG.PROGRESSION.REPUTATION.TERRIBLE_SHOW,
          stressGain: BALANCE_CONFIG.PROGRESSION.STRESS.FAILED_SHOW_STRESS
        };
    }
  }
}

// Export singleton for development use
export const balanceTuner = new BalanceTuner();