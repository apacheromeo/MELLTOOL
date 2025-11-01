import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('supabase.url');
    const supabaseKey = this.configService.get('supabase.serviceRoleKey');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase configuration missing');
      throw new Error('Supabase configuration missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    this.logger.log('✅ Supabase client initialized');
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  async verifyToken(token: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error) {
        this.logger.warn(`Token verification failed: ${error.message}`);
        return null;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Token verification error:', error);
      return null;
    }
  }

  async createUser(email: string, password: string, metadata?: any) {
    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });

      if (error) {
        this.logger.error(`User creation failed: ${error.message}`);
        throw error;
      }

      this.logger.log(`User created in Supabase: ${email}`);
      return data.user;
    } catch (error) {
      this.logger.error('Supabase user creation error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: any) {
    try {
      const { data, error } = await this.supabase.auth.admin.updateUserById(
        userId,
        updates,
      );

      if (error) {
        this.logger.error(`User update failed: ${error.message}`);
        throw error;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Supabase user update error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const { error } = await this.supabase.auth.admin.deleteUser(userId);

      if (error) {
        this.logger.error(`User deletion failed: ${error.message}`);
        throw error;
      }

      this.logger.log(`User deleted from Supabase: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Supabase user deletion error:', error);
      throw error;
    }
  }
}
