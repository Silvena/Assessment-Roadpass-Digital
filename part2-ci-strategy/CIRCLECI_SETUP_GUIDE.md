# CircleCI Setup Guide

This guide explains how to configure CircleCI to run the Roadtrippers test suite using the provided `.circleci/config.yml`.

---

## Quick Start

### 1. Commit the Configuration
```bash
git add .circleci/config.yml
git commit -m "Add CircleCI test automation configuration"
git push origin main
```

CircleCI will automatically detect `.circleci/config.yml` and start running workflows on the next push or PR.

---

## 2. Configure Environment Variables

CircleCI needs secret credentials and webhook URLs. Create a **Context** to store these:

### Step-by-Step

1. **Log in to CircleCI** → [circleci.com](https://circleci.com)
2. **Navigate**: Organization Settings → Contexts → Create New Context
3. **Name**: `roadtrippers-qa`
4. **Add Environment Variables** (exact names matter):

| Variable | Value | Example |
|----------|-------|---------|
| `ROADTRIPPERS_EMAIL` | Test account email | `qa-test@roadtrippers.com` |
| `ROADTRIPPERS_PASSWORD` | Test account password | `super-secret-pwd` |
| `SLACK_WEBHOOK` | Slack incoming webhook URL | `https://hooks.slack.com/services/T00.../B00.../...` |
| `GITHUB_TOKEN` | GitHub personal access token | `ghp_abc123...` |

### Getting These Values

**Roadtrippers Email & Password**:
- Create a test account on Roadtrippers.com
- Store credentials in your password manager or team secret storage

**Slack Webhook**:
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app → "From scratch"
3. App Name: "CircleCI Test Notifications"
4. Select your workspace
5. Navigate: Features → Incoming Webhooks → Create New Webhook
6. Select channel (e.g., #qa-automation)
7. Copy the Webhook URL → paste into CircleCI context

**GitHub Token**:
1. Log in to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Tokens (classic)" → Generate new token (classic)
3. Scopes needed:
   - `repo` (full control of private repositories)
   - `read:org` (read org info)
4. Copy token → paste into CircleCI context

### 5. Verify Variables

In CircleCI, navigate to any workflow and check if env vars are masked (shown as `***`).

---

## 3. Update Project Checkout Settings

1. **CircleCI Project**: Select your repository
2. **Project Settings** → Checkout SSH Keys
3. Ensure your deploy key has access to private repos (if applicable)

---

## 4. Enable Test Insights (Optional but Recommended)

CircleCI Test Insights automatically parses JUnit XML and shows trends:

1. **Project Settings** → Tests
2. Toggle "Enable test insights"
3. Tests will appear in the [Test Insights dashboard](https://circleci.com/docs/insights) after first workflow completes

---

## 5. Configure Nightly Schedule

The config includes a `test-nightly` workflow that runs on schedule. Set it up:

1. **CircleCI Project** → Triggers
2. Click "Add Trigger"
3. **Type**: Scheduled Pipeline
4. **Cron**: `0 2 * * *` (2 AM UTC daily)
5. **Branch**: `main`
6. **Description**: "Nightly E2E test suite run (full matrix)"
7. Click "Save Trigger"

**Cron Expression Explained**:
```
0 2 * * *
│ │ │ │ └─ Day of week (0=Sunday, 6=Saturday; * = any)
│ │ │ └─── Month (1-12; * = any)
│ │ └───── Day of month (1-31; * = any)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

Examples:
- `0 2 * * *` — 2 AM UTC, every day
- `0 2 * * 1-5` — 2 AM UTC, Monday–Friday only
- `0 14 * * *` — 2 PM UTC, every day

---

## 6. Workflow Behavior

The config defines three workflows that trigger automatically:

### PR Workflow (`test-pr`)
**Trigger**: On every pull request  
**Runs**: Chromium only (fast feedback)  
**Duration**: ~4–5 minutes  
**Jobs**:
1. `setup` — Global authentication
2. `auth-tests` — Auth + cookie tests
3. `trip-planning-tests-chromium` — Main suite
4. `report-aggregation` — Summary

**PR Comments**: ✅ Posts test summary to PR (if GITHUB_TOKEN set)

### Main Workflow (`test-main`)
**Trigger**: On every push to `main` branch  
**Runs**: All browsers (Chromium, Firefox, WebKit)  
**Duration**: ~10–12 minutes  
**Jobs**: Same as PR, plus Firefox & WebKit variants  
**Merge Blocking**: ✅ If tests fail, PR cannot be merged (if branch protection enabled)

### Nightly Workflow (`test-nightly`)
**Trigger**: Scheduled (2 AM UTC, configurable)  
**Runs**: All browsers + quarantine tests  
**Duration**: ~15–20 minutes  
**Purpose**: Historical trend data, flaky test detection

---

## 7. Test Results & Artifacts

After workflow completes:

1. **CircleCI Dashboard**
   - Click workflow name → view job details
   - See live logs, pass/fail count, timing

2. **Test Insights**
   - Dashboard: [circleci.com/insights](https://circleci.com/insights)
   - Graphs: Pass rate, flakiest tests, slowest tests over time

3. **Artifacts**
   - Playwright report: `playwright-report/index.html`
   - Screenshots: `test-results/**/test-failed-*.png`
   - Videos: `test-results/**/video.webm`
   - Traces: `test-results/**/trace.zip`

4. **PR Comments** (if enabled)
   - Auto-posted comment with test summary
   - Links to artifacts and CircleCI dashboard

5. **Slack Notifications**
   - On failure: Posts to #qa-automation channel
   - Links to CircleCI, artifacts, PR

---

## 8. Branch Protection Rules (GitHub)

To block merges on test failure:

1. **GitHub** → Repository Settings → Branches
2. Click "Add rule" for `main`
3. **Require status checks to pass**:
   - Select CircleCI workflows: `test-pr`
4. **Dismiss stale PR approvals** (optional)
5. Save

Now PRs cannot be merged if tests fail.

---

## 9. Troubleshooting

### Workflow doesn't start
- **Check**: Did you commit `.circleci/config.yml`?
- **Check**: Is CircleCI connected to your GitHub org?
- **Fix**: Go to CircleCI Project Settings → GitHub Permissions → Reconnect

### Tests fail with "ROADTRIPPERS_EMAIL not found"
- **Check**: Context `roadtrippers-qa` created?
- **Check**: Env vars actually set in CircleCI?
- **Fix**: CircleCI Project → Project Settings → Contexts → verify vars are listed

### PR comment not posting
- **Check**: GITHUB_TOKEN set in context?
- **Check**: Token has `repo` scope?
- **Fix**: Generate new token, update context, re-run workflow

### Slack notifications not working
- **Check**: SLACK_WEBHOOK URL correct?
- **Check**: URL includes `/services/` prefix?
- **Fix**: Regenerate webhook in Slack, update context

### Tests timeout in CI but pass locally
- **Check**: `no_output_timeout` set to 10m?
- **Check**: CI slower than local? (Yes; shared runners)
- **Fix**: Increase timeout or optimize slow tests

### Artifacts not showing
- **Check**: `store_artifacts` step in config?
- **Check**: Path correct? (e.g., `part1-automation/reports/`)
- **Fix**: Verify artifact paths exist after test run

---

## 10. Next Steps

### Monitor & Maintain
- [ ] Check CI dashboard weekly for flaky tests
- [ ] Review Slack notifications for failures
- [ ] Update env vars when credentials rotate
- [ ] Archive old artifacts (CircleCI auto-deletes after 30 days)

### Optimize
- [ ] If PR tests take >5 min, parallelize further
- [ ] If nightly takes >25 min, consider splitting browsers
- [ ] Track metrics dashboard (see CI_CD_INTEGRATION_STRATEGY.md)

### Integrate with Tools
- [ ] Connect test results to Jira (test reporting)
- [ ] Link metrics to Datadog/Grafana (observability)
- [ ] Auto-create tickets for flaky tests (GitHub Actions)

---

## 11. Config Reference

For details on the CircleCI config structure, see:
- **Main doc**: `part2-ci-strategy/CI_CD_INTEGRATION_STRATEGY.md`
- **Config file**: `.circleci/config.yml` (heavily commented)
- **CircleCI docs**: [https://circleci.com/docs](https://circleci.com/docs)

---

## 12. Support & Issues

**If tests fail in CI but pass locally**:
1. Check environment variables (especially credentials)
2. Run locally with `npm test` to replicate CI behavior
3. Check Playwright version matches CI Docker image
4. See `part1-automation/README.md` troubleshooting section

**For CircleCI-specific issues**:
- CircleCI support: [support.circleci.com](https://support.circleci.com)
- CircleCI community: [discuss.circleci.com](https://discuss.circleci.com)

---

**Document Version**: 1.0  
**Last Updated**: May 7, 2026  
**Maintenance Owner**: QA Lead
