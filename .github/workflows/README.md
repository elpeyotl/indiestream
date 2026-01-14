# GitHub Actions Workflows

## E2E Tests

**Workflow**: `e2e-tests.yml`

### When it runs
- Automatically after every push to `main`
- Manually via GitHub Actions UI (workflow_dispatch)

### What it does
1. Installs dependencies
2. Installs Playwright chromium browser
3. Runs all 44 E2E tests
4. Uploads test reports and screenshots (if tests fail)

### How to view results
1. Go to: https://github.com/elpeyotl/indiestream/actions
2. Click on the latest workflow run
3. See pass/fail status
4. Download artifacts (test reports, screenshots) if needed

### Setup required

#### GitHub Secrets
You need to add these secrets in GitHub Settings > Secrets and variables > Actions:

```
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
```

**Note**: You may need test-specific versions of these (e.g., `TEST_DATABASE_URL`) if you don't want to run tests against production data.

### Run tests locally
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Debug tests with UI
```bash
npx playwright test --ui
```

### Benefits of this approach
- ✅ Doesn't block your push (tests run after)
- ✅ Catch regressions automatically
- ✅ Test reports saved for debugging
- ✅ Free for public repos
- ✅ Can manually trigger when needed
