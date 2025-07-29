# Test Utilities

This directory contains test utilities for verifying the DeFi Trading Copilot integrations.

## Available Tests

### Database Testing
- **`test-db.ts`** - Tests Supabase database connection and basic operations

### Supra Integration Testing  
- **`test-supra-automation.ts`** - Comprehensive tests for Supra Automation integration
- **`test-supra.ts`** - Basic Supra health check and connection tests

## Usage

These test files are meant to be run in a development environment to verify that your API configurations are working correctly.

To use these tests:

1. Make sure your environment variables are configured in `.env`
2. Import and run the test functions in your development environment
3. Check the console output for test results

Example:
```typescript
import { testDatabaseConnection } from './tests/test-db';

// Run in browser console or development environment
testDatabaseConnection();
```

## Note

These are utility test files, not automated test suites. They're designed for manual testing and verification during development and setup. 