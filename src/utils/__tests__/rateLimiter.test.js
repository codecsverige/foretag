import { rateLimit } from '../rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Rensa rate limiter före varje test
    rateLimit.reset('test-user', 'test-action');
  });

  test('tillåter förfrågningar under gränsen', () => {
    const result = rateLimit.check('test-user', 'test-action');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeDefined();
  });

  test('blockerar förfrågningar över minutgränsen', () => {
    // Simulera många förfrågningar
    for (let i = 0; i < 60; i++) {
      rateLimit.check('test-user-minute', 'test-action');
    }
    
    const result = rateLimit.check('test-user-minute', 'test-action');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('För många förfrågningar per minut');
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test('återställer gränser korrekt', () => {
    // Gör några förfrågningar
    rateLimit.check('test-user-reset', 'test-action');
    rateLimit.check('test-user-reset', 'test-action');
    
    // Kontrollera att förfrågningar räknats
    let stats = rateLimit.getStats('test-user-reset', 'test-action');
    expect(stats.perMinute).toBe(2);
    
    // Återställ
    rateLimit.reset('test-user-reset', 'test-action');
    
    // Kontrollera att räknaren är nollställd
    stats = rateLimit.getStats('test-user-reset', 'test-action');
    expect(stats.perMinute).toBe(0);
  });

  test('hanterar olika actions separat', () => {
    // Gör förfrågningar för olika actions
    const result1 = rateLimit.check('test-user', 'action1');
    const result2 = rateLimit.check('test-user', 'action2');
    
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    
    // Stats ska vara separata
    const stats1 = rateLimit.getStats('test-user', 'action1');
    const stats2 = rateLimit.getStats('test-user', 'action2');
    
    expect(stats1.perMinute).toBe(1);
    expect(stats2.perMinute).toBe(1);
  });

  test('checkSeatBooking fungerar korrekt', () => {
    const result = rateLimit.checkSeatBooking('user123');
    expect(result.allowed).toBe(true);
  });

  test('checkRideCreation fungerar korrekt', () => {
    const result = rateLimit.checkRideCreation('user123');
    expect(result.allowed).toBe(true);
  });

  test('checkMessaging fungerar korrekt', () => {
    const result = rateLimit.checkMessaging('user123');
    expect(result.allowed).toBe(true);
  });

  test('checkSearch fungerar korrekt', () => {
    const result = rateLimit.checkSearch('user123');
    expect(result.allowed).toBe(true);
  });
});