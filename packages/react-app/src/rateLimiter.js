/**
 * Rate Limiter for Code Execution
 * Prevents abuse and DoS attacks
 */

class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // Map of IP/token -> request timestamps
  }

  /**
   * Check if a request should be allowed
   * @param {string} identifier - Unique identifier (IP, user ID, etc.)
   * @returns {boolean} - True if request is allowed
   */
  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for an identifier
   * @param {string} identifier - Unique identifier
   * @returns {number} - Remaining requests
   */
  getRemaining(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Reset rate limit for an identifier
   * @param {string} identifier - Unique identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(timestamp => now - timestamp < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

export default rateLimiter;

