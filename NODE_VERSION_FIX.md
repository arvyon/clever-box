# Node.js Version Compatibility Fix

## Issue
Build was failing on Railway with error:
```
error @supabase/supabase-js@2.97.0: The engine "node" is incompatible with this module. 
Expected version ">=20.0.0". Got "18.20.5"
```

## Root Cause
- Railway was using Node.js 18.20.5 by default
- `@supabase/supabase-js` version 2.97.0 (resolved from ^2.39.0) requires Node.js >= 20.0.0
- Package version range `^2.39.0` allows updates up to 2.x.x, which pulled in 2.97.0

## Solution Applied

### 1. Updated Node.js Version Requirements

**frontend/package.json:**
- Added `engines` field: `"node": ">=20.0.0"`

**package.json (root):**
- Updated `engines` field: `"node": ">=20.0.0"`

### 2. Created Node Version Configuration Files

**frontend/.nvmrc:**
- Created file with content: `20`
- Railway/Nixpacks will detect this and use Node 20

**frontend/nixpacks.toml:**
- Created Nixpacks configuration file
- Explicitly specifies `nodejs-20_x` in setup phase
- Configures yarn installation with `--legacy-peer-deps` flag

### 3. Package Compatibility

**@supabase/supabase-js:**
- Current version: `^2.39.0`
- Compatible with Node.js 20+
- No changes needed to package version

## Files Modified

1. `frontend/package.json` - Added engines field
2. `package.json` - Updated engines field  
3. `frontend/.nvmrc` - Created (new file)
4. `frontend/nixpacks.toml` - Created (new file)
5. `RAILWAY_MIGRATION_GUIDE.md` - Added Node version troubleshooting section

## Verification

After these changes, Railway should:
1. Detect Node.js 20 from `.nvmrc` file
2. Use Node.js 20 for the build process
3. Successfully install `@supabase/supabase-js@2.97.0` or compatible version
4. Complete the build without Node version errors

## Next Steps

1. Commit these changes to your repository
2. Push to trigger Railway deployment
3. Monitor build logs to confirm Node 20 is being used
4. Verify build completes successfully

## Alternative Solutions (if issues persist)

If Railway still uses Node 18, you can:

1. **Set Environment Variable in Railway:**
   - Go to service → Variables
   - Add: `NIXPACKS_NODE_VERSION=20`

2. **Pin Supabase Version (if needed):**
   - Change `"@supabase/supabase-js": "^2.39.0"` to `"@supabase/supabase-js": "2.39.0"` (exact version)
   - This prevents automatic updates to versions requiring Node 20

3. **Use Node 18 Compatible Version:**
   - Use `"@supabase/supabase-js": "^2.38.0"` (last version supporting Node 18)
   - Not recommended as it's an older version

## Recommended Approach

✅ **Use Node.js 20** (Current solution)
- Latest LTS version
- Required by latest Supabase client
- Better performance and security
- Future-proof
