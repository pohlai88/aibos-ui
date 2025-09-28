# AIBOS Utils Package Lock System

## Overview
The `@aibos/utils` package is protected by a comprehensive locking system to prevent unauthorized modifications and ensure production stability.

## Lock Status
- **Status**: 🔒 ACTIVE
- **Protection Level**: HIGH
- **Last Updated**: 2024-12-19

## Protected Files
The following files are protected and require approval for modification:
- `src/index.ts` - Main package exports
- `src/security.ts` - Security utilities
- `src/safe-object.ts` - Safe object operations
- `src/safeFs.ts` - Safe filesystem operations
- `src/type-guards.ts` - Type guard utilities
- `src/code-quality.ts` - Code quality utilities
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `tsup.config.ts` - Build configuration

## How It Works

### 1. File Integrity Monitoring
- Each protected file has a SHA-256 hash stored in `.lockfile`
- Any modification to protected files changes their hash
- The system detects hash mismatches and blocks unauthorized changes

### 2. Build-Time Protection
- All build commands (`build`, `build:types`, `build:js`, `dev`) run lock checks first
- If unauthorized changes are detected, the build process is terminated
- This prevents compromised code from being built or distributed

### 3. Git Integration
- `.gitattributes` ensures consistent file handling
- Pre-commit hooks (when available) prevent unauthorized commits
- File permissions are set to prevent accidental modifications

## Available Commands

### Lock Management
```bash
# Check lock status
pnpm run lock:status

# Verify package integrity
pnpm run lock:check

# Update lock file with current file hashes
pnpm run lock:update-hashes

# Initialize lock system
pnpm run lock:init
```

### Development Commands (Protected)
```bash
# Build package (includes lock check)
pnpm run build

# Development mode (includes lock check)
pnpm run dev

# Type checking (includes lock check)
pnpm run typecheck
```

## Approval Process

### For Package Maintainers
1. Review the change request
2. Assess impact and risk
3. Provide formal approval signature
4. Update `.lockfile` with approval
5. Monitor implementation

### For Developers
1. Create detailed change request
2. Submit to package maintainer
3. Wait for approval
4. Implement approved changes
5. Update lock file with completion signature

## Emergency Procedures

### Critical Security Fixes
- Expedited approval process available
- Immediate implementation allowed
- Retroactive documentation required

### Rollback Process
- Revert to last known good state
- Update lock file with rollback signature
- Document issue and resolution

## Security Features

### Hash Verification
- SHA-256 hashes for all protected files
- Automatic integrity checking
- Tamper detection and prevention

### Build Protection
- Lock checks integrated into all build processes
- Prevents compromised builds
- Ensures only approved code is distributed

### Access Control
- Formal approval process required
- Audit trail for all changes
- Clear escalation procedures

## Troubleshooting

### Lock Check Fails
```bash
# Check which files have changed
pnpm run lock:check

# If changes are authorized, update hashes
pnpm run lock:update-hashes
```

### Build Fails Due to Lock
```bash
# Verify lock status
pnpm run lock:status

# Check file integrity
pnpm run lock:check

# Contact package maintainer if issues persist
```

### Need to Make Changes
1. Follow the approval workflow in `.approval-workflow.md`
2. Get proper authorization
3. Update lock file with approval
4. Make changes
5. Update lock file with completion

## Contact Information

### Package Maintainer
- **Name**: [TO BE DEFINED]
- **Email**: [TO BE DEFINED]
- **Responsibilities**: Primary approval authority

### Technical Lead
- **Name**: [TO BE DEFINED]
- **Email**: [TO BE DEFINED]
- **Responsibilities**: Technical review

### Security Team
- **Contact**: [TO BE DEFINED]
- **Responsibilities**: Security-related changes

## Compliance

### Requirements
- All changes must be documented
- Approval signatures must be recorded
- Impact assessment required
- Testing mandatory

### Monitoring
- Regular integrity checks
- Audit trail maintenance
- Compliance reporting

---

**⚠️ IMPORTANT**: This package is locked for production stability. Any modifications without proper approval will be rejected and may result in disciplinary action.

**🔒 LOCK STATUS**: ACTIVE - Package is protected and secure.
