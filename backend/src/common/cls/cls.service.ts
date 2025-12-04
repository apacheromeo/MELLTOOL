import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface UserContext {
  userId: string;
  userRole: string;
}

/**
 * Continuation Local Storage (CLS) Service
 *
 * Provides request-scoped storage for user context using Node.js AsyncLocalStorage.
 * This ensures RLS context is available throughout the entire request lifecycle.
 */
@Injectable()
export class ClsService {
  private readonly storage = new AsyncLocalStorage<UserContext>();

  /**
   * Run a function with user context
   */
  run<T>(context: UserContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Get the current user context
   */
  getUserContext(): UserContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Get the current user ID
   */
  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  /**
   * Get the current user role
   */
  getUserRole(): string | undefined {
    return this.storage.getStore()?.userRole;
  }
}
