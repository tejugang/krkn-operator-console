# Backup & Restore Implementation

## Overview

Complete implementation of backup and restore functionality in the krkn-operator-console. This integrates with the REST API endpoints provided by the krkn-operator backend.

## Files Created

### 1. API Service
- **[src/services/backupRestoreApi.ts](src/services/backupRestoreApi.ts)**
  - Encapsulates API calls to `/api/v1/backup` and `/api/v1/restore` endpoints
  - Provides `startBackup()` and `startRestore()` methods
  - Handles optional backup names and required backup paths
  - Returns job IDs for tracking async operations

### 2. React Component
- **[src/components/BackupRestoreCard.tsx](src/components/BackupRestoreCard.tsx)**
  - Card component with two buttons: "Create Backup" and "Restore from Backup"
  - Implements multi-step backup flow:
    1. User clicks "Create Backup"
    2. Optional dialog for custom backup name
    3. API call triggers backup job
    4. Success notification with job ID
  - Implements multi-step restore flow:
    1. User clicks "Restore from Backup"
    2. Modal prompts for backup file path
    3. Shows confirmation dialog with destructive action warning
    4. API call triggers restore job
    5. Success notification with job ID
  - Admin-only component (access via role check in parent)

### 3. Settings Integration
- **[src/components/Settings.tsx](src/components/Settings.tsx)** (modified)
  - Added "Backup & Restore" tab (eventKey={5})
  - Tab visible only to admin users (`{isAdmin && ...}`)
  - Placed as new tab alongside existing admin tabs

### 4. Tests
- **[src/services/__tests__/backupRestoreApi.test.ts](src/services/__tests__/backupRestoreApi.test.ts)**
  - 5 unit tests covering API service
  - Tests backup with and without custom names
  - Tests error handling for both endpoints
  - All tests passing ✓

- **[src/components/BackupRestoreCard.test.tsx](src/components/BackupRestoreCard.test.tsx)**
  - 2 component render tests
  - Verifies buttons and text are displayed
  - All tests passing ✓

## Features

### Backup Flow
1. **User clicks "Create Backup"** button
2. **Optional backup name dialog** opens
   - User can enter custom name (e.g., "pre-upgrade")
   - Or use default: `krkn-backup-YYYY-MM-DD.tar.gz`
3. **API call** `POST /api/v1/backup` with optional backupName
4. **Returns job ID** for async tracking
5. **Success notification** shows:
   - Job ID
   - Where backup will be saved: `/tmp/[name].tar.gz`

### Restore Flow
1. **User clicks "Restore from Backup"** button
2. **Path input dialog** opens
   - User enters backup file path (e.g., `/tmp/krkn-backup-2025-08-28.tar.gz`)
3. **Confirmation dialog** appears with:
   - ⚠️ Warning: "This will REPLACE all users, groups, targets, providers, and credentials"
   - Path being restored
   - User must explicitly confirm
4. **API call** `POST /api/v1/restore` with backupPath
5. **Returns job ID** for async tracking
6. **Success notification** suggests:
   - Refresh page when restore completes to reload configuration

## UI/UX Details

### Admin-Only Access
- Tab only visible when `isAdmin === true`
- Uses existing `useRole()` hook
- Consistent with other admin features (registries, Elasticsearch, etc.)

### Error Handling
- All API errors caught and displayed to user
- NotificationService shows clear error messages
- Invalid paths prevented with validation

### User Feedback
- Loading states on buttons during API calls
- Success notifications with job IDs for tracking
- Destructive action warnings for restore
- Step-by-step modal dialogs guide user

### Authorization
- Requires valid JWT token (via BaseApiClient)
- Admin role validated on backend
- 403 Forbidden errors handled gracefully

## Backend Integration

### Required Endpoints (provided by krkn-operator)

#### POST /api/v1/backup
```json
Request:
{
  "backupName": "optional-name"
}

Response (202 Accepted):
{
  "jobId": "backup-job-uuid",
  "message": "Backup started"
}
```

#### POST /api/v1/restore
```json
Request:
{
  "backupPath": "/tmp/backup.tar.gz"
}

Response (202 Accepted):
{
  "jobId": "restore-job-uuid",
  "message": "Restore started"
}
```

## Testing

### Run Tests
```bash
# Run all backup/restore tests
npm test -- backupRestore

# Run full test suite
npm test
```

### Test Results
- ✓ All 7 tests passing
- ✓ Full build succeeds without errors
- ✓ No TypeScript errors or warnings
- ✓ Integrated with existing test infrastructure (Vitest)

## Architecture

### Component Hierarchy
```
Settings.tsx (admin-only tab navigation)
  └── BackupRestoreCard.tsx (renders buttons + modals)
      └── backupRestoreApi (API service calls)
          └── BaseApiClient (JWT + auth)
```

### State Management
- Uses React hooks (useState) for:
  - Modal open/close states
  - Loading states during API calls
  - Form inputs (backup name, restore path)
  - Confirmation dialog states
- No Redux needed (simple local state)

### Error Handling Strategy
1. API errors caught and logged
2. User notifications via `useNotifications()` hook
3. Modal remains open on error (user can retry)
4. Validation errors prevented before API call

## Future Enhancements (Optional)

1. **Job Status Polling** - Poll `/api/v1/backup/{jobId}` every 2-5 seconds to show progress
2. **Backup Listing** - Show previous backups available for restore
3. **Scheduled Backups** - Allow configuring automated backups
4. **Backup Retention** - Show/configure retention policies
5. **Download Backup** - Allow users to download backup files from console

## Accessibility

- All buttons have clear labels
- Form inputs have associated labels and placeholders
- Modal titles and descriptions clear
- Warning alerts use semantic markup (`<Alert variant="warning">`)
- Keyboard navigable (all interactive elements accessible via keyboard)

## Performance

- Component is lightweight (simple state management)
- API calls are async (non-blocking)
- No unnecessary re-renders
- Modal dialogs lazy-loaded (only render when needed)

## Security Considerations

✅ **Admin-only** - Backend validates admin role via JWT claims
✅ **JWT Auth** - All requests include Bearer token via BaseApiClient
✅ **HTTPS** - Assumes secure connection (in production)
✅ **No secrets in local state** - Sensitive data only in API requests
✅ **Destructive action warning** - User must confirm restore

## Compatibility

- React 18+
- PatternFly v5 components
- TypeScript 4.9+
- Vitest test framework
- All existing tests still pass
