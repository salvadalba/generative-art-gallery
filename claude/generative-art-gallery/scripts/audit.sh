#!/bin/bash

# Security and Performance Audit Script
# This script runs comprehensive security and performance audits

set -e

echo "🔍 Starting Security & Performance Audit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_section() {
    echo -e "${BLUE}[AUDIT]${NC} $1"
}

# Security audit functions
run_security_audit() {
    print_section "🔒 Running Security Audit..."
    
    # Check for hardcoded secrets
    print_status "Checking for hardcoded secrets..."
    if grep -r -i "private.*key\|secret.*key\|api.*key\|password" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ gan-service/; then
        print_warning "Found potential hardcoded secrets"
    else
        print_status "✅ No hardcoded secrets found"
    fi
    
    # Check for console.log statements
    print_status "Checking for console.log statements..."
    if grep -r "console\.log\|console\.warn\|console\.error" --include="*.ts" --include="*.tsx" src/; then
        print_warning "Found console statements (remove in production)"
    else
        print_status "✅ No console statements found"
    fi
    
    # Check for eval() usage
    print_status "Checking for eval() usage..."
    if grep -r "eval(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ gan-service/; then
        print_error "❌ Found eval() usage - security risk!"
    else
        print_status "✅ No eval() usage found"
    fi
    
    # Check for dangerous regex patterns
    print_status "Checking for dangerous regex patterns..."
    if grep -r "new RegExp.*\*.*\*" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ gan-service/; then
        print_warning "Found potentially dangerous regex patterns"
    else
        print_status "✅ No dangerous regex patterns found"
    fi
    
    # Check file permissions
    print_status "Checking file permissions..."
    find . -type f -name "*.sh" -o -name "*.py" -o -name "*.js" -o -name "*.ts" | while read file; do
        if [[ $(stat -c "%a" "$file") -gt 644 ]]; then
            print_warning "File $file has excessive permissions"
        fi
    done
    print_status "✅ File permissions check completed"
    
    # Check for sensitive files
    print_status "Checking for sensitive files..."
    if find . -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.pfx" | grep -v node_modules | grep -v .git; then
        print_warning "Found potential sensitive files"
    else
        print_status "✅ No sensitive files found"
    fi
}

# Performance audit functions
run_performance_audit() {
    print_section "⚡ Running Performance Audit..."
    
    # Check bundle size
    print_status "Checking bundle size..."
    if [ -f "dist/assets/index-*.js" ]; then
        BUNDLE_SIZE=$(stat -c%s dist/assets/index-*.js)
        BUNDLE_SIZE_MB=$((BUNDLE_SIZE / 1024 / 1024))
        if [ $BUNDLE_SIZE_MB -gt 2 ]; then
            print_warning "Bundle size is large: ${BUNDLE_SIZE_MB}MB (target: <2MB)"
        else
            print_status "✅ Bundle size is good: ${BUNDLE_SIZE_MB}MB"
        fi
    else
        print_warning "Bundle not found, run 'npm run build' first"
    fi
    
    # Check for large assets
    print_status "Checking for large assets..."
    find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" | grep -v node_modules | while read file; do
        SIZE=$(stat -c%s "$file")
        SIZE_KB=$((SIZE / 1024))
        if [ $SIZE_KB -gt 500 ]; then
            print_warning "Large image found: $file (${SIZE_KB}KB)"
        fi
    done
    print_status "✅ Large asset check completed"
    
    # Check for unused dependencies
    print_status "Checking for unused dependencies..."
    if command -v depcheck &> /dev/null; then
        depcheck
    else
        print_warning "depcheck not installed, skipping unused dependency check"
    fi
    
    # Check for performance anti-patterns
    print_status "Checking for performance anti-patterns..."
    if grep -r "setTimeout.*0\|setInterval.*0" --include="*.ts" --include="*.tsx" src/; then
        print_warning "Found potential performance issues with timers"
    else
        print_status "✅ No obvious performance anti-patterns found"
    fi
    
    # Check for memory leaks
    print_status "Checking for potential memory leaks..."
    if grep -r "addEventListener.*window\|addEventListener.*document" --include="*.ts" --include="*.tsx" src/ | grep -v "removeEventListener"; then
        print_warning "Found event listeners without cleanup"
    else
        print_status "✅ No obvious memory leaks found"
    fi
}

