# Search and ID Generation Fix

## Issue
The resident search functionality in the ID generation page was not working properly. When searching for residents by ID number or name, the search would fail and residents' information would not populate the PVC preview correctly.

## Root Cause
The code was using the **old database schema** properties while the system had been migrated to a **new schema**:

### Old Schema (IndexedDB)
- `r.name` → Full name
- `r.idno` → ID Number  
- `r.purok` → Purok/Position
- `r.photo` → Photo URL
- `r.signature` → Signature URL
- `r.household` → Precinct Number

### New Schema (SQLite via ResidentService)
- `r.fullName` → Full name
- `r.idNumber` → ID Number
- `r.purokOrPosition` → Purok/Position  
- `r.photoUrl` → Photo URL
- `r.signatureUrl` → Signature URL
- `r.precinctNumber` → Precinct Number

## Changes Made

### 1. Fixed Search Functionality (Lines ~2910-2943)
**Before:**
```javascript
const list = await all('residents');
const matches = list.filter(r=>
  r.idno.toLowerCase().includes(q) ||
  r.name.toLowerCase().includes(q)
);
```

**After:**
```javascript
const list = await ResidentService.getAll();
const matches = list.filter(r=>
  (r.idNumber && r.idNumber.toLowerCase().includes(q)) ||
  (r.fullName && r.fullName.toLowerCase().includes(q))
);
```

### 2. Fixed loadToID Function (Lines ~2730-2775)
Updated all property references to use new schema with fallbacks to old schema for backward compatibility:

**Key Changes:**
- `r.name` → `r.fullName || r.name`
- `r.idno` → `r.idNumber || r.idno`
- `r.purok` → `r.purokOrPosition || r.purok`
- `r.photo` → `r.photoUrl || r.photo`
- `r.signature` → `r.signatureUrl || r.signature`
- `r.household` → `r.precinctNumber || r.household`

### 3. Fixed Status Update Buttons (Lines ~2790-2825)
Updated the audit logging to use correct property:
- `r.idno` → `r.idNumber || r.idno`

## Testing Instructions

1. **Login to the system** with admin credentials
2. **Navigate to ID Generation tab**
3. **Search for a resident** by:
   - ID Number (e.g., "BHSPK-2026-001")
   - Name (e.g., "Juan")
4. **Click on a search result**
5. **Verify the PVC preview shows:**
   - ✅ Resident photo
   - ✅ Full name
   - ✅ ID number
   - ✅ Purok/Position
   - ✅ Address
   - ✅ Contact number
   - ✅ Precinct number
   - ✅ Status badge (Pending/Released)
   - ✅ Barcode

## Benefits

1. ✅ **Search now works** - Can find residents by ID number or name
2. ✅ **PVC preview populated correctly** - All resident information displays properly
3. ✅ **Backward compatible** - Supports both old and new schema properties
4. ✅ **Error handling** - Added try-catch blocks for better error reporting
5. ✅ **Null safety** - Added checks for undefined properties

## Files Modified

- `coreA.html` (3 sections updated)
  - Search input handler
  - loadToID function
  - Status update buttons

## Status

✅ **FIXED** - Resident search and ID generation now working correctly with the new database schema.
