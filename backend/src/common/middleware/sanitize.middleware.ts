import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as sanitizeHtml from 'sanitize-html';
import { isEmail } from 'validator';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];

          if (typeof value === 'string') {
            // Skip sanitization for email fields (they'll be validated separately)
            if (key.toLowerCase().includes('email')) {
              sanitized[key] = value.trim();
            } else {
              // Sanitize HTML and trim whitespace
              sanitized[key] = sanitizeHtml(value.trim(), {
                allowedTags: [],
                allowedAttributes: {},
              });
            }
          } else if (typeof value === 'object') {
            sanitized[key] = this.sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
      }

      return sanitized;
    }

    return obj;
  }
}
