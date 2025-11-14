/**
 * Shared error handling utilities for the Forge extension
 */

export interface ErrorContext {
  operation: string;
  platform?: string;
  details?: string;
}

/**
 * Standardized error logging for process operations
 */
export function logProcessError(error: Error, context: ErrorContext): void {
  const platform = context.platform || PlatformCommandBuilder.getPlatformName();
  const message = `Failed to ${context.operation} on ${platform}${context.details ? `: ${context.details}` : ''}`;
  console.error(message, error);
}

/**
 * Handle and log errors from child process executions
 */
export function handleProcessError(
  error: Error | null, 
  operation: string, 
  platform?: string
): { hasError: boolean; errorMessage?: string } {
  if (error) {
    const context: ErrorContext = {
      operation,
      platform
    };
    logProcessError(error, context);
    return { hasError: true, errorMessage: error.message };
  }
  return { hasError: false };
}

/**
 * Create standardized error messages for user notifications
 */
export function createUserErrorMessage(operation: string, context?: string): string {
  const baseMessage = `Failed to ${operation}`;
  return context ? `${baseMessage}: ${context}` : baseMessage;
}

/**
 * Import PlatformCommandBuilder locally to avoid circular dependency
 */
import { PlatformCommandBuilder } from "./PlatformCommandBuilder";