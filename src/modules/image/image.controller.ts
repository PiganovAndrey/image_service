import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseInterceptors,
    Inject,
    LoggerService,
    UploadedFiles,
    Req,
    HttpException,
    HttpStatus,
    Query,
    UsePipes,
    UseGuards
} from '@nestjs/common';
import { ImageService } from './image.service';
import { LoggingInterceptor } from 'src/common/interceptors/LoggingInterceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { FilesInterceptor } from '@nestjs/platform-express';
import ITokenData from 'src/common/interfaces/token.data';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enums';
import { Quality } from 'src/common/enums/quality.enum';
import { DeleteImageDto } from './dto/delete-image.dto';
import { QualityDto } from './dto/queryKey.dto';
import { OrderByCreatedAtDto } from './dto/orderByCreatedAt.dto';
import { FilesValidationPipe } from 'src/common/pipes/FilesValidationPipe';
import { SessionGuard } from 'src/guards/session.guard';
import { ApiOperation, ApiParam, ApiResponse, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Image')
@Controller()
@UseInterceptors(LoggingInterceptor)
export class ImageController {
    constructor(
        private readonly imageService: ImageService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService
    ) {}

    @Post('/upload')
    @ApiOperation({ summary: 'Загрузка изображений' })
    @ApiResponse({ status: 200, description: 'Изображения успешно загружены' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @UseGuards(SessionGuard)
    @Roles(Role.ALL)
    @UseInterceptors(FilesInterceptor('images'))
    @UsePipes(FilesValidationPipe)
    upload(@UploadedFiles() files: Array<Express.Multer.File>, @Req() req: Request) {
        try {
            const session: ITokenData = req['sessionData'];
            return this.imageService.uploadImages(session.userUid, files);
        } catch (error) {
            this.logger.error(`Error in imageController:\n${error}`);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/')
    @ApiOperation({ summary: 'Получение всех изображений' })
    @ApiResponse({ status: 200, description: 'Возвращает список всех изображений' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @UseGuards(SessionGuard)
    @Roles(Role.ADMIN)
    getAllImages() {
        try {
            return this.imageService.getAllImages();
        } catch (error) {
            this.logger.error(`Error in imageController:\n${error}`);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/user')
    @ApiOperation({ summary: 'Получение изображений пользователя' })
    @ApiResponse({ status: 200, description: 'Возвращает список изображений пользователя' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @UseGuards(SessionGuard)
    @Roles(Role.ALL)
    getImagesByUser(@Req() req: Request, @Query() query: OrderByCreatedAtDto) {
        try {
            const user: ITokenData = req['sessionData'];
            const { created_at } = query;
            return this.imageService.getImagesByUserUid(user.userUid, created_at);
        } catch (error) {
            this.logger.error(`Error in imageController:\n${error}`);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/:user_uid')
    @ApiOperation({ summary: 'Получение изображений пользователя по UID' })
    @ApiParam({ name: 'user_uid', description: 'UID пользователя', type: String })
    @ApiResponse({ status: 200, description: 'Возвращает список изображений пользователя' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @UseGuards(SessionGuard)
    @Roles(Role.ALL)
    getImagesByUserUid(@Param('user_uid') user_uid: string, @Query() query: OrderByCreatedAtDto) {
        try {
            return this.imageService.getImagesByUserUid(user_uid, query.created_at);
        } catch (error) {
            this.logger.error(`Error in imageController:\n${error}`);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/photo/:key')
    @ApiOperation({ summary: 'Получение изображения по ключу' })
    @ApiParam({ name: 'key', description: 'Ключ изображения', type: String })
    @ApiResponse({ status: 200, description: 'Возвращает изображение по ключу' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @ApiQuery({ name: 'quality', description: 'Качество изображения', required: false, enum: Quality })
    @UseGuards(SessionGuard)
    @Roles(Role.ALL)
    getImageByKey(@Param('key') key: string, @Query() query: QualityDto) {
        try {
            const { quality } = query;
            return this.imageService.getImageByKey(key, quality || Quality.High);
        } catch (error) {
            this.logger.error(`Error in imageController:\n${error}`);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete('/')
    @ApiOperation({ summary: 'Удаление изображения по ключу' })
    @ApiResponse({ status: 200, description: 'Изображение успешно удалено' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @ApiBody({ type: DeleteImageDto, description: 'DTO для удаления изображения' })
    @UseGuards(SessionGuard)
    @Roles(Role.ALL)
    deleteImageByKey(@Body() dto: DeleteImageDto, @Req() req: Request) {
        try {
            const user: ITokenData = req['sessionData'];
            return this.imageService.deleteImageByKey(dto.keyLow, dto.keyHigh, user.userUid);
        } catch (error) {
            this.logger.error(`Error in imageController:\n${error}`);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
