# OWASP Top 10 Security Checklist

**Project:** Helaqat El Balad (Egyptian Barber Shop) - Micro Frontend Architecture  
**Standard:** OWASP Top 10 2021 (https://owasp.org/Top10/)  
**Last Updated:** September 26, 2026  
**Status:** Phase 6 - Testing & Optimization

---

## Overview

This checklist guides security assessment and remediation based on the OWASP Top 10 2021, the most critical web application security risks. Each vulnerability includes detection methods, remediation steps, and verification procedures.

---

## A01:2021 – Broken Access Control

### Description
Access control enforces policy such that users cannot act outside their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data.

### Risk Level
🔴 **CRITICAL**

### Vulnerability Indicators
- [ ] Users can access data not belonging to them
- [ ] Users can modify or delete other users' data
- [ ] Admin functions accessible without authentication
- [ ] Direct object references (e.g., `/users/123` without validation)
- [ ] No rate limiting on API endpoints
- [ ] JWT tokens not properly validated
- [ ] No proper session invalidation

### Remediation Checklist

#### Authentication & Authorization
- [ ] Implement strong access control model (RBAC, ABAC)
- [ ] Validate every request for authorization
- [ ] Use centralized access control
- [ ] Deny by default (whitelist approach)
- [ ] Log access control failures

#### Session Management
- [ ] Invalidate session on logout
- [ ] Regenerate session IDs after login
- [ ] Use secure session cookies (HttpOnly, Secure, SameSite)
- [ ] Implement session timeout
- [ ] Prevent session fixation attacks

#### Implementation Example
```typescript
// Backend: Check authorization on every request
app.get('/api/bookings/:id', authenticateUser, (req, res) => {
  // Verify user owns this booking
  const booking = await getBooking(req.params.id);
  
  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(booking);
});
```

### Testing Procedure
1. Create two user accounts
2. Attempt to access first user's data as second user
3. Try direct object reference attacks (modify IDs in requests)
4. Test without authentication
5. Verify proper 403/401 responses

---

## A02:2021 – Cryptographic Failures

### Description
Sensitive data exposure, often due to lack of encryption, weak encryption, or exposed cryptographic keys.

### Risk Level
🔴 **CRITICAL**

### Vulnerability Indicators
- [ ] Sensitive data transmitted over HTTP
- [ ] API keys in client-side code
- [ ] Passwords not hashed
- [ ] Weak encryption algorithms used
- [ ] Hard-coded secrets in code
- [ ] Encryption keys exposed
- [ ] No HTTPS/TLS enforcement

### Remediation Checklist

#### HTTPS/TLS
- [ ] All pages served over HTTPS
- [ ] HSTS header enabled (Strict-Transport-Security)
- [ ] Strong TLS version (1.2+)
- [ ] Strong cipher suites
- [ ] Certificate properly configured
- [ ] No mixed content (HTTP + HTTPS)

#### Secrets Management
- [ ] No API keys in client code
- [ ] Environment variables for secrets
- [ ] Secrets not in version control
- [ ] Vault/KMS for production secrets
- [ ] Secrets rotation policy
- [ ] Principle of least privilege

#### Data Protection
- [ ] PII encrypted at rest (if stored)
- [ ] Strong encryption (AES-256)
- [ ] Passwords hashed (bcrypt, scrypt, Argon2)
- [ ] Sensitive data not logged
- [ ] Data retention policy

### Implementation Example
```typescript
// Good: Use environment variables for secrets
const API_KEY = process.env.API_KEY; // Never hardcode

// Good: Hash passwords with strong algorithm
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 12);

// Good: HTTPS headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

### Testing Procedure
1. Check for HTTPS usage
2. Review network traffic for PII
3. Scan for API keys in source code
4. Verify TLS certificate validity
5. Check password hashing implementation

---

## A03:2021 – Injection

### Description
User-supplied data is not properly validated, filtered, or escaped, allowing attackers to inject malicious code.

### Risk Level
🔴 **CRITICAL**

### Vulnerability Indicators
- [ ] SQL injection possible (query concatenation)
- [ ] XSS vulnerabilities (user input rendered as HTML)
- [ ] Command injection (unsanitized system commands)
- [ ] LDAP injection
- [ ] Template injection
- [ ] Path traversal (/../../etc/passwd)
- [ ] No input validation

### Remediation Checklist

#### Input Validation
- [ ] Whitelist acceptable input
- [ ] Validate data type and format
- [ ] Validate length limits
- [ ] Reject suspicious patterns
- [ ] Sanitize file uploads

#### Output Encoding
- [ ] HTML encode user-supplied data
- [ ] JavaScript encode in script contexts
- [ ] URL encode in URL parameters
- [ ] CSS encode in style attributes
- [ ] Use template auto-escaping

#### Query Security
- [ ] Use parameterized queries/prepared statements
- [ ] Use ORM with safe queries
- [ ] Never concatenate user input into queries
- [ ] Apply principle of least privilege to DB user

#### Code Security
- [ ] Avoid eval() and similar functions
- [ ] Use safe JSON parsing (JSON.parse not eval)
- [ ] No command concatenation
- [ ] Use safe libraries

### Implementation Example
```typescript
// Bad: Vulnerable to SQL injection
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// Good: Parameterized query
db.query('SELECT * FROM users WHERE email = ?', [email]);

// Bad: XSS vulnerable
<div>{userInput}</div>

// Good: React auto-escapes
<div>{userInput}</div> {/* Safe */}

// Better: Explicit encoding if needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### Testing Procedure
1. Test form fields with SQL injection payloads
2. Test XSS payloads in all user-input fields
3. Test path traversal in file uploads
4. Test command injection if system calls used
5. Use automated scanning (OWASP ZAP, Burp Suite)

---

## A04:2021 – Insecure Design

### Description
Missing or ineffective control design which encompasses missing business logic security controls.

### Risk Level
🟠 **HIGH**

### Vulnerability Indicators
- [ ] No threat modeling performed
- [ ] No security requirements defined
- [ ] No security controls designed
- [ ] No rate limiting
- [ ] No account lockout after failed attempts
- [ ] Weak password policy
- [ ] No account verification process

### Remediation Checklist

#### Threat Modeling
- [ ] Identify threats to application
- [ ] Create threat model
- [ ] Define security requirements
- [ ] Design security controls
- [ ] Review design with team

#### Business Logic Security
- [ ] Validate all business logic transactions
- [ ] Prevent duplicate transactions
- [ ] Implement payment verification
- [ ] Verify booking integrity
- [ ] Prevent race conditions

#### Rate Limiting & Throttling
- [ ] Rate limit API endpoints
- [ ] Rate limit login attempts (progressive delays)
- [ ] Rate limit password reset
- [ ] Track from IP + User ID
- [ ] Return 429 Too Many Requests

### Implementation Example
```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);

// Progressive delay on failed login
async function handleFailedLogin(email: string) {
  const attempts = await getFailedAttempts(email);
  const delay = Math.min(attempts * 1000, 30000); // Max 30s
  await wait(delay);
  
  if (attempts >= 5) {
    await lockoutAccount(email, 30 * 60 * 1000); // 30 minutes
  }
}
```

### Testing Procedure
1. Review threat model and security design
2. Test rate limiting on API endpoints
3. Test account lockout after failed logins
4. Verify no duplicate transaction processing
5. Test race condition scenarios

---

## A05:2021 – Security Misconfiguration

### Description
Insecure default configurations, incomplete or ad-hoc configurations, open cloud storage, misconfigured HTTP headers, and verbose error messages containing sensitive information.

### Risk Level
🟠 **HIGH**

### Vulnerability Indicators
- [ ] Debug mode enabled in production
- [ ] Default credentials not changed
- [ ] Unnecessary services enabled
- [ ] Missing or incorrect security headers
- [ ] Error messages expose technical details
- [ ] Outdated software
- [ ] Missing patches
- [ ] Unnecessary HTTP methods enabled (TRACE, CONNECT)

### Remediation Checklist

#### Configuration Management
- [ ] Use secure defaults
- [ ] Separate config from code
- [ ] Use environment-specific configs
- [ ] Review all configurations
- [ ] Document all configurations

#### Security Headers
- [ ] Strict-Transport-Security (HSTS)
- [ ] Content-Security-Policy (CSP)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin

#### Error Handling
- [ ] Generic error messages to users
- [ ] Log detailed errors server-side
- [ ] No stack traces in responses
- [ ] No sensitive data in error messages
- [ ] Implement proper logging

### Implementation Example
```typescript
// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Error handling
app.use((err: Error, req: Request, res: Response) => {
  // Log detailed error server-side
  logger.error(err);
  
  // Send generic error to client
  res.status(500).json({ error: 'Internal server error' });
});
```

### Testing Procedure
1. Check for security headers
2. Test error responses for information disclosure
3. Verify debug mode disabled
4. Check for default credentials
5. Verify all necessary patches applied

---

## A06:2021 – Vulnerable and Outdated Components

### Description
Using components with known vulnerabilities, unsupported versions, or components that are no longer maintained.

### Risk Level
🟠 **HIGH**

### Vulnerability Indicators
- [ ] Outdated dependencies
- [ ] Known CVEs in dependencies
- [ ] Unpatched framework versions
- [ ] No dependency management
- [ ] No security monitoring
- [ ] Unlicensed components

### Remediation Checklist

#### Dependency Management
- [ ] Use package manager (npm/pnpm)
- [ ] Pin dependency versions
- [ ] Review dependency updates
- [ ] Use lock files
- [ ] Document all dependencies

#### Vulnerability Scanning
- [ ] Run npm audit regularly
- [ ] Use dependency scanning tools
- [ ] Set up automated scanning
- [ ] Review security advisories
- [ ] Subscribe to security mailing lists

#### Updates & Patches
- [ ] Plan regular update schedule
- [ ] Test updates in staging
- [ ] Apply security patches immediately
- [ ] Maintain version constraints
- [ ] Document rationale for version choices

### Implementation Example
```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Install specific secure version
npm install package@^version

# Update lock file
pnpm lock
```

### Vulnerability Scanning Command
```bash
# Automated scanning in CI/CD
npm ci
npm audit --audit-level=moderate
```

### Testing Procedure
1. Run npm audit
2. Review all dependencies
3. Check for known CVEs
4. Verify all components are maintained
5. Test after updates in staging

---

## A07:2021 – Identification and Authentication Failures

### Description
Compromised user identity, authentication tokens, or session management that could allow attackers to assume user identity.

### Risk Level
🟠 **HIGH**

### Vulnerability Indicators
- [ ] Weak password policy
- [ ] No multi-factor authentication
- [ ] Session tokens not validated
- [ ] Session tokens exposed
- [ ] No logout functionality
- [ ] No account lockout
- [ ] Passwords sent in plain text
- [ ] Credentials stored insecurely

### Remediation Checklist

#### Authentication
- [ ] Enforce strong password policy
- [ ] Implement MFA/2FA
- [ ] Use secure password hashing (bcrypt, scrypt, Argon2)
- [ ] Prevent brute force (rate limiting, lockout)
- [ ] Secure password reset process
- [ ] Clear session on logout

#### Session Management
- [ ] Use secure session tokens
- [ ] Validate session on every request
- [ ] Regenerate session after login
- [ ] Set appropriate session timeout
- [ ] Secure session storage
- [ ] Use HttpOnly, Secure, SameSite cookies

#### Token Security (JWT)
- [ ] Validate JWT signature
- [ ] Check JWT expiration
- [ ] Use strong signing algorithm (RS256)
- [ ] Store secrets securely
- [ ] Implement token refresh
- [ ] Revoke tokens on logout

### Implementation Example
```typescript
// Password validation
function validatePassword(password: string): boolean {
  // At least 12 chars, upper, lower, number, special
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(password);
}

// Secure JWT
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { 
    algorithm: 'HS256',
    expiresIn: '1h',
  }
);

// Secure cookie
res.cookie('sessionId', sessionId, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'Strict',
  maxAge: 3600000, // 1 hour
});
```

### Testing Procedure
1. Test weak passwords are rejected
2. Verify strong password enforcement
3. Test session invalidation on logout
4. Verify JWT validation
5. Test token expiration

---

## A08:2021 – Software and Data Integrity Failures

### Description
CI/CD pipeline vulnerabilities, insecure updates, critical software updates without proper integrity verification.

### Risk Level
🟡 **MEDIUM**

### Vulnerability Indicators
- [ ] No code review process
- [ ] Unsecured update mechanism
- [ ] No integrity verification
- [ ] No signed packages
- [ ] Unencrypted dependencies
- [ ] No supply chain security
- [ ] Auto-update without verification

### Remediation Checklist

#### Code Integrity
- [ ] Implement code review process
- [ ] Sign commits with GPG
- [ ] Verify code signatures
- [ ] Use version control branching
- [ ] Require approvals for merges

#### Dependency Integrity
- [ ] Verify package signatures
- [ ] Use package checksums
- [ ] Audit dependency sources
- [ ] Use private registry if needed
- [ ] Lock exact versions

#### Update Security
- [ ] Verify software signatures
- [ ] Use HTTPS for downloads
- [ ] Test updates in staging
- [ ] Verify integrity after download
- [ ] Document update process

### Implementation Example
```bash
# Verify npm package integrity
npm install --strict-ssl

# Use lock file for reproducible builds
pnpm ci # Uses pnpm-lock.yaml

# Sign commits
git commit -S -m "message"

# Verify commit signature
git verify-commit <commit>
```

### Testing Procedure
1. Verify code review process
2. Test integrity verification
3. Check package signatures
4. Verify updates are tested before deployment
5. Audit dependency sources

---

## A09:2021 – Logging and Monitoring Failures

### Description
Missing, insufficient, or ineffective logging and monitoring, making security incidents hard to detect or recover from.

### Risk Level
🟡 **MEDIUM**

### Vulnerability Indicators
- [ ] No logging of security events
- [ ] No monitoring of anomalies
- [ ] Logs not centralized
- [ ] No alerting system
- [ ] No incident response process
- [ ] Logs deleted or not retained
- [ ] Logs not protected

### Remediation Checklist

#### Logging
- [ ] Log all authentication attempts
- [ ] Log unauthorized access attempts
- [ ] Log data modifications
- [ ] Log administrative actions
- [ ] Include timestamp, user, action, result
- [ ] Log to centralized system
- [ ] Protect logs from tampering

#### Monitoring & Alerting
- [ ] Monitor for suspicious patterns
- [ ] Alert on security events
- [ ] Alert on anomalies
- [ ] Alert on failed logins (threshold)
- [ ] Alert on rate limiting triggers
- [ ] Review logs regularly

#### Incident Response
- [ ] Document incidents
- [ ] Define response procedures
- [ ] Practice incident response
- [ ] Have contact list ready
- [ ] Have backup/restore process

### Implementation Example
```typescript
// Security logging
logger.info('Security Event', {
  event: 'login_attempt',
  email: user.email,
  ip: req.ip,
  result: 'success',
  timestamp: new Date(),
});

// Suspicious activity detection
if (failedAttempts >= 5) {
  logger.warn('Suspicious Activity', {
    event: 'multiple_failed_logins',
    email: user.email,
    ip: req.ip,
  });
  
  alertSecurityTeam();
}
```

### Testing Procedure
1. Verify logging of all security events
2. Check logs for sufficient detail
3. Verify monitoring alerts work
4. Test incident response procedures
5. Verify log integrity

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### Description
Web application fetches remote resource without validating user-supplied URLs, allowing attackers to abuse application to port scan or interact with internal systems.

### Risk Level
🟡 **MEDIUM**

### Vulnerability Indicators
- [ ] User-supplied URLs not validated
- [ ] Can request internal resources
- [ ] Can port scan internal network
- [ ] No URL scheme validation
- [ ] No host whitelist
- [ ] Can request metadata services

### Remediation Checklist

#### URL Validation
- [ ] Validate URL format
- [ ] Restrict to HTTPS
- [ ] Whitelist allowed hosts
- [ ] Block private IP ranges
- [ ] Block metadata services (169.254.169.254)
- [ ] Validate domain resolution

#### Request Security
- [ ] Use allowlist approach
- [ ] Reject suspicious patterns
- [ ] Set timeouts
- [ ] Limit response size
- [ ] Handle redirects safely

### Implementation Example
```typescript
// URL validation
function isSafeURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Allow only HTTPS
    if (url.protocol !== 'https:') return false;
    
    // Whitelist allowed hosts
    const allowedHosts = ['api.example.com', 'cdn.example.com'];
    if (!allowedHosts.includes(url.hostname)) return false;
    
    // Block private IP ranges
    const privateRanges = ['127.0.0.1', '192.168', '10.', '172.16'];
    if (privateRanges.some(range => url.hostname.includes(range))) return false;
    
    // Block metadata service
    if (url.hostname === '169.254.169.254') return false;
    
    return true;
  } catch {
    return false;
  }
}

// Usage
if (isSafeURL(userSuppliedURL)) {
  const response = await fetch(userSuppliedURL);
} else {
  throw new Error('Invalid URL');
}
```

### Testing Procedure
1. Test with internal IP addresses
2. Test metadata service access
3. Test private IP ranges
4. Test port scanning
5. Test HTTP redirect attacks

---

## Summary Checklist

### All Items
- [ ] A01: Broken Access Control fixed
- [ ] A02: Cryptographic Failures fixed
- [ ] A03: Injection fixed
- [ ] A04: Insecure Design fixed
- [ ] A05: Security Misconfiguration fixed
- [ ] A06: Vulnerable Components fixed
- [ ] A07: Authentication Failures fixed
- [ ] A08: Integrity Failures fixed
- [ ] A09: Logging Failures fixed
- [ ] A10: SSRF fixed

### Pre-Deployment Checklist
- [ ] Security code review completed
- [ ] OWASP Top 10 assessment passed
- [ ] Penetration testing completed
- [ ] Dependency scan passed
- [ ] No known CVEs
- [ ] All secrets managed securely
- [ ] Logging and monitoring enabled
- [ ] Incident response plan ready
- [ ] Security training completed
- [ ] Security documentation updated

---

## Tools & Resources

### Security Testing Tools
- **OWASP ZAP** - Automated vulnerability scanner
- **Burp Suite** - Web application security testing
- **npm audit** - JavaScript dependency scanning
- **Snyk** - Dependency vulnerability tracking
- **SonarQube** - Code quality & security analysis

### Learning Resources
- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Status:** APPROVED  
**Next Review:** December 26, 2026
