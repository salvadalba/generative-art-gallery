#!/bin/bash

# E2E Test Runner Script
# This script runs the complete end-to-end test suite

set -e

echo "🚀 Starting E2E Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required services are running
check_services() {
    print_status "Checking required services..."
    
    # Check if frontend is running
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|302"; then
        print_status "✅ Frontend is running"
    else
        print_error "❌ Frontend is not running. Please run 'npm run dev' first."
        exit 1
    fi
    
    # Check if GAN service is running
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
        print_status "✅ GAN service is running"
    else
        print_error "❌ GAN service is not running. Please run 'cd gan-service && python -m uvicorn main:app --reload --port 8000'"
        exit 1
    fi
}

# Install Playwright browsers if not already installed
install_browsers() {
    print_status "Installing Playwright browsers..."
    npx playwright install
}

# Run different test suites
run_frontend_tests() {
    print_status "Running Frontend E2E Tests..."
    npx playwright test e2e/art-gallery-flow.test.ts --reporter=html
}

run_api_tests() {
    print_status "Running GAN Service API Tests..."
    npx playwright test e2e/gan-service.test.ts --reporter=html
}

run_contract_tests() {
    print_status "Running Smart Contract Integration Tests..."
    npx playwright test e2e/smart-contract.test.ts --reporter=html
}

run_all_tests() {
    print_status "Running All E2E Tests..."
    npx playwright test --reporter=html
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    npx playwright show-report
}

# Cleanup function
cleanup() {
    print_status "Cleaning up test artifacts..."
    rm -rf test-results playwright-report
}

# Main execution
main() {
    echo "🎨 Generative Art Gallery E2E Test Suite"
    echo "========================================"
    
    # Parse command line arguments
    case "${1:-all}" in
        "frontend")
            check_services
            install_browsers
            run_frontend_tests
            ;;
        "api")
            check_services
            install_browsers
            run_api_tests
            ;;
        "contract")
            install_browsers
            run_contract_tests
            ;;
        "all")
            check_services
            install_browsers
            run_all_tests
            ;;
        "report")
            generate_report
            ;;
        "clean")
            cleanup
            ;;
        *)
            echo "Usage: $0 [frontend|api|contract|all|report|clean]"
            echo ""
            echo "Commands:"
            echo "  frontend  - Run only frontend E2E tests"
            echo "  api       - Run only GAN service API tests"
            echo "  contract  - Run only smart contract integration tests"
            echo "  all       - Run all E2E tests (default)"
            echo "  report    - Show test report"
            echo "  clean     - Clean up test artifacts"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "✅ E2E Test Suite completed successfully!"
    echo ""
    echo "📊 To view the test report, run: $0 report"
    echo "🧹 To clean up test artifacts, run: $0 clean"
}

# Make sure script is executable
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi