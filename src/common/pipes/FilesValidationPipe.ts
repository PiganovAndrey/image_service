import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FilesValidationPipe implements PipeTransform {
    private readonly MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

    transform(files: Array<Express.Multer.File>): Array<Express.Multer.File> {
        if (!files || files.length === 0) {
            throw new BadRequestException('Image files are required');
        }

        const isImageType = (mimetype: string) => mimetype.startsWith('image/');
        const isBigFile = (size: number) => size <= this.MAX_FILE_SIZE_BYTES;

        for (const file of files) {
            if (!isImageType(file.mimetype)) {
                throw new BadRequestException('Invalid file format. Only image files are allowed');
            }

            if (!isBigFile(file.size)) {
                throw new BadRequestException('Files are too big, more than 15MB');
            }
        }

        return files;
    }
}
