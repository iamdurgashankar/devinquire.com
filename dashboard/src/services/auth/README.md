# Authentication Services

This directory contains service files for the simplified authentication system.

## Files

### oauthService.js

Handles Google and GitHub OAuth 2.0 authentication flows with minimal complexity including:

- OAuth flow initiation
- State management and CSRF protection
- Token exchange and user session management
- User authentication status tracking

## Usage

```javascript
import { oauthService } from "./services/auth";

// Initiate Google OAuth
await oauthService.initiateGoogleAuth();

// Handle OAuth callback
await oauthService.handleOAuthCallback(provider, code, state);
```

## Directory Structure

```
auth/
├── oauthService.js     # OAuth service implementation
├── index.js           # Export file
├── README.md          # This file
```
