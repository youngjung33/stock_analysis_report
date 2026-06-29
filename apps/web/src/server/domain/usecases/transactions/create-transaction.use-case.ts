import { TransactionType } from '@sar/shared';
import { TransactionEntity } from '../../entities';
import {
  CreateTransactionInput,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';
import { resolveCurrency, resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { ValidationError } from '../../errors/domain.errors';

export class CreateTransactionUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionEntity> {
    if (input.quantity <= 0 || input.price <= 0) {
      throw new ValidationError('Quantity and price must be positive');
    }

    if (!input.name?.trim()) {
      throw new ValidationError('종목을 검색해서 선택해 주세요.');
    }

    const symbol = input.stockSymbol.toUpperCase();

    let stock = await this.stockRepo.findBySymbolAndMarket(symbol, input.market);

    if (!stock) {
      stock = await this.stockRepo.create({
        symbol,
        name: input.name.trim(),
        market: input.market,
        currency: resolveCurrency(input.market),
        yahooSymbol:
          input.yahooSymbol ?? resolveYahooSymbol(input.stockSymbol, input.market),
      });
    }

    if (input.type === TransactionType.SELL) {
      const existing = await this.transactionRepo.findByUserAndStock(input.userId, stock.id);
      const held = computePosition(existing).quantity;
      if (input.quantity > held) {
        throw new ValidationError(`Insufficient holdings. Current: ${held}`);
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
