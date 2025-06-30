# Claude Code Tool Testing Checklist

## Built-in Tools (16 total)

### Core Development Tools
- [ ] Task - Launch agent for complex searches
- [ ] Bash - Execute bash commands

### File Management Tools  
- [ ] Read - Read file contents
- [ ] Write - Write content to files
- [ ] Edit - Perform string replacements
- [ ] MultiEdit - Multiple edits in one operation

### Search and Discovery Tools
- [ ] Glob - Pattern matching for files
- [ ] Grep - Content search with regex
- [ ] LS - List directory contents

### Jupyter Notebook Tools
- [ ] NotebookRead - Read notebook cells
- [ ] NotebookEdit - Edit notebook cells

### Task Management Tools
- [ ] TodoRead - Read current todo list
- [ ] TodoWrite - Manage todo lists

### Web and Network Tools
- [ ] WebFetch - Fetch and analyze web content
- [ ] WebSearch - Search the web

### Utility Tools
- [ ] exit_plan_mode - Exit planning mode

## MCP Tools (60+ functions across 7 servers)

### MCP Resource Management (2 functions)
- [ ] ListMcpResourcesTool - List MCP resources
- [ ] ReadMcpResourceTool - Read MCP resources

### Excalidraw Integration (11 functions)
- [ ] mcp__mcp_excalidraw__create_element - Create new element
- [ ] mcp__mcp_excalidraw__update_element - Update existing element
- [ ] mcp__mcp_excalidraw__delete_element - Delete element
- [ ] mcp__mcp_excalidraw__query_elements - Query elements with filters
- [ ] mcp__mcp_excalidraw__get_resource - Get Excalidraw resource
- [ ] mcp__mcp_excalidraw__group_elements - Group elements
- [ ] mcp__mcp_excalidraw__ungroup_elements - Ungroup elements
- [ ] mcp__mcp_excalidraw__align_elements - Align elements
- [ ] mcp__mcp_excalidraw__distribute_elements - Distribute elements
- [ ] mcp__mcp_excalidraw__lock_elements - Lock elements
- [ ] mcp__mcp_excalidraw__unlock_elements - Unlock elements

### Sequential Thinking (1 function)
- [ ] mcp__sequential-thinking__sequentialthinking - Structured problem solving

### Context7 Library Documentation (2 functions)
- [ ] mcp__context7__resolve-library-id - Resolve library names to IDs
- [ ] mcp__context7__get-library-docs - Get library documentation

### Puppeteer Browser Automation (6 functions)
- [ ] mcp__puppeteer__puppeteer_navigate - Navigate to URL
- [ ] mcp__puppeteer__puppeteer_screenshot - Take screenshot
- [ ] mcp__puppeteer__puppeteer_click - Click element
- [ ] mcp__puppeteer__puppeteer_fill - Fill input field
- [ ] mcp__puppeteer__puppeteer_select - Select dropdown option
- [ ] mcp__puppeteer__puppeteer_hover - Hover over element
- [ ] mcp__puppeteer__puppeteer_evaluate - Execute JavaScript

### Screenshot Management (3 functions)
- [ ] mcp__snap-happy__GetLastScreenshot - Get last screenshot
- [ ] mcp__snap-happy__TakeScreenshot - Take new screenshot
- [ ] mcp__snap-happy__ListWindows - List windows (macOS)

### Supabase Integration (25 functions)

#### Project Management (6 functions)
- [ ] mcp__supabase__list_organizations - List organizations
- [ ] mcp__supabase__get_organization - Get org details
- [ ] mcp__supabase__list_projects - List projects
- [ ] mcp__supabase__get_project - Get project details
- [ ] mcp__supabase__create_project - Create new project
- [ ] mcp__supabase__pause_project - Pause project
- [ ] mcp__supabase__restore_project - Restore project

#### Branch Management (6 functions)
- [ ] mcp__supabase__create_branch - Create dev branch
- [ ] mcp__supabase__list_branches - List branches
- [ ] mcp__supabase__delete_branch - Delete branch
- [ ] mcp__supabase__merge_branch - Merge to production
- [ ] mcp__supabase__reset_branch - Reset branch
- [ ] mcp__supabase__rebase_branch - Rebase branch

#### Database Operations (5 functions)
- [ ] mcp__supabase__list_tables - List tables
- [ ] mcp__supabase__list_extensions - List extensions
- [ ] mcp__supabase__list_migrations - List migrations
- [ ] mcp__supabase__apply_migration - Apply DDL migration
- [ ] mcp__supabase__execute_sql - Execute SQL

