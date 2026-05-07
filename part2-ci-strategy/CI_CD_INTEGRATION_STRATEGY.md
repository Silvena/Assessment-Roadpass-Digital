# Part 2: CI/CD Integration Strategy

**Project**: Roadpass Digital QA Assessment  
**Platform**: CircleCI  
**Test Suite**: Playwright E2E tests (Part 1)  
**Date**: May 2026

---

## Executive Summary

This document outlines how to integrate Part 1's automated test suite into Roadpass Digital's CircleCI pipeline. The strategy balances **speed** (fast feedback on PRs), **coverage** (full browser matrix on main), and **reliability** (flaky test detection and quarantine).

**Key Approach**:
- **PR Workflow**: Fast feedback on Chromium only (~3–5 min)
- **Main Branch**: Full matrix (Chromium, Firefox, WebKit) nightly or on-merge
- **Parallelization**: Run auth tests + trip-planning tests in separate jobs
- **Failure Reporting**: JUnit XML, artifacts (screenshots/videos), PR comments, Slack notifications
- **Flaky Detection**: Track retry rate; quarantine tests exceeding 10% flakiness
- **Metrics**: Pass rate, flakiness, pipeline duration, MTTF (mean time to failure)

---

## 1. CI Pipeline Configuration Strategy

### 1.1 When Tests Run

| Trigger | Scope | Browsers | Duration | Purpose |
|---------|-------|----------|----------|---------|
| **Pull Request** | Chromium only | Chromium | ~3–5 min | Fast feedback; catch regressions before merge |
| **Merge to main** | Full matrix | Chrome, Firefox, WebKit | ~8–12 min | Verify all browsers work; detect cross-browser issues |
| **Nightly (2 AM UTC)** | Full matrix + extended | Chrome, Firefox, WebKit | ~15 min | Regression detection; historical trend tracking |
| **Manual trigger** | Custom scope | User-selected | Variable | Debug specific test/browser combination |

### 1.2 Test Execution Order & Parallelization

```
CircleCI Workflow: "test-suite"
├── Job 1: auth-tests (Chromium)           [~1.5 min]
│   ├── authpage.spec.js                   [~2 min]
│   └── cookie-banner.spec.js              [~2 min]
│   └── artifact: auth-report.xml
│
├── Job 2: trip-planning-tests (Chromium)  [~5 min] (depends on Job 1)
│   ├── trip-planner-happy-path.spec.js    [~3 min]
│   └── trip-planning-edge-cases.spec.js   [~5 min]
│   └── artifacts: screenshots, videos, trace.zip
│
├── Job 3: firefox-tests (if main branch)  [~8 min] (parallel to Job 1/2)
├── Job 4: webkit-tests (if main branch)   [~8 min] (parallel to Job 1/2)
│
└── Job 5: report-aggregation             [~30s] (depends on all above)
    └── Merge reports, post PR comment, send Slack notification
```

**Rationale**:
- **Auth tests first**: Quick smoke test; if auth fails, trip-planning tests skip
- **Trip-planning tests second**: Reuse authenticated session from Job 1
- **Browser matrix in parallel**: Chromium (required) + Firefox/WebKit (main/nightly)
- **Report aggregation last**: Depends on all tests; provides single point of truth

### 1.3 Parallelization Strategy

**PR (Fast Path)**:
```yaml
jobs:
  auth-tests:
    image: node:18
    steps:
      - checkout
      - setup_env
      - run: npx playwright test tests/auth*.spec.js --project=chromium
      - store: artifacts & junit.xml
```

**Main/Nightly (Full Matrix)**:
```yaml
jobs:
  auth-chromium:
    image: node:18
    steps: [checkout, setup_env, run auth tests --project=chromium, store artifacts]
  
  trip-planning-chromium:
    image: node:18
    requires: [auth-chromium]
    steps: [checkout, setup_env, reuse-auth, run trip tests --project=chromium, store artifacts]
  
  auth-firefox:
    image: node:18
    steps: [checkout, setup_env, run auth tests --project=firefox, store artifacts]
  
  # ... webkit variants ...
```

**Benefits**:
- **Fast PR feedback** (~3–5 min vs 15 min full matrix)
- **Parallel execution** reduces overall pipeline time
- **Session reuse** across jobs cuts auth overhead

---

## 2. CircleCI Configuration File

See **`.circleci/config.yml`** (provided separately with detailed comments).

**Key Features**:
- ✅ Global `setup` job for authentication
- ✅ Conditional job execution (PR vs main vs nightly)
- ✅ JUnit XML + HTML report generation
- ✅ Artifact capture (screenshots, videos, traces)
- ✅ PR comment with test summary
- ✅ Slack notification on failure
- ✅ Environment variable secrets management

