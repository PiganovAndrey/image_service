import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { OrderByCreatedAt } from '../types/OrderByCreatedAt.type';

export class OrderByCreatedAtDto {
    @ApiPropertyOptional({
        description: "Поле для указания порядка сортировки. Допустимые значения: 'asc' или 'desc'.",
        example: 'asc',
        pattern: '^(asc|desc)$',
        type: String
    })
    @IsOptional({ message: 'Поле created_at не обязательно для заполнения' })
    @IsString({ message: 'Значение поля created_at должно быть строкой' })
    @Matches(/^(asc|desc)$/, {
        message: "Значение поля 'created_at' должно быть либо 'asc', либо 'desc'"
    })
    created_at?: OrderByCreatedAt;
}
