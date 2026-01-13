# Authentication Configuration

This directory contains configuration files for the simplified authentication system.

## Files

### oauth.js

Contains configuration for Google and GitHub OAuth providers including:

- Client IDs and redirect URIs
- Scopes and security settings
- API endpoints
- Validation functions
- Security helper functions

## Usage

```javascript
import { SIMPLE_OAUTH_CONFIG, validateSimpleOAuthConfig } from "./config/auth";
```

## Directory Structure

```
auth/
├── oauth.js        # OAuth configuration
├── index.js        # Export file
├── README.md       # This file
```
