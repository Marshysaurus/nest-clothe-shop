import { Type } from 'class-transformer';
import { IsPositive, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
