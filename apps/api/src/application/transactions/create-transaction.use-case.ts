import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionType } from '@sar/shared';
import { TransactionEntity } from '../../domain/entities';
import {
  CreateTransactionInput,
  IStockRepository,
  ITransactionRepository,
} from '../../domain/repositories';
import { computePosition } from '../../domain/services/position-calculator';
import { resolveCurrency, resolveYahooSymbol } from '../../domain/services/stock-symbol.resolver';

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