---

## 3. Failure Handling & Reporting

### 3.1 Test Failure Flow

```
Test Fails
  ↓
CircleCI captures:
  ├─ Screenshot (only-on-failure)
  ├─ Video recording
  ├─ Playwright trace (zip)
  ├─ JUnit XML result
  └─ Console logs
  ↓
Artifacts uploaded to CircleCI
  ↓
Report aggregation job runs:
  ├─ Parse JUnit XML
  ├─ Count passes/fails/skips
  ├─ Determine if flaky (2+ retries needed)
  ├─ Post PR comment (if PR)
  └─ Send Slack notification
  ↓
Developer action:
  ├─ View PR comment → click artifact link
  ├─ Download screenshot/video from CircleCI
  ├─ Review trace in Playwright Inspector
  ├─ Debug and fix locally
  └─ Push fix → test re-runs automatically
```

### 3.2 Reporting Mechanisms

#### **JUnit XML**
```xml
<!-- part1-automation/reports/junit.xml -->
<testsuites>
  <testsuite name="authpage.spec.js" tests="5" failures="0" skipped="0">
    <testcase name="should instantiate AuthPage correctly" time="0.241"/>
    ...
  </testsuite>
</testsuites>
```
**Usage**: Integrated into CircleCI UI for test visualization; consumed by dashboards.

#### **PR Comment** (via curl to GitHub API)
```markdown
## ✅ Automated Test Results

**Chromium**: 10/22 passed | 0 failed | 12 skipped  
**Firefox**: (nightly only)  
**WebKit**: (nightly only)  

**Duration**: 4m 32s  
**Auth Status**: ✅ Passed  

📊 [View Report](https://app.circleci.com/...)  
🎥 [Download Artifacts](https://app.circleci.com/artifacts/...)
```
**Trigger**: Only on PRs; auto-updates on retry.

#### **Slack Notification** (via Slack API)
```
🔴 Test Pipeline FAILED
PR #234 | author: @jane-dev
Branch: feature/trip-filters

Failed: trip-planning-edge-cases.spec.js (TC-05)
Flaky: 2/8 edge-case tests need retry

👉 View Details: https://circleci.com/...
```
**Trigger**: Only on failure; mentions assignee.

#### **Artifact Storage**
| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| Screenshots | `reports/test-results/**/test-failed-*.png` | 30 days | Visual debugging |
| Videos | `reports/test-results/**/video.webm` | 30 days | Replay exact failure |
| Traces | `reports/test-results/**/trace.zip` | 7 days | Playwright inspector debug |
| JUnit XML | `reports/junit.xml` | Forever (in CI DB) | Test trend analysis |
| HTML Report | `playwright-report/index.html` | 30 days | Full test details |

### 3.3 Escalation Rules

| Condition | Action | Owner |
|-----------|--------|-------|
| **Test fails on main** | Block merge; page @on-call in Slack | QA Lead |
| **Same test fails 3x in 24h** | Quarantine test; open ticket | Test Author |
| **Flaky test (>10% failure rate)** | Move to `tests/quarantine/` | Test Author |
| **Global setup fails (auth)** | Page @engineering; check Roadtrippers status | QA Infrastructure |

---

## 4. Flaky Test Management Strategy

### 4.1 Detection: Automatic Flakiness Tracking

**Implementation**:
```bash
# After each test run, update flakiness metrics
# in a shared artifact or database

{
  "tests": [
    {
      "name": "TC-07: should handle duplicate waypoints",
      "total_runs": 120,
      "failures": 8,
      "flakiness_rate": 6.7,
      "status": "acceptable",  # < 10%
      "last_failure": "2026-05-06T14:32:00Z"
    },
    {
      "name": "TC-05: should handle very long location names",
      "total_runs": 120,
      "failures": 16,
      "flakiness_rate": 13.3,
      "status": "quarantine",  # > 10%
      "assigned_to": "qa-team@company.com"
    }
  ]
}
```

**Tracking Mechanism**:
- Parse JUnit XML after each run
- Increment counters in CircleCI cache or external database (S3)
- Calculate rolling 30-day flakiness rate
- Alert on threshold breach

### 4.2 Quarantine Strategy

**When to Quarantine** (flakiness > 10%):

1. **Move test to `tests/quarantine/`**:
   ```javascript
   // tests/quarantine/TC-05-long-locations.spec.js
   // (same test file, different directory)
   ```

