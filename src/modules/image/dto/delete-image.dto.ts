import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteImageDto {
    @ApiProperty({
        description: 'Ключ изображения (нижний предел)',
        example: 'imageKeyLow123'
    })
    @IsString()
    @IsNotEmpty()
    keyLow: string;

    @ApiProperty({
        description: 'Ключ изображения (верхний предел)',
        example: 'imageKeyHigh456'
    })
    @IsString()
    @IsNotEmpty()
    keyHigh: string;
}
