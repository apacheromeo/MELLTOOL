import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { PrintService } from './print.service';
import { CreatePrintJobDto } from './dto/create-print-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('print')
@Controller('print')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrintController {
  private readonly logger = new Logger(PrintController.name);

  constructor(private readonly printService: PrintService) {}

  @Post('barcode')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Generate barcode labels' })
  @ApiResponse({ status: 201, description: 'Print job created' })
  async printBarcode(@Body() createPrintJobDto: CreatePrintJobDto, @Request() req) {
    this.logger.log(`Creating barcode print job by user: ${req.user.email}`);
    return this.printService.createBarcodeJob(createPrintJobDto, req.user.id);
  }

  @Post('barcode/batch')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Generate batch barcode labels' })
  @ApiResponse({ status: 201, description: 'Batch print job created' })
  async printBarcodeBatch(
    @Body() body: { productIds: string[]; copiesPerProduct?: number },
    @Request() req,
  ) {
    this.logger.log(`Creating batch barcode print job by user: ${req.user.email}`);
    return this.printService.createBatchBarcodeJob(
      body.productIds,
      body.copiesPerProduct || 1,
      req.user.id,
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get all print jobs' })
  async getPrintJobs(@Request() req) {
    return this.printService.getPrintJobs(req.user.id);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get print job by ID' })
  async getPrintJob(@Param('id') id: string) {
    return this.printService.getPrintJob(id);
  }

  @Get('jobs/:id/download')
  @ApiOperation({ summary: 'Download print job PDF' })
  async downloadPrintJob(@Param('id') id: string, @Res() res: Response) {
    const job = await this.printService.getPrintJob(id);
    
    if (!job.filePath) {
      throw new Error('Print job file not found');
    }

    return res.download(job.filePath);
  }

  @Post('jobs/:id/retry')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Retry failed print job' })
  async retryPrintJob(@Param('id') id: string) {
    return this.printService.retryPrintJob(id);
  }
}

