# QA Checklist for {{PROJECT_NAME}}

## Build Verification
- [ ] Run installation command `{{INSTALL_COMMAND}}` without errors.
- [ ] Build the project using `{{BUILD_COMMAND}}`.
- [ ] Verify build artifacts are generated in `{{BUILD_OUTPUT_DIR}}`.

## Runtime Health Checks
- [ ] Start the development server with `{{DEV_COMMAND}}` and ensure it runs.
- [ ] Access health endpoint `{{HEALTH_ENDPOINT}}` and confirm it returns HTTP 200.

## Visual / Browser Verification
- [ ] Open the application in a browser and verify key UI components render correctly.
- [ ] Perform basic interaction tests (e.g., login, navigation, form submission).

## API Endpoint Tests
- [ ] Execute automated API tests using `{{API_TEST_COMMAND}}`.
- [ ] Verify all documented endpoints respond as expected and return correct schemas.

## Security Checklist
- [ ] Run static analysis tool `{{STATIC_ANALYSIS_TOOL}}` and address findings.
- [ ] Ensure no secrets are committed (`git diff --check`).
- [ ] Verify dependencies are up‑to‑date (`{{DEPENDENCY_CHECK_COMMAND}}`).
- [ ] Scan for known vulnerabilities (`{{VULN_SCAN_COMMAND}}`).
