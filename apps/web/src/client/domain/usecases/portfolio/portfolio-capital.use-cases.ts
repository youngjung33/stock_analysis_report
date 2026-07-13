import { CashLedgerType } from '@sar/shared';
import { ICashRepository, IPortfolioCapitalRepository } from '../../repositories';

export class RecordCashEntryUseCase {
  constructor(private readonly repo: ICashRepository) {}

  execute(input: {
    currency: 'KRW' | 'USD';
    type: CashLedgerType;
    amount: number;
    memo?: string;
  }) {
    return this.repo.recordEntry(input);
  }
}

export class GetCashSummaryUseCase {
  constructor(private readonly repo: ICashRepository) {}

  execute() {
    return this.repo.getSummary();
  }
}

export class GetPortfolioPreferencesUseCase {
  constructor(private readonly repo: IPortfolioCapitalRepository) {}

  execute() {
    return this.repo.getPreferences();
  }
}

export class UpdatePortfolioPreferencesUseCase {
  constructor(private readonly repo: IPortfolioCapitalRepository) {}

  execute(prefs: {
    targetKrPercent: number;
    targetUsPercent: number;
    maxSingleWeightPercent: number;
  }) {
    return this.repo.updatePreferences(prefs);
  }
}

export class GetPortfolioSimulationUseCase {
  constructor(private readonly repo: IPortfolioCapitalRepository) {}

  execute() {
    return this.repo.getSimulation();
  }
}
