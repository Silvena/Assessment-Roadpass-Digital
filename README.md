# Assessment-Roadpass-Digital
Roadpass Digital QA Assessment  Automated trip-planning tests for Roadtrippers using Playwright javaScript. 
Includes:  
Part 1: POM-based test suite (Happy Path, Edge, &amp; Negative cases).  
Part 2: CircleCI integration strategy  .circleci/config.yml.  
Part 3: API &amp; Bonus extensions.  
Focuses on clean code, stable waits, and CI/CD scalability.
How to run:
## Prerequisites

- **Node.js** 18+ with npm
- **Environment variables**: Set `ROADTRIPPERS_EMAIL` and `ROADTRIPPERS_PASSWORD` in a `.env` file at the project root
- **Browsers**: First run will download Chromium, Firefox, and WebKit (~300MB)

## Setup

```bash
# Install dependencies
npm install

# Create .env file with credentials
cat > .env << EOF
ROADTRIPPERS_EMAIL=your-email@example.com
ROADTRIPPERS_PASSWORD=your-password
EOF
```

## Running Tests

```bash
# Run all tests in headed mode (watch UI)
npm run test:headed

# Run tests headless (CI mode)
npm test

# Run a single test file
npx playwright test tests/authpage.spec.js

# Run tests on a specific browser
npx playwright test --project=chromium

# Debug mode (step through test with inspector)
npm run test:debug

# View HTML test report
npm run test:report
