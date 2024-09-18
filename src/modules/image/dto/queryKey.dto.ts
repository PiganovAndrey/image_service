import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { OrderByCreatedAt } from '../types/OrderByCreatedAt.type';

export class QualityDto {
    @ApiProperty({
        description: 'The quality level of the item',
        example: 'high',
        enum: ['high', 'low'],
        enumName: 'QualityLevel'
    })
    @IsNotEmpty()
    @IsIn(['high', 'low'], { message: "Quality must be either 'high' or 'low'" })
    quality: OrderByCreatedAt;
}
