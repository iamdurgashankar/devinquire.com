# Authentication Utilities

This directory contains utility functions for the simplified authentication system.

## Files

### validation.js

Security validation functions for the simplified OAuth system including:

- Email format validation
- Input sanitization to prevent XSS and injection attacks
- Redirect URI validation to prevent open redirect vulnerabilities
- OAuth parameter validation
- Rate limiting functions
- Token expiry checking
- User session validation

## Usage

```javascript
import {
  validateEmail,
  sanitizeInput,
  validateRedirectUri,
} from "./utils/auth";
```

## Directory Structure

```
auth/
├── validation.js       # Validation utilities
├── index.js           # Export file
├── README.md          # This file
```
