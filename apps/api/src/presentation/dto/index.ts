import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Market, TransactionType } from '@sar/shared';

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}

export class CreateTransactionDto {
  @IsString()
  stockSymbol!: string;

  @IsEnum(Market)
  market!: Market;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsNumber()
  @Min(0.000001)
  price!: number;

  @IsString()
  tradedAt!: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
