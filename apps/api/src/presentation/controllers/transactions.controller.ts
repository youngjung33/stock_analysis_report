import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionType } from '@sar/shared';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  ListTransactionsUseCase,
} from '../../application/transactions/transaction.use-cases';
import { CreateTransactionDto } from '../dto';
import { AuthUser, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly createUseCase: CreateTransactionUseCase,
    private readonly listUseCase: ListTransactionsUseCase,
    private readonly deleteUseCase: DeleteTransactionUseCase,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.createUseCase.execute({
      userId: user.userId,
      stockSymbol: dto.stockSymbol,
      market: dto.market,
      name: dto.name,
      type: dto.type,
      quantity: dto.quantity,
      price: dto.price,
      tradedAt: new Date(dto.tradedAt),
      memo: dto.memo,
    });
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('stockId') stockId?: string,
    @Query('type') type?: TransactionType,
  ) {
    return this.listUseCase.execute(user.userId, { stockId, type });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteUseCase.execute(user.userId, id);
    return { success: true };
  }
}