#### Utilities (8 functions)
- [ ] mcp__supabase__get_cost - Get cost estimates
- [ ] mcp__supabase__confirm_cost - Confirm costs
- [ ] mcp__supabase__get_logs - Get service logs
- [ ] mcp__supabase__get_advisors - Security/performance advisors
- [ ] mcp__supabase__get_project_url - Get API URL
- [ ] mcp__supabase__get_anon_key - Get anonymous key
- [ ] mcp__supabase__generate_typescript_types - Generate types
- [ ] mcp__supabase__search_docs - Search documentation
- [ ] mcp__supabase__list_edge_functions - List edge functions
- [ ] mcp__supabase__deploy_edge_function - Deploy edge function

### Linear Project Management (18 functions)

#### Issue Management (5 functions)
- [ ] mcp__linear__get_issue - Get issue details
- [ ] mcp__linear__list_issues - List issues
- [ ] mcp__linear__create_issue - Create new issue
- [ ] mcp__linear__update_issue - Update issue
- [ ] mcp__linear__list_my_issues - List my issues

#### Comments (2 functions)
- [ ] mcp__linear__list_comments - Get issue comments
- [ ] mcp__linear__create_comment - Add comment

#### Project Management (3 functions)
- [ ] mcp__linear__list_projects - List projects
- [ ] mcp__linear__get_project - Get project details
- [ ] mcp__linear__create_project - Create project
- [ ] mcp__linear__update_project - Update project

#### Organization (6 functions)
- [ ] mcp__linear__list_teams - List teams
- [ ] mcp__linear__get_team - Get team details
- [ ] mcp__linear__list_users - List users
- [ ] mcp__linear__get_user - Get user details
- [ ] mcp__linear__list_issue_statuses - List statuses
- [ ] mcp__linear__get_issue_status - Get status details
- [ ] mcp__linear__list_issue_labels - List labels

#### Documentation (2 functions)
- [ ] mcp__linear__list_documents - List documents
- [ ] mcp__linear__get_document - Get document
- [ ] mcp__linear__search_documentation - Search docs

## Tools That Cannot Be Safely Called

### Destructive Operations (Require Real Resources)
- mcp__supabase__create_project - Requires organization ID and creates billable resources
- mcp__supabase__create_branch - Requires project ID and creates billable resources
- mcp__supabase__delete_branch - Destructive operation
- mcp__supabase__pause_project - Changes project state
- mcp__supabase__restore_project - Changes project state
- mcp__supabase__apply_migration - Modifies database schema
- mcp__supabase__deploy_edge_function - Deploys code to production
- mcp__linear__create_issue - Creates real issues in workspace
- mcp__linear__update_issue - Modifies real issues
- mcp__linear__create_comment - Creates real comments
- mcp__linear__create_project - Creates real projects
- mcp__linear__update_project - Modifies real projects

### Requires External Authentication/Setup
- All mcp__supabase__ functions (require Supabase auth)
- All mcp__linear__ functions (require Linear auth)
- mcp__puppeteer__ functions (require browser setup)

### File System Modifying Operations
- Write - Creates/overwrites files
- Edit - Modifies files
- MultiEdit - Modifies files
- NotebookEdit - Modifies notebooks

## Testing Strategy

### Safe to Call (No Side Effects)
1. **Read-only operations**: Read, LS, Glob, Grep, TodoRead, NotebookRead
2. **List operations**: ListMcpResourcesTool, ReadMcpResourceTool
3. **Query operations**: mcp__mcp_excalidraw__query_elements, mcp__mcp_excalidraw__get_resource
4. **Screenshot operations**: mcp__snap-happy__GetLastScreenshot, mcp__snap-happy__ListWindows
5. **Search operations**: WebSearch, mcp__context7__resolve-library-id

### Test with Mock Data
1. **Thinking tools**: mcp__sequential-thinking__sequentialthinking
2. **Excalidraw creation**: mcp__mcp_excalidraw__create_element
3. **Task management**: TodoWrite

### Test with Temporary Files
1. **File operations**: Write, Edit, MultiEdit (use temp files)
2. **Bash commands**: Non-destructive commands only

### Skip (Too Risky/Require Real Setup)
1. **External service operations**: Supabase, Linear functions
2. **Browser automation**: Puppeteer functions
3. **Destructive operations**: File modifications in real directories

---

**Total Tools to Test: ~30 safe operations**
**Tools to Skip: ~46 risky/external operations**