/**
 * Rate Limiting system för att skydda mot spam och överbelastning
 * Löser problemet med otydlig rate-limiting
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = {
      // Begränsning per minut
      perMinute: 60,
      // Begränsning per timme
      perHour: 1000,
      // Begränsning per dag
      perDay: 10000
    };
    
    // Rensa gammal data varje minut
    setInterval(() => this.cleanup(), 60000);
  }

  // Kontrollera förfrågningsgräns
  checkLimit(identifier, action = 'default') {
    const now = Date.now();
    const key = `${identifier}:${action}`;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Ta bort gamla förfrågningar
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    const recentRequests = userRequests.filter(time => time > oneMinuteAgo);
    const hourlyRequests = userRequests.filter(time => time > oneHourAgo);
    const dailyRequests = userRequests.filter(time => time > oneDayAgo);
    
    // Kontrollera gränser
    if (recentRequests.length >= this.limits.perMinute) {
      return {
        allowed: false,
        reason: 'För många förfrågningar per minut',
        retryAfter: Math.ceil((recentRequests[0] + 60000 - now) / 1000)
      };
    }
    
    if (hourlyRequests.length >= this.limits.perHour) {
      return {
        allowed: false,
        reason: 'För många förfrågningar per timme',
        retryAfter: Math.ceil((hourlyRequests[0] + 3600000 - now) / 1000)
      };
    }
    
    if (dailyRequests.length >= this.limits.perDay) {
      return {
        allowed: false,
        reason: 'För många förfrågningar per dag',
        retryAfter: Math.ceil((dailyRequests[0] + 86400000 - now) / 1000)
      };
    }
    
    // Lägg till ny förfrågan
    userRequests.push(now);
    
    // Behåll endast relevanta förfrågningar
    this.requests.set(key, dailyRequests.concat([now]));
    
    return {
      allowed: true,
      remaining: {
        perMinute: this.limits.perMinute - recentRequests.length - 1,
        perHour: this.limits.perHour - hourlyRequests.length - 1,
        perDay: this.limits.perDay - dailyRequests.length - 1
      }
    };
  }

  // Rensa gammal data
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > oneDayAgo);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  // Återställ användargräns
  resetLimit(identifier, action = 'default') {
    const key = `${identifier}:${action}`;
    this.requests.delete(key);
  }

  // Hämta användarstatistik
  getStats(identifier, action = 'default') {
    const key = `${identifier}:${action}`;
    const userRequests = this.requests.get(key) || [];
    const now = Date.now();
    
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    return {
      perMinute: userRequests.filter(time => time > oneMinuteAgo).length,
      perHour: userRequests.filter(time => time > oneHourAgo).length,
      perDay: userRequests.filter(time => time > oneDayAgo).length,
      limits: this.limits
    };
  }
}

// Skapa global instans
const rateLimiter = new RateLimiter();

// Hjälpfunktioner för användning i applikationen
export const rateLimit = {
  // Kontrollera förfrågningsgräns
  check: (identifier, action) => rateLimiter.checkLimit(identifier, action),
  
  // Återställ gräns
  reset: (identifier, action) => rateLimiter.resetLimit(identifier, action),
  
  // Hämta statistik
  getStats: (identifier, action) => rateLimiter.getStats(identifier, action),
  
  // Kontrollera platsbokning
  checkSeatBooking: (userId) => {
    return rateLimiter.checkLimit(userId, 'seat_booking');
  },
  
  // Kontrollera skapande av resor
  checkRideCreation: (userId) => {
    return rateLimiter.checkLimit(userId, 'ride_creation');
  },
  
  // Kontrollera meddelanden
  checkMessaging: (userId) => {
    return rateLimiter.checkLimit(userId, 'messaging');
  },
  
  // Kontrollera sökning
  checkSearch: (userId) => {
    return rateLimiter.checkLimit(userId, 'search');
  }
};

// Hook för användning i React
export const useRateLimit = (identifier, action = 'default') => {
  const checkLimit = () => rateLimit.check(identifier, action);
  const resetLimit = () => rateLimit.reset(identifier, action);
  const getStats = () => rateLimit.getStats(identifier, action);
  
  return {
    checkLimit,
    resetLimit,
    getStats
  };
};

// Komponent för visuell visning av gränser
export const RateLimitDisplay = ({ identifier, action = 'default' }) => {
  const stats = rateLimit.getStats(identifier, action);
  
  return (
    <div className="rate-limit-display">
      <h3>Rate Limit Status</h3>
      <ul>
        <li>Per minut: {stats.perMinute}/{stats.limits.perMinute}</li>
        <li>Per timme: {stats.perHour}/{stats.limits.perHour}</li>
        <li>Per dag: {stats.perDay}/{stats.limits.perDay}</li>
      </ul>
    </div>
  );
};

export default rateLimiter;