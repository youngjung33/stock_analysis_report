import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Market, TransactionType } from '@sar/shared';
import {
  CreateTransactionInput,
  IStockRepository,
  ITransactionRepository,
} from '../../domain/repositories';
import { TransactionEntity } from '../../domain/entities';

function resolveYahooSymbol(symbol: string, market: Market): string | null {
  if (market === Market.US) return symbol.toUpperCase();
  const code = symbol.replace(/\.(KS|KQ)$/i, '');
  if (symbol.toUpperCase().endsWith('.KQ')) return `${code}.KQ`;
  return `${code}.KS`;
}

function resolveCurrency(market: Market): string {
  return market === Market.KR ? 'KRW' : 'USD';
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionEntity> {
    if (input.quantity <= 0 || input.price <= 0) {
      throw new BadRequestException('Quantity and price must be positive');
    }

    let stock = await this.stockRepo.findBySymbolAndMarket(
      input.stockSymbol.toUpperCase(),
      input.market,
    );

    if (!stock) {
      stock = await this.stockRepo.create({
        symbol: input.stockSymbol.toUpperCase(),
        name: input.name ?? input.stockSymbol.toUpperCase(),
        market: input.market,
        currency: resolveCurrency(input.market),
        yahooSymbol: resolveYahooSymbol(input.stockSymbol, input.market),
      });
    }

    if (input.type === TransactionType.SELL) {
      const existing = await this.transactionRepo.findByUserAndStock(input.userId, stock.id);
      const { quantity: held } = computePosition(existing);
      if (input.quantity > held) {
        throw new BadRequestException(`Insufficient holdings. Current: ${held}`);
      }
    }

    return this.transactionRepo.create({
      userId: input.userId,
      stockId: stock.id,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
    });
  }
}

@Injectable()
export class ListTransactionsUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  execute(userId: string, filters?: { stockId?: string; type?: TransactionType }) {
    return this.transactionRepo.findByUser(userId, filters);
  }
}

@Injectable()
export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepo: ITransactionRepository) {}

  async execute(userId: string, transactionId: string): Promise<void> {
    const tx = await this.transactionRepo.findById(transactionId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }
    await this.transactionRepo.delete(transactionId);
  }
}

export interface PositionState {
  quantity: number;
  averageCost: number;
  realizedPnl: number;
  costBasis: number;
}

export function computePosition(
  transactions: { type: TransactionType; quantity: number; price: number; tradedAt: Date }[],
): PositionState {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
  );

  let quantity = 0;
  let totalCost = 0;
  let realizedPnl = 0;

  for (const tx of sorted) {
    if (tx.type === TransactionType.BUY) {
      totalCost += tx.quantity * tx.price;
      quantity += tx.quantity;
    } else {
      if (tx.quantity > quantity) {
        throw new BadRequestException('Invalid sell quantity in history');
      }
      const avgCost = quantity > 0 ? totalCost / quantity : 0;
      realizedPnl += (tx.price - avgCost) * tx.quantity;
      totalCost -= avgCost * tx.quantity;
      quantity -= tx.quantity;
    }
  }

  const averageCost = quantity > 0 ? totalCost / quantity : 0;
  return { quantity, averageCost, realizedPnl, costBasis: totalCost };
}
