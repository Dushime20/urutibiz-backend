# Project Cleanup Plan

## Current Issues
1. **Root Directory Clutter**: 100+ files in root directory
2. **Scattered Test Files**: Test files mixed between root, /test, and /tests directories
3. **Documentation Spread**: MD files scattered in root instead of organized structure
4. **Demo/Script Files**: Various scripts and demo files not properly organized
5. **Duplicate/Legacy Files**: Multiple similar files that may be outdated

## Proposed Structure
```
/
├── docs/                          # All documentation
│   ├── api/                       # API documentation
│   ├── testing/                   # Testing documentation
│   ├── implementation/            # Implementation guides
│   └── deployment/                # Deployment docs
├── scripts/                       # Build, setup, and utility scripts
├── tests/                         # All test files (unit, integration, e2e)
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── utils/
├── examples/                      # Code examples and demos
├── src/                          # Source code (already organized)
├── database/                     # Database migrations and seeds
├── docker/                       # Docker-related files
└── [config files]               # Keep essential config in root

```

## Cleanup Steps
1. **Create organized directory structure**
2. **Move documentation files to /docs with subcategories**
3. **Consolidate all test files into /tests with proper organization**
4. **Move demo and utility scripts to appropriate directories**
5. **Remove duplicate/outdated files**
6. **Update references and imports**
7. **Update .gitignore and other config files**

## Files to Organize

### Documentation (move to /docs)
- All .md files currently in root
- Organize by category (API, testing, implementation, etc.)

### Test Files (consolidate in /tests)
- test-*.js files in root
- Existing /test directory contents
- Existing /tests directory contents

### Scripts (organize in /scripts)
- setup-*.bat, setup-*.ps1, setup-*.sh
- debug-*.js, analyze-*.js, check-*.js
- verify-*.js files

### Demo Files (move to /examples)
- demo-*.js files
- example usage files

### Docker Files (organize in /docker)
- docker-compose.*.yml files
- Dockerfile-related files
