/**
 * Sentry Error Monitoring Service
 * Övervakar och rapporterar fel i produktionsmiljön
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Initiera Sentry endast i produktion
export function initSentry() {
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% av transaktioner
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% av sessioner
      replaysOnErrorSampleRate: 1.0, // 100% vid fel
      
      // Miljö och release
      environment: process.env.REACT_APP_ENV || 'production',
      release: process.env.REACT_APP_VERSION || '1.0.0',
      
      // Filtrera bort vissa fel
      beforeSend(event, hint) {
        // Ignorera vissa typer av fel
        const error = hint.originalException;
        
        // Ignorera nätverksfel
        if (error?.message?.includes('Network request failed')) {
          return null;
        }
        
        // Ignorera avbrutna requests
        if (error?.name === 'AbortError') {
          return null;
        }
        
        // Ignorera fel från browser extensions
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
          frame => frame.filename?.includes('extension://')
        )) {
          return null;
        }
        
        return event;
      },
      
      // Användarkontext
      initialScope: {
        tags: {
          component: 'frontend',
        },
      },
    });
  }
}

// Sätt användarkontext
export function setSentryUser(user) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser({
      id: user?.uid,
      email: user?.email,
      username: user?.displayName,
    });
  }
}

// Rensa användarkontext
export function clearSentryUser() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser(null);
  }
}

// Logga anpassade händelser
export function logSentryEvent(message, level = 'info', extra = {}) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level,
      extra,
    });
  }
}

// Logga fel med extra kontext
export function logSentryError(error, context = {}) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  } else {
    console.error('Sentry Error:', error, context);
  }
}

// Lägg till breadcrumb för navigering
export function addSentryBreadcrumb(message, category = 'navigation', data = {}) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
      timestamp: Date.now() / 1000,
    });
  }
}

// Performance monitoring
export function startSentryTransaction(name, op = 'navigation') {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
}

// Profiling för kritiska funktioner
export function profileFunction(fn, name) {
  return async (...args) => {
    const transaction = startSentryTransaction(name, 'function');
    
    try {
      const result = await fn(...args);
      transaction?.setStatus('ok');
      return result;
    } catch (error) {
      transaction?.setStatus('internal_error');
      logSentryError(error, { function: name, args });
      throw error;
    } finally {
      transaction?.finish();
    }
  };
}

// React Error Boundary integration
export const SentryErrorBoundary = Sentry.ErrorBoundary;
export const withSentryRouting = Sentry.withSentryRouting;
export const withProfiler = Sentry.withProfiler;

export default {
  init: initSentry,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  logEvent: logSentryEvent,
  logError: logSentryError,
  addBreadcrumb: addSentryBreadcrumb,
  startTransaction: startSentryTransaction,
  profileFunction,
  ErrorBoundary: SentryErrorBoundary,
  withSentryRouting,
  withProfiler,
};