#!/bin/bash

# Claude Codex API Integration Test Script
# This script validates the parser integration with the API server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3456"
FAILED_TESTS=0
PASSED_TESTS=0

# Helper functions
log_test() {
    echo -e "\n🧪 $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if server is running
check_server() {
    log_test "Checking if API server is running..."
    
    if curl -s --fail $API_URL/health > /dev/null 2>&1; then
        log_success "Server is running"
        return 0
    else
        log_error "Server is not running at $API_URL"
        echo "Please start the server with: cd apps/api-server && bun run dev"
        exit 1
    fi
}

# Test health endpoint
test_health() {
    log_test "Testing health endpoint..."
    
    HEALTH=$(curl -s $API_URL/health)
    STATUS=$(echo $HEALTH | jq -r '.status' 2>/dev/null || echo "error")
    
    if [ "$STATUS" = "healthy" ]; then
        log_success "Health check passed"
    else
        log_error "Health check failed: $STATUS"
    fi
}

# Test sessions endpoint
test_sessions() {
    log_test "Testing sessions endpoint..."
    
    SESSIONS=$(curl -s $API_URL/sessions)
    SESSION_COUNT=$(echo $SESSIONS | jq '.sessions | length' 2>/dev/null || echo 0)
    
    if [ $SESSION_COUNT -gt 0 ]; then
        log_success "Found $SESSION_COUNT sessions"
        
        # Export first session ID for other tests
        export TEST_SESSION_ID=$(echo $SESSIONS | jq -r '.sessions[0].id')
        export TEST_SESSION_PATH=$(echo $SESSIONS | jq -r '.sessions[0].projectPath')
        echo "  Using session: $TEST_SESSION_ID"
        echo "  Project: $TEST_SESSION_PATH"
    else
        log_warning "No sessions found - some tests will be skipped"
        log_warning "Create some Claude Code logs to test with real data"
        return 1
    fi
}

# Test enhanced history endpoint
test_enhanced_history() {
    log_test "Testing enhanced history endpoint..."
    
    if [ -z "$TEST_SESSION_ID" ]; then
        log_warning "Skipping - no test session available"
        return
    fi
    
    HISTORY=$(curl -s "$API_URL/sessions/$TEST_SESSION_ID/enhanced-history?limit=50")
    TOTAL_ENTRIES=$(echo $HISTORY | jq '.history | length' 2>/dev/null || echo 0)
    PARSED_ENTRIES=$(echo $HISTORY | jq '[.history[] | select(.parsedProps != null)] | length' 2>/dev/null || echo 0)
    
    if [ $TOTAL_ENTRIES -gt 0 ]; then
        log_success "Retrieved $TOTAL_ENTRIES entries, $PARSED_ENTRIES with parsed props"
        
        # Check for different tool types
        TOOL_TYPES=$(echo $HISTORY | jq -r '.history[] | select(.parsedProps != null) | .parsedProps.toolType' | sort | uniq)
        if [ -n "$TOOL_TYPES" ]; then
            echo "  Found tool types:"
            echo "$TOOL_TYPES" | sed 's/^/    - /'
        fi
    else
        log_error "No history entries found"
    fi
}

# Test parser functionality
test_parsers() {
    log_test "Testing parser functionality..."
    
    if [ -z "$TEST_SESSION_ID" ]; then
        log_warning "Skipping - no test session available"
        return
    fi
    
    # Get more entries to find tools
    HISTORY=$(curl -s "$API_URL/sessions/$TEST_SESSION_ID/enhanced-history?limit=200")
    
    # Test specific tool parsing
    test_tool_parser "Bash" '.command' "command field"
    test_tool_parser "Read" '.filePath' "filePath field"
    test_tool_parser "Write" '.content' "content field"
    test_tool_parser "Edit" '.oldString' "oldString field"
}

# Helper to test individual tool parser
test_tool_parser() {
    local TOOL_TYPE=$1
    local FIELD_PATH=$2
    local FIELD_NAME=$3
    
    TOOL_ENTRY=$(echo $HISTORY | jq ".history[] | select(.parsedProps.toolType == \"$TOOL_TYPE\") | .parsedProps.props" | head -n 1)
    
    if [ -n "$TOOL_ENTRY" ] && [ "$TOOL_ENTRY" != "null" ]; then
        FIELD_VALUE=$(echo $TOOL_ENTRY | jq -r "$FIELD_PATH" 2>/dev/null)
        if [ -n "$FIELD_VALUE" ] && [ "$FIELD_VALUE" != "null" ]; then
            log_success "$TOOL_TYPE parser working - found $FIELD_NAME"
        else
            log_error "$TOOL_TYPE parser issue - missing $FIELD_NAME"
        fi
    else
        log_warning "$TOOL_TYPE tool not found in test data"
    fi
}

# Test error handling
test_error_handling() {
    log_test "Testing error handling..."
    
    # Test invalid UUID format
    ERROR_RESPONSE=$(curl -s "$API_URL/sessions/invalid-uuid")
    ERROR_CODE=$(echo $ERROR_RESPONSE | jq -r '.error' 2>/dev/null)
    
    if [ "$ERROR_CODE" = "INVALID_SESSION_ID" ]; then
        log_success "Invalid UUID error handling works"
    else
        log_error "Invalid UUID not handled properly"
    fi
    
    # Test non-existent session
    ERROR_RESPONSE=$(curl -s "$API_URL/sessions/00000000-0000-0000-0000-000000000000")
    ERROR_CODE=$(echo $ERROR_RESPONSE | jq -r '.error' 2>/dev/null)
    
    if [ "$ERROR_CODE" = "SESSION_NOT_FOUND" ]; then
        log_success "Non-existent session error handling works"
    else
        log_error "Non-existent session not handled properly"
    fi
}

# Test pagination
test_pagination() {
    log_test "Testing pagination..."
    
    if [ -z "$TEST_SESSION_ID" ]; then
        log_warning "Skipping - no test session available"
        return
    fi
    
    # Get first page
    PAGE1=$(curl -s "$API_URL/sessions/$TEST_SESSION_ID/history?limit=10&offset=0")
    TOTAL=$(echo $PAGE1 | jq '.pagination.total' 2>/dev/null || echo 0)
    
    if [ $TOTAL -gt 10 ]; then
        # Get second page
        PAGE2=$(curl -s "$API_URL/sessions/$TEST_SESSION_ID/history?limit=10&offset=10")
        PAGE2_COUNT=$(echo $PAGE2 | jq '.history | length' 2>/dev/null || echo 0)
        
        if [ $PAGE2_COUNT -gt 0 ]; then
            log_success "Pagination working - retrieved multiple pages"
        else
            log_error "Pagination issue - second page empty"
        fi
    else
        log_warning "Not enough entries to test pagination (need > 10, have $TOTAL)"
    fi
}

# Test performance
test_performance() {
    log_test "Testing performance..."
    
    if [ -z "$TEST_SESSION_ID" ]; then
        log_warning "Skipping - no test session available"
        return
    fi
    
    # Time the enhanced history endpoint
    START_TIME=$(date +%s.%N)
    curl -s "$API_URL/sessions/$TEST_SESSION_ID/enhanced-history?limit=100" > /dev/null
    END_TIME=$(date +%s.%N)
    
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    
    if (( $(echo "$DURATION < 2.0" | bc -l) )); then
        log_success "Performance good - 100 entries in ${DURATION}s"
    else
        log_warning "Performance slow - 100 entries took ${DURATION}s"
    fi
}

# Calculate parsing statistics
calculate_stats() {
    log_test "Calculating parsing statistics..."
    
    if [ -z "$TEST_SESSION_ID" ]; then
        log_warning "Skipping - no test session available"
        return
    fi
    
    STATS=$(curl -s "$API_URL/sessions/$TEST_SESSION_ID/enhanced-history?limit=500" | jq '{
        total_messages: .history | length,
        tool_calls: [.history[] | select(.type == "assistant" and (.content | type == "array") and .content[0].type == "tool_use")] | length,
        parsed_tools: [.history[] | select(.parsedProps != null)] | length
    }')
    
    TOTAL=$(echo $STATS | jq '.total_messages')
    TOOLS=$(echo $STATS | jq '.tool_calls')
    PARSED=$(echo $STATS | jq '.parsed_tools')
    
    if [ $TOOLS -gt 0 ]; then
        PARSE_RATE=$(echo "scale=1; $PARSED * 100 / $TOOLS" | bc)
        echo "  📊 Statistics:"
        echo "    - Total messages: $TOTAL"
        echo "    - Tool calls: $TOOLS"
        echo "    - Successfully parsed: $PARSED"
        echo "    - Parse rate: ${PARSE_RATE}%"
        
        if (( $(echo "$PARSE_RATE > 80" | bc -l) )); then
            log_success "High parse rate: ${PARSE_RATE}%"
        else
            log_warning "Low parse rate: ${PARSE_RATE}%"
        fi
    else
        log_warning "No tool calls found in session"
    fi
}

# Main test execution
main() {
    echo "========================================"
    echo "Claude Codex API Integration Test Suite"
    echo "========================================"
    
    # Check prerequisites
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required but not installed."
        echo "Install with: brew install jq"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        echo "Error: bc is required but not installed."
        echo "Install with: brew install bc"
        exit 1
    fi
    
    # Run tests
    check_server
    test_health
    test_sessions
    
    if [ $? -eq 0 ]; then
        test_enhanced_history
        test_parsers
        test_error_handling
        test_pagination
        test_performance
        calculate_stats
    fi
    
    # Summary
    echo -e "\n========================================"
    echo "Test Results Summary"
    echo "========================================"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}⚠️  Some tests failed${NC}"
        exit 1
    fi
}

# Run the tests
main