# Code quality audit
run_code_quality_audit() {
    print_section "📋 Running Code Quality Audit..."
    
    # Run ESLint
    print_status "Running ESLint..."
    if npm run lint; then
        print_status "✅ ESLint passed"
    else
        print_error "❌ ESLint found issues"
    fi
    
    # Run TypeScript check
    print_status "Running TypeScript check..."
    if npm run check; then
        print_status "✅ TypeScript check passed"
    else
        print_error "❌ TypeScript check failed"
    fi
    
    # Check for TODO/FIXME comments
    print_status "Checking for TODO/FIXME comments..."
    TODO_COUNT=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" src/ | wc -l)
    if [ $TODO_COUNT -gt 0 ]; then
        print_warning "Found $TODO_COUNT TODO/FIXME comments"
    else
        print_status "✅ No TODO/FIXME comments found"
    fi
    
    # Check for duplicate code
    print_status "Checking for code duplication..."
    if command -v jscpd &> /dev/null; then
        jscpd --threshold 5 src/
    else
        print_warning "jscpd not installed, skipping duplicate code check"
    fi
}

# Contract security audit
run_contract_audit() {
    print_section "🔗 Running Smart Contract Security Audit..."
    
    # Check if we're in the contracts directory
    if [ -d "contracts" ]; then
        cd contracts
        
        # Run Slither if available
        if command -v slither &> /dev/null; then
            print_status "Running Slither analysis..."
            slither . --exclude-informational --exclude-low --exclude-dependencies
        else
            print_warning "Slither not installed, skipping contract security analysis"
        fi
        
        # Run Mythril if available
        if command -v myth &> /dev/null; then
            print_status "Running Mythril analysis..."
            myth analyze contracts/GenerativeArtNFT.sol
        else
            print_warning "Mythril not installed, skipping symbolic execution analysis"
        fi
        
        # Check for common vulnerabilities
        print_status "Checking for common smart contract vulnerabilities..."
        
        # Check for reentrancy
        if grep -r "call\.value\|\.call" --include="*.sol" .; then
            print_warning "Found potential reentrancy vulnerabilities"
        else
            print_status "✅ No obvious reentrancy patterns found"
        fi
        
        # Check for integer overflow
        if grep -r "+.*-\|*.*-\|^+\|^*" --include="*.sol" .; then
            print_warning "Found potential integer overflow issues"
        else
            print_status "✅ No obvious integer overflow patterns found"
        fi
        
        # Check for access control
        if grep -r "onlyOwner\|onlyRole" --include="*.sol" .; then
            print_status "✅ Access control patterns found"
        else
            print_warning "No explicit access control patterns found"
        fi
        
        cd ..
    else
        print_warning "Contracts directory not found, skipping contract audit"
    fi
}

# Dependency audit
run_dependency_audit() {
    print_section "📦 Running Dependency Audit..."
    
    # Run npm audit
    print_status "Running npm audit..."
    if npm audit --audit-level=moderate; then
        print_status "✅ No security vulnerabilities found in dependencies"
    else
        print_error "❌ Security vulnerabilities found in dependencies"
    fi
    
    # Check for outdated packages
    print_status "Checking for outdated packages..."
    if npm outdated; then
        print_status "✅ All packages are up to date"
    else
        print_warning "Some packages are outdated"
    fi
    
    # Check for known vulnerabilities
    print_status "Checking for known vulnerabilities..."
    if command -v snyk &> /dev/null; then
        snyk test
    else
        print_warning "Snyk not installed, skipping known vulnerability check"
    fi
}