2. **Add README explaining issue**:
   ```markdown
   # Quarantined Tests

   ## TC-05: Very long location names
   - **Flakiness Rate**: 13.3% (16/120 failures)
   - **Root Cause**: Autocomplete dropdown timeout on slow network
   - **Assigned To**: @qa-lead
   - **Timeline**: Fix by 2026-06-01
   - **Ticket**: JIRA-1234
   ```

3. **Exclude from PR runs** (keep in nightly):
   ```yaml
   # .circleci/config.yml
   - run: npx playwright test tests/*.spec.js --ignore=tests/quarantine/
   ```

4. **Monitor separately**:
   - Nightly runs INCLUDE quarantine tests
   - Separate dashboard widget for quarantine suite
   - Daily report of progress toward fix

### 4.3 Retry & Recovery Policy

| Scenario | Retry Count | Backoff | Action |
|----------|-------------|---------|--------|
| **Test fails on first run** | Automatic 1 retry | 500ms wait | Log as flaky if 2nd fails too |
| **Same test fails 3x in row** | No more retries | N/A | Quarantine; escalate to team |
| **Global setup fails** | Retry once | 2s wait | Fail entire suite if retry fails |
| **Network timeout** | 2 retries | Exponential (1s, 3s) | Common in CI; allow lenience |

**Implemented in `playwright.config.js`**:
```javascript
retries: process.env.CI ? 2 : 0,  // 2 retries in CI, 0 locally
```

### 4.4 Ownership & SLA

**Test Author Accountability**:
- Author owns test for first 90 days post-creation
- If test is flaky, author must either fix or quarantine within 7 days
- SLA: Response within 24h to flakiness alerts

**Escalation Path**:
- Day 1–3: Author investigates privately
- Day 4–7: QA Lead reviews with author
- Day 7+: Test quarantined; ticket tracked in backlog

---

## 5. Metrics & Monitoring

### 5.1 Recommended Metrics

#### **Metric 1: Test Pass Rate (%)**
```
Definition: (Total Passed Tests / Total Tests Run) × 100
Formula: Tracked per test file, per browser, per day

Healthy Range: ≥95% (allows for flaky tests)
Alerting Threshold: <90% triggers investigation

Tracking: JUnit XML → CircleCI Test Insights → Dashboard
Timeline: Rolling 7-day average
```

**Why**: Primary indicator of suite health. <90% means systematic issues (broken selectors, environment issues).

---

#### **Metric 2: Flakiness Rate (%) — Top 10 Flakiest Tests**
```
Definition: Tests that fail sometimes but not always (require 2+ retries)
Formula: (Total Flaky Runs / Total Test Runs) × 100

Healthy Range: <5% fleet-wide, <10% per test
Alerting Threshold: >15% per test → quarantine

Examples:
- TC-07: 6.7% (acceptable)
- TC-05: 13.3% (quarantine needed)
- authpage-login: 0.8% (excellent)
```

**Why**: Flaky tests are time sinks (they fail unpredictably, wasting dev time). This metric identifies tests needing fixes.

**Dashboard Widget**:
```
Top 10 Flakiest Tests (Last 30 Days)
1. TC-05: 13.3% — Assigned: @qa-lead — ETA: 2026-06-01
2. TC-07: 6.7% — Status: Monitoring
3. cookie-banner-dismiss: 5.2% — Monitoring
...
```

---

#### **Metric 3: Pipeline Duration (minutes) — by Trigger Type**
```
Definition: Time from code push to merge decision

Tracking:
- PR runs: 3–5 min (Chromium only, auth + trip-planning parallel)
- Main runs: 8–12 min (full matrix, all browsers)
- Nightly runs: 15–20 min (all browsers, with quarantine suite)

Target SLO:
- PR: <5 min (fast feedback)
- Main: <15 min (verify, not block)
- Nightly: <25 min (comprehensive, overnight)

Alerting: >20 min for PR runs (infrastructure issue)
```

**Why**: Developer experience. If tests are slow, devs skip running them locally; 3–5 min PR feedback is goldilocks.

**Dashboard**:
```
Pipeline Duration Trend (Last 30 Days)
PR Runs:    Avg 4.2 min  ✅ (target: <5 min)
Main Runs:  Avg 11.8 min ✅ (target: <15 min)
Nightly:    Avg 18.3 min ✅ (target: <25 min)

95th Percentile:
PR:         5.8 min (acceptable variance)
Main:       14.2 min (good)
```

---

