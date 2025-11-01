import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class FileUploadSecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FileUploadSecurityInterceptor.name);

  // Default allowed MIME types (images)
  private readonly defaultAllowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Allowed MIME types for Excel/CSV imports
  private readonly importAllowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv
    'text/comma-separated-values', // .csv
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB (increased for Excel files)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if this is an import endpoint (allow Excel/CSV)
    const isImportEndpoint = request.path?.includes('/import') || 
                             request.path?.includes('/template');

    if (request.file) {
      this.validateFile(request.file, isImportEndpoint);
    }

    if (request.files && Array.isArray(request.files)) {
      request.files.forEach((file: Express.Multer.File) => {
        this.validateFile(file, isImportEndpoint);
      });
    }

    if (request.files && typeof request.files === 'object') {
      Object.values(request.files).forEach((fileArray: Express.Multer.File[]) => {
        fileArray.forEach((file) => {
          this.validateFile(file, isImportEndpoint);
        });
      });
    }

    return next.handle();
  }

  private validateFile(file: Express.Multer.File, isImportEndpoint = false): void {
    // Validate file size
    if (file.size > this.maxFileSize) {
      this.logger.warn(
        `File upload rejected: size ${file.size} exceeds maximum ${this.maxFileSize}`,
      );
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    const allowedMimeTypes = isImportEndpoint
      ? this.importAllowedMimeTypes
      : this.defaultAllowedMimeTypes;

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.warn(
        `File upload rejected: invalid MIME type ${file.mimetype}`,
      );
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file extension (prevent double extension attacks)
    const originalName = file.originalname.toLowerCase();
    const allowedExtensions = isImportEndpoint
      ? ['.xlsx', '.xls', '.csv']
      : ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    const hasValidExtension = allowedExtensions.some((ext) =>
      originalName.endsWith(ext),
    );

    if (!hasValidExtension) {
      this.logger.warn(
        `File upload rejected: invalid file extension ${originalName}`,
      );
      throw new BadRequestException(
        `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      );
    }

    // Sanitize filename (remove path traversal attempts)
    const sanitizedFilename = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.\./g, '_');

    if (sanitizedFilename !== file.originalname) {
      this.logger.warn(
        `Filename sanitized: ${file.originalname} -> ${sanitizedFilename}`,
      );
      file.originalname = sanitizedFilename;
    }
  }
}
