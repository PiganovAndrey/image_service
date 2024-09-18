import { HttpException, HttpStatus, Inject, Injectable, LoggerService, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DatabaseService } from '../database/database.service';
import { getExtension } from 'src/utils/image.hash';
import sha256 from 'sha256';
import compressImage from 'src/utils/compressImage';
import { bucketName, s3Client } from 'src/config/s3';
import { Upload } from '@aws-sdk/lib-storage';
import IQuality from 'src/common/interfaces/IQuality';
import { OrderByCreatedAt } from './types/OrderByCreatedAt.type';
import { DeleteObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { images } from '@prisma/client';
import { SuccessResponse } from 'src/common/response/success.response';
import md5 from 'md5';
@Injectable()
export class ImageService {
    constructor(
        private readonly prisma: DatabaseService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService
    ) {}

    async uploadImages(user_uid: string, files: Express.Multer.File[]) {
        try {
            this.logger.log('Starting uploadImages process...');
            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.heic', '.webp'];
            const result = [];
            for (let file of files) {
                const extension = getExtension(file.originalname);
                this.logger.log(`Processing file: ${file.originalname}, Extension: ${extension}`);
                if (!allowedExtensions.includes(extension)) {
                    this.logger.warn(`File format not allowed: ${extension}`);
                    throw new HttpException('Данный формат файла нельзя загрузить', HttpStatus.BAD_REQUEST);
                }
                const bufferSha = sha256(file.buffer.toString());
                const bufferMd5 = md5(file.buffer.toString());

                const hashImage = await this.prisma.images.findFirst({ where: { sha256: bufferSha, md5: bufferMd5 } });

                if (hashImage) {
                    const newImage = await this.prisma.images.create({
                        data: {
                            sha256: bufferSha,
                            md5: bufferMd5,
                            key_high: hashImage.key_high,
                            key_low: hashImage.key_low,
                            user_uid: user_uid,
                            isDuplicate: true
                        }
                    });
                    result.push(newImage);
                    this.logger.log(`Image uploaded successfully: ${newImage.id}`);
                    continue;
                }

                const correctFileNameLow = sha256(user_uid.toString() + file.buffer.toString() + 'low');
                const correctFileNameHigh = sha256(user_uid.toString() + file.buffer.toString() + 'high');
                const convertExtension = '.jpeg';
                const image = await this.prisma.images.findFirst({
                    where: {
                        key_low: correctFileNameLow + convertExtension,
                        key_high: correctFileNameHigh + convertExtension
                    }
                });
                if (!image) {
                    this.logger.log(`Uploading new image for user: ${user_uid}`);
                    const desiredSize = 300 * 1024;
                    const bufferHigh = await compressImage(file, desiredSize, 80, 800, 600);
                    const bufferLow = await compressImage(file, desiredSize, 40, 200, 150);
                    const uploadParamsLow = {
                        Bucket: bucketName,
                        Key: correctFileNameLow + convertExtension,
                        Body: bufferLow,
                        ContentType: 'image/jpeg',
                        ACL: ObjectCannedACL.public_read
                    };
                    const uploadParamsHigh = {
                        Bucket: bucketName,
                        Key: correctFileNameHigh + convertExtension,
                        Body: bufferHigh,
                        ContentType: 'image/jpeg',
                        ACL: ObjectCannedACL.public_read
                    };
                    const uploadLow = new Upload({ client: s3Client, params: uploadParamsLow });
                    const uploadHigh = new Upload({ client: s3Client, params: uploadParamsHigh });
                    await uploadLow.done();
                    await uploadHigh.done();
                    const uniqueImage = await this.prisma.images.create({
                        data: {
                            user_uid: user_uid,
                            key_low: correctFileNameLow + convertExtension,
                            key_high: correctFileNameHigh + convertExtension,
                            md5: bufferMd5,
                            sha256: bufferSha
                        }
                    });
                    await this.prisma.nu.create({
                        data: {
                            image: { connect: { id: uniqueImage.id } }
                        }
                    });
                    await this.prisma.df.create({
                        data: {
                            image: { connect: { id: uniqueImage.id } }
                        }
                    });
                    await this.prisma.dlib.create({
                        data: {
                            image: { connect: { id: uniqueImage.id } }
                        }
                    });
                    result.push(uniqueImage);
                    this.logger.log(`Image uploaded successfully: ${uniqueImage.id}`);
                } else {
                    this.logger.warn(`Image already exists: ${file.originalname}`);
                    result.push({ error: { name: file.originalname, message: 'Данный файл уже загружен' } });
                }
            }
            return result;
        } catch (error) {
            this.logger.error('Error in uploadImages method', error);
            throw error;
        }
    }

    async getImageByKey(key: string, quality: string): Promise<images> {
        try {
            this.logger.log(`Fetching image by key: ${key}, quality: ${quality}`);
            const qualityParams: IQuality = { low: 'key_low', high: 'key_high' };
            const keyImage: string = qualityParams[quality as keyof IQuality];
            const image = await this.prisma.images.findFirst({ where: { [keyImage]: key } });
            if (!image) {
                this.logger.warn(`Image not found for key: ${key}`);
                throw new NotFoundException('По данному пути не найдено изображение');
            }
            return image;
        } catch (error) {
            this.logger.error('Error in getImageByKey method', error);
            throw error;
        }
    }

    async getAllImages(): Promise<images[]> {
        try {
            this.logger.log('Fetching all images');
            const result = await this.prisma.images.findMany();
            return result;
        } catch (error) {
            this.logger.error('Error in getAllImages method', error);
            throw error;
        }
    }

    async getImagesByUserUid(user_uid: string, created_at: OrderByCreatedAt = 'desc'): Promise<images[]> {
        try {
            this.logger.log(`Fetching images for user: ${user_uid}, ordered by: ${created_at}`);
            const result = await this.prisma.images.findMany({ where: { user_uid }, orderBy: { created_at } });
            return result;
        } catch (error) {
            this.logger.error('Error in getImagesByUserUid method', error);
            throw error;
        }
    }

    async deleteImageByKey(keyLow: string, keyHigh: string, user_uid: string): Promise<SuccessResponse> {
        try {
            this.logger.log(`Deleting image by keys: ${keyLow}, ${keyHigh}`);
            const deleteParamsLow = {
                Bucket: bucketName,
                Key: keyLow
            };
            const deleteParamsHigh = {
                Bucket: bucketName,
                Key: keyHigh
            };
            const imageUser = await this.prisma.images.findFirst({
                where: { key_high: keyHigh, key_low: keyLow, user_uid }
            });
            const images = await this.prisma.images.findMany({ where: { key_high: keyHigh, key_low: keyLow } });
            if (!imageUser) {
                this.logger.warn(`Image not found for keys: ${keyLow}, ${keyHigh}`);
                throw new NotFoundException('По данному пути изображение не найдено');
            }
            const commandLow = new DeleteObjectCommand(deleteParamsLow);
            const commandHigh = new DeleteObjectCommand(deleteParamsHigh);
            if (!imageUser.isDuplicate && images.length === 1) {
                await s3Client.send(commandLow);
                await s3Client.send(commandHigh);
            }
            await this.prisma.nu.deleteMany({ where: { image: { key_low: keyLow, key_high: keyHigh } } });
            await this.prisma.df.deleteMany({ where: { image: { key_low: keyLow, key_high: keyHigh } } });
            await this.prisma.dlib.deleteMany({ where: { image: { key_low: keyLow, key_high: keyHigh } } });
            await this.prisma.images.deleteMany({ where: { key_low: keyLow, key_high: keyHigh } });
            this.logger.log(`Image deleted successfully: ${keyLow}, ${keyHigh}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Error in deleteImageByKey method', error);
            throw error;
        }
    }
}
