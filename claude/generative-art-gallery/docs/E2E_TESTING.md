# End-to-End Testing Documentation

## Overview

This document provides comprehensive guidance for running and maintaining the end-to-end (E2E) test suite for the Generative Art Gallery application. The E2E tests validate the complete user journey from art generation through NFT minting.

## Test Architecture

### Test Categories

1. **Frontend E2E Tests** (`e2e/art-gallery-flow.test.ts`)
   - Wallet connection and management
   - Art generation with custom parameters
   - Gallery functionality and persistence
   - Export and mint flow integration
   - Error handling and validation

2. **GAN Service API Tests** (`e2e/gan-service.test.ts`)
   - Art generation endpoints
   - Job status tracking
   - Parameter validation
   - Concurrent request handling
   - Error scenarios and edge cases

3. **Smart Contract Integration Tests** (`e2e/smart-contract.test.ts`)
   - Contract ABI validation
   - Metadata structure verification
   - IPFS URI format validation
   - Royalty and access control logic
   - Batch operations and gas estimation

## Prerequisites

### Required Services

Before running E2E tests, ensure all services are running:

```bash
# Start frontend development server
npm run dev

# Start GAN service (in separate terminal)
cd gan-service && python -m uvicorn main:app --reload --port 8000

# Start local blockchain (for contract tests)
npx hardhat node
```

### Environment Setup

1. **Install Dependencies**
   ```bash
   npm install
   npx playwright install
   ```

2. **Configure Test Environment**
   - Frontend runs on `http://localhost:5173`
   - GAN service runs on `http://localhost:8000`
   - Local blockchain on `http://localhost:8545`

## Running Tests

### Quick Start

Run all E2E tests:
```bash
npm run test:e2e
```

### Individual Test Suites

```bash
# Frontend tests only
npm run test:e2e:frontend

# API tests only
npm run test:e2e:api

# Contract tests only
npm run test:e2e:contract
```

### Advanced Usage

Use the test runner script directly for more options:

```bash
# Run specific test suite
./scripts/run-e2e-tests.sh frontend

# View test report
./scripts/run-e2e-tests.sh report

# Clean up test artifacts
./scripts/run-e2e-tests.sh clean
```

## Test Coverage

### Frontend Coverage

- ✅ Wallet connection (MetaMask mock)
- ✅ Art generation with parameters
- ✅ Gallery persistence (localStorage)
- ✅ Export functionality
- ✅ Error handling
- ✅ Network switching
- ✅ Parameter validation
- ✅ Mobile responsiveness

### API Coverage

- ✅ Art generation endpoint
- ✅ Job status tracking
- ✅ Parameter validation
- ✅ Concurrent requests
- ✅ Error handling
- ✅ Rate limiting
- ✅ CORS headers
- ✅ Health checks

### Contract Coverage

- ✅ ABI structure validation
- ✅ Metadata format
- ✅ IPFS URI validation
- ✅ Token ID generation
- ✅ Checksum calculation
- ✅ Royalty configuration
- ✅ Access control
- ✅ Batch operations

## Test Data and Mocking

### Mock Data Strategy

The tests use comprehensive mocking to ensure reliability:

1. **MetaMask Mocking**: Simulates wallet connection and transaction signing
2. **API Responses**: Mocks successful and error responses
3. **Contract Interactions**: Simulates smart contract calls
4. **IPFS Upload**: Mocks IPFS upload process

### Test Seeds and Parameters

Standard test parameters used across tests:

```typescript
const testParams = {
  seed: 12345,
  colorA: '#ff0000',
  colorB: '#00ff00',
  size: 512
};
```

## Continuous Integration

### GitHub Actions Integration

The E2E tests are designed to run in CI/CD pipelines:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm install
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
```

### Parallel Execution

Tests are configured to run in parallel for optimal performance:
- Multiple browser instances
- Concurrent API requests
- Parallel test suites

## Debugging and Troubleshooting

### Common Issues

1. **Service Not Running**
   - Check if all required services are started
   - Verify port availability
   - Check service logs

2. **Browser Installation**
   - Run `npx playwright install` to install browsers
   - Check system requirements

3. **Test Flakiness**
   - Increase timeout values
   - Add explicit waits
   - Check network conditions

### Debug Mode

Run tests in debug mode:
```bash
DEBUG=pw:* npx playwright test
```

### Test Reports

Generate and view detailed reports:
```bash
npm run test:e2e:report
```

## Performance Benchmarks

### Expected Performance

- **Frontend Tests**: ~30-60 seconds
- **API Tests**: ~15-30 seconds
- **Contract Tests**: ~10-20 seconds
- **Full Suite**: ~60-120 seconds

### Optimization Strategies

1. **Parallel Execution**: Tests run concurrently
2. **Smart Waits**: Efficient waiting strategies
3. **Mock Optimization**: Fast mock implementations
4. **Resource Management**: Proper cleanup

## Security Considerations

### Test Environment Isolation

- Tests run in isolated browser contexts
- Mock data prevents real transactions
- No real wallet connections
- Safe parameter validation

### Data Privacy

- No real user data in tests
- Mock IPFS hashes
- Synthetic test images
- Safe contract interactions

## Maintenance and Updates

### Updating Tests

When application changes:
1. Update selectors and locators
2. Adjust test data
3. Update mock responses
4. Verify test coverage

### Adding New Tests

Follow the established patterns:
1. Use descriptive test names
2. Implement proper mocking
3. Add error handling
4. Include assertions

### Test Documentation

Keep tests documented:
- Add inline comments
- Update test descriptions
- Document edge cases
- Maintain test data

## Best Practices

### Test Writing Guidelines

1. **Atomic Tests**: Each test should be independent
2. **Clear Assertions**: Use descriptive assertions
3. **Proper Cleanup**: Clean up after tests
4. **Error Handling**: Test error scenarios
5. **Performance**: Keep tests fast and reliable

### Code Quality

- Use TypeScript for type safety
- Follow ESLint rules
- Implement proper error handling
- Use consistent naming conventions

## Support and Resources

### Documentation Links

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Ethers.js Documentation](https://docs.ethers.io/)

### Getting Help

- Check test logs and reports
- Review error messages
- Consult documentation
- Ask team members

---

*This documentation is maintained by the development team. Last updated: November 2025*