#### **Metric 4: Mean Time to Fix (MTTF) — Failure Recovery Speed**
```
Definition: Average time from failure to fix merge

Calculation:
1. Detect: Test failure occurs (time T0)
2. Notify: Slack/PR comment sent (T1 = T0 + 1 min)
3. Investigate: Dev starts looking (T2 = T1 + varies)
4. Fix: PR merged with fix (T3)
5. MTTF = T3 - T0

Healthy Range: <4 hours
Target: <2 hours (catch before next standup)
Alerting: >8 hours (escalate to leadership)

Tracking: GitHub PR events + CircleCI API
```

**Why**: Failures that sit for days block the team. Quick MTTF = team unblocked.

**Dashboard Example**:
```
MTTF by Test File (Last 30 Days)
authpage.spec.js:          32 min ✅ (quick fix, clear error)
cookie-banner.spec.js:     58 min ✅ (selector investigation needed)
trip-planning-edge-cases:  3h 24m ⚠️  (complex bugs take longer)
Overall MTTF:              1h 45m ✅ (target: <2h)

Distribution:
- Fixed within 1h:  65% ✅
- Fixed within 4h:  95% ✅
- Fixed >4h:        5% (needs investigation)
```

---

### 5.2 Dashboard & Alerting

**Dashboard Location**: `company-monitoring.com/test-metrics`

**Real-time Displays**:
1. **Test Results** — Pass/fail by file, browser, time
2. **Flakiness Heatmap** — Top 10 tests by failure rate
3. **Pipeline Duration** — Trend graph with SLO lines
4. **Failure Recovery** — Time from failure to fix
5. **Coverage** — Code covered by automated tests (if integrated with coverage tool)

**Alerts** (sent to Slack #qa-automation):
```
🔴 Test Suite Failed
  - 2/22 tests failed (trip-planning-edge-cases.spec.js)
  - Flakiness detected: TC-05 (13.3%)
  - MTTF Risk: Last fix took 6h

  Action: Reply to fix thread, assign to @qa-lead
  Links: [CircleCI](https://circleci.com/...) [PR](https://github.com/...)
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1–2)
- ✅ Set up `.circleci/config.yml` (basic PR + main workflows)
- ✅ Configure JUnit XML output
- ✅ Set up artifact capture (screenshots, videos)
- ✅ Add Slack notification integration
- ✅ Document local test execution setup

### Phase 2: Reporting (Week 3–4)
- [ ] Implement PR comment with test summary
- [ ] Set up CircleCI Test Insights dashboard
- [ ] Create flakiness tracking spreadsheet/database
- [ ] Build custom metrics dashboard (Grafana/Data Studio)
- [ ] Set up alerting thresholds

### Phase 3: Optimization (Week 5+)
- [ ] Quarantine first flaky tests (if any)
- [ ] Parallelize trip-planning test suites
- [ ] Integrate with code coverage tool
- [ ] Implement MTTF tracking dashboard
- [ ] Nightly schedule with extended test suite

---

## 7. Team Responsibilities

| Role | Responsibility | Examples |
|------|-----------------|----------|
| **QA Engineer** | Maintain tests; own flaky test fixes | Debug TC-05, update selectors |
| **QA Lead** | Monitor metrics; escalate issues | Review MTTF, quarantine decisions |
| **DevOps/SRE** | Maintain CI infrastructure | CircleCI config, secret rotation |
| **Engineering Manager** | Set SLOs; allocate time for test fixes | "Tests must be <5 min on PRs" |
| **Developers** | Run tests locally before push | `npm test` before git push |

---

## 8. Success Criteria

By end of Month 1:
- ✅ CI pipeline running on every PR + main push
- ✅ Test failure causes PR to block merge
- ✅ Developers receive PR comments + Slack notifications within 1 min of failure
- ✅ All artifacts (screenshots, videos, traces) easily accessible

By end of Month 2:
- ✅ Flakiness dashboard showing top 10 flaky tests
- ✅ Zero known flaky tests left on main (all quarantined or fixed)
- ✅ PR test duration consistently <5 min
- ✅ MTTF tracked and <2 hours average

By end of Month 3:
- ✅ CI is trusted; developers don't merge without green tests
- ✅ Test metrics published to engineering leadership weekly
- ✅ Nightly full matrix (Firefox, WebKit) also <25 min
- ✅ Test coverage dashboard integrated with code coverage

---

## Appendix: Configuration Details

See **`.circleci/config.yml`** for:
- Full CircleCI job definitions
- Environment variable setup
- Slack/GitHub API integrations
- JUnit XML formatting
- Artifact storage policies

---

**Document Version**: 1.0  
**Last Updated**: May 7, 2026  
**Next Review**: After 4 weeks of CI/CD operation
