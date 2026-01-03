/**
 * Rate Limiter for Code Execution
 * Prevents abuse and DoS attacks
 */

class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // Map of IP/token -> request timestamps
    this.cleanupTimer = null;
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

  /**
   * Start periodic cleanup to prevent memory bloat.
   * @param {number} intervalMs - Interval for cleanup checks.
   */
  startCleanup(intervalMs = 5 * 60 * 1000) {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), intervalMs);
  }

  /**
   * Stop periodic cleanup (e.g., on unmount).
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Begin cleanup loop immediately for the shared instance
rateLimiter.startCleanup();

export default rateLimiter;