# Configuration audit
run_config_audit() {
    print_section "⚙️ Running Configuration Audit..."
    
    # Check environment variables
    print_status "Checking environment variables..."
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        print_warning ".env file not found, copying from .env.example"
        cp .env.example .env
    fi
    
    # Check for default passwords
    print_status "Checking for default passwords..."
    if grep -r "password.*admin\|admin.*password\|123456\|password123" --include="*.ts" --include="*.js" --include="*.json" .; then
        print_error "❌ Found default passwords"
    else
        print_status "✅ No default passwords found"
    fi
    
    # Check CORS configuration
    print_status "Checking CORS configuration..."
    if grep -r "cors.*origin.*\*\|Access-Control-Allow-Origin.*\*" --include="*.ts" --include="*.js" .; then
        print_warning "Found permissive CORS configuration"
    else
        print_status "✅ No permissive CORS found"
    fi
    
    # Check SSL/TLS configuration
    print_status "Checking SSL/TLS configuration..."
    if [ -f "vercel.json" ]; then
        if grep -q "force.*true" vercel.json; then
            print_status "✅ HTTPS enforcement configured"
        else
            print_warning "HTTPS enforcement not configured"
        fi
    fi
}

# Generate audit report
generate_audit_report() {
    print_section "📊 Generating Audit Report..."
    
    REPORT_FILE="audit-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# Security & Performance Audit Report

Generated: $(date)

## Summary

This report contains the results of the security and performance audit for the Generative Art Gallery application.

## Security Findings

### High Priority Issues
- [ ] Review any issues marked as ERROR in the audit output
- [ ] Address any hardcoded secrets or API keys
- [ ] Fix any eval() usage or dangerous patterns

### Medium Priority Issues
- [ ] Review console.log statements for production readiness
- [ ] Address any permissive CORS configurations
- [ ] Update any outdated dependencies

### Low Priority Issues
- [ ] Review TODO/FIXME comments
- [ ] Optimize bundle size if >2MB
- [ ] Consider implementing additional security headers

## Performance Findings

### Optimization Opportunities
- [ ] Review large assets (>500KB)
- [ ] Address any memory leak patterns
- [ ] Optimize bundle size if necessary

### Monitoring Recommendations
- [ ] Implement performance monitoring
- [ ] Set up error tracking
- [ ] Configure real user monitoring (RUM)

## Next Steps

1. Address high priority security issues immediately
2. Implement performance optimizations
3. Set up continuous monitoring
4. Schedule regular security audits

## Contact

For questions about this audit report, contact the development team.
EOF

    print_status "Audit report generated: $REPORT_FILE"
}

# Main execution
main() {
    echo "🔍 Generative Art Gallery Security & Performance Audit"
    echo "====================================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-all}" in
        "security")
            run_security_audit
            ;;
        "performance")
            run_performance_audit
            ;;
        "quality")
            run_code_quality_audit
            ;;
        "contract")
            run_contract_audit
            ;;
        "dependencies")
            run_dependency_audit
            ;;
        "config")
            run_config_audit
            ;;
        "all")
            run_security_audit
            echo ""
            run_performance_audit
            echo ""
            run_code_quality_audit
            echo ""
            run_contract_audit
            echo ""
            run_dependency_audit
            echo ""
            run_config_audit
            echo ""
            generate_audit_report
            ;;
        *)
            echo "Usage: $0 [security|performance|quality|contract|dependencies|config|all]"
            echo ""
            echo "Commands:"
            echo "  security     - Run security audit only"
            echo "  performance  - Run performance audit only"
            echo "  quality      - Run code quality audit only"
            echo "  contract     - Run smart contract audit only"
            echo "  dependencies - Run dependency audit only"
            echo "  config       - Run configuration audit only"
            echo "  all          - Run all audits (default)"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "✅ Audit completed successfully!"
    echo ""
    echo "📋 Review the findings above and address any issues marked as ERROR."
    echo "📊 To generate a detailed report, run with 'all' option."
}

# Make sure script is executable
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi