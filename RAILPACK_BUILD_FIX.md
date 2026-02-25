# Railway Railpack Build Configuration Fix

## Issue
Railway was using **Railpack** builder (not Nixpacks), causing build failures due to:
1. Conflicting `nixpacks.toml` file
2. Incorrect build command using `npm` instead of `yarn`
3. Builder mismatch in `railway.json`

## Solution Applied

### 1. Removed Nixpacks Configuration
- **Deleted**: `frontend/nixpacks.toml` (causing conflicts with Railpack)

### 2. Updated Railway Configuration
- **Updated**: `frontend/railway.json`
  - Changed builder from `NIXPACKS` to `RAILPACK`
  - Updated build command to use `yarn` instead of `npm`
  - Simplified build command (Railpack handles corepack automatically)

### 3. Build Command
The build command now:
```bash
yarn install --frozen-lockfile --legacy-peer-deps && DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false yarn build
```

## Files Modified

1. **Deleted**: `frontend/nixpacks.toml`
2. **Updated**: `frontend/railway.json`
   - Builder: `RAILPACK` (was `NIXPACKS`)
   - Build command: Uses `yarn` (was `npm`)

## Railway Settings Configuration

In Railway Dashboard → Settings → Build:

1. **Builder**: Should show "Railpack" (default, auto-detected)
2. **Node Version**: Should detect Node 20 from `.nvmrc` file
3. **Custom Build Command**: Can be left empty (uses `railway.json`) OR set to:
   ```
   yarn install --frozen-lockfile --legacy-peer-deps && DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false yarn build
   ```
4. **Watch Paths**: Should be `/frontend/**` (for monorepo)

## Verification Steps

1. **Check Builder**:
   - Go to Railway Dashboard → Frontend Service → Settings → Build
   - Verify "Railpack" is selected (not Nixpacks)

2. **Check Node Version**:
   - Should show Node 20 (from `.nvmrc`)
   - If showing Node 22, you can manually set it to 20 in the dropdown

3. **Check Build Command**:
   - Either leave empty (uses `railway.json`) OR
   - Set the custom build command as shown above

4. **Deploy**:
   - Commit and push changes
   - Railway should now build successfully with Railpack

## Key Differences: Railpack vs Nixpacks

| Feature | Railpack | Nixpacks |
|---------|----------|----------|
| Builder Type | New, faster | Legacy |
| Configuration | `railway.json` | `nixpacks.toml` |
| Node Detection | `.nvmrc` or `package.json` engines | `.nvmrc` or `nixpacks.toml` |
| Package Manager | Auto-detects from `packageManager` field | Manual config in `nixpacks.toml` |
| Speed | Faster builds | Slower builds |

## Notes

- Railpack is Railway's new default builder
- It automatically detects package manager from `package.json` (`packageManager` field)
- Node version is detected from `.nvmrc` file (currently set to 20)
- The `.nvmrc` file is still needed for Node version specification
- `railway.json` takes precedence over UI settings

## Troubleshooting

If build still fails:

1. **Clear Build Cache**:
   - Railway Dashboard → Service → Settings → Build
   - Look for "Clear Build Cache" option

2. **Check Node Version**:
   - Ensure `.nvmrc` contains `20`
   - Or manually set Node 20 in Railway UI

3. **Verify Package Manager**:
   - Check `package.json` has `"packageManager": "yarn@1.22.22+..."`
   - Railpack will auto-detect and use yarn

4. **Check Build Logs**:
   - Look for yarn installation errors
   - Verify all dependencies install correctly
