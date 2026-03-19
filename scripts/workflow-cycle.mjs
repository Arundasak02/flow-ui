import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const workflowDir = path.join(repoRoot, 'workflow');
const visionPath = path.join(workflowDir, 'vision.md');
const qaReportPath = path.join(workflowDir, 'qa-report.md');
const uiReviewPath = path.join(workflowDir, 'ui-visual-review.md');
const iterationLogPath = path.join(workflowDir, 'iteration-log.md');

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'pipe', ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); process.stdout.write(d); });
    child.stderr.on('data', (d) => { stderr += d.toString(); process.stderr.write(d); });
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function getIterationId() {
  const txt = fs.existsSync(visionPath) ? fs.readFileSync(visionPath, 'utf8') : '';
  const match = txt.match(/- ID:\s*(ITER-[0-9A-Za-z_-]+)/);
  return match?.[1] ?? 'ITER-UNKNOWN';
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function mapCriterionStatus(results) {
  const getTest = (namePart) =>
    results.find((r) =>
      (r.title ?? '').toLowerCase().includes(namePart.toLowerCase()) ||
      (r.titlePath ?? []).some((p) => String(p).toLowerCase().includes(namePart.toLowerCase()))
    );
  const statusOf = (t) => (!t ? 'FAIL' : t.status === 'passed' ? 'PASS' : 'FAIL');

  return [
    { id: 'AC-01', status: statusOf(getTest('landing provides immediate mental map cues')), notes: 'Semantic low-clutter landing and map cues.' },
    { id: 'AC-02', status: statusOf(getTest('drill in and out works with double click')), notes: 'Double-click drill interaction behavior.' },
    { id: 'AC-03', status: statusOf(getTest('business and engineering tab keeps same node truth')), notes: 'Dual-lens consistency over same graph truth.' },
  ];
}

function buildQaReport(iterationId, criteriaRows, failures, artifactRel) {
  const rows = criteriaRows
    .map((r) => `| ${r.id} | ${r.status} | ${r.notes} |`)
    .join('\n');

  const defectRows = failures.length === 0
    ? '| - | - | - | - | No open defects |'
    : failures
      .slice(0, 10)
      .map((f, i) => `| DEF-${String(i + 1).padStart(3, '0')} | P1 | ${f.criteria ?? 'AC-UNK'} | OPEN | ${f.title} |`)
      .join('\n');

  const recommendation = failures.length === 0 ? 'READY' : 'NOT READY';

  return `# QA Report

## Iteration
- ID: ${iterationId}

## Criteria validation
| Criteria ID | Status (PASS/FAIL) | Notes |
|---|---|---|
${rows}

## Defects
| Defect ID | Severity | Criteria ID | Status | Summary |
|---|---|---|---|---|
${defectRows}

## Evidence
- screenshots: \`${artifactRel}\`
- videos: \`test-results/\`
- logs: \`${artifactRel}/workflow-cycle.log\`

## Release recommendation
- ${recommendation}
`;
}

function buildUiReview(iterationId, failures, criteriaRows, artifactRel) {
  const allPass = criteriaRows.every((r) => r.status === 'PASS');
  const alignment = allPass ? 'ALIGNED' : 'PARTIAL';

  const findings = failures.length === 0
    ? '| VIS-000 | V2 | Overall | No blocking visual issues detected in automated pass. | Continue manual exploratory polish and scale tests. |'
    : failures.map((f, idx) => {
      const sev = idx === 0 ? 'V1' : 'V2';
      const area = f.title.includes('drill') ? 'Navigation' : 'Visual clarity';
      return `| VIS-${String(idx + 1).padStart(3, '0')} | ${sev} | ${area} | ${f.title} | Fix interaction clarity and retest through loop. |`;
    }).join('\n');

  return `# UI Visual Review

## Iteration
- ID: ${iterationId}

## First 30-second impression
- What users understand immediately: Service-level structure and dual-lens intent are visible.
- What feels confusing/noisy: Any failing drill/clarity interactions reduce confidence in instant mental mapping.

## Vision alignment verdict
- ${alignment}

## Findings (ordered by severity)
| ID | Severity (V0/V1/V2) | Area | Issue | Recommendation |
|---|---|---|---|---|
${findings}

## Creativity opportunities (within scope)
- Add explicit on-canvas affordance for drill-in/out hints near focused nodes.
- Add adaptive label budget indicator for high-density maps.

## Handoff to QA/PO
- Risks to validate: Level-of-detail behavior under 1000+ node datasets.
- Suggested acceptance interpretation: Maintain <30s mental model with discoverable drill actions.
- Evidence: \`${artifactRel}\`
`;
}

function flattenTests(reportJson) {
  const results = [];
  function walkSuite(suite) {
    for (const spec of suite.specs ?? []) {
      const lastTest = (spec.tests ?? []).at(-1);
      const lastResult = (lastTest?.results ?? []).at(-1);
      results.push({
        title: spec.title,
        titlePath: spec.titlePath ?? [spec.title],
        status: lastResult?.status ?? 'failed',
      });
    }
    for (const child of suite.suites ?? []) {
      walkSuite(child);
    }
  }
  for (const suite of reportJson.suites ?? []) {
    walkSuite(suite);
  }
  return results;
}

function mapFailureToCriterion(title) {
  if (title.includes('landing')) return 'AC-01';
  if (title.includes('drill')) return 'AC-02';
  if (title.includes('business and engineering')) return 'AC-03';
  return 'AC-UNK';
}

async function main() {
  const iterationId = getIterationId();
  const artifactDir = path.join(workflowDir, 'artifacts', iterationId, 'qa');
  ensureDir(artifactDir);

  const jsonReportPath = path.join(artifactDir, 'playwright-results.json');
  const cycleLogPath = path.join(artifactDir, 'workflow-cycle.log');

  const testRun = await run(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['playwright', 'test', '--config=playwright.config.ts', '--reporter=json'],
    { cwd: repoRoot },
  );

  fs.writeFileSync(cycleLogPath, `${testRun.stdout}\n${testRun.stderr}`);
  fs.writeFileSync(jsonReportPath, testRun.stdout || '{}');

  let report = {};
  try {
    report = JSON.parse(testRun.stdout);
  } catch {
    report = { suites: [] };
  }

  const tests = flattenTests(report);
  const failures = tests
    .filter((t) => t.status !== 'passed')
    .map((t) => ({ title: t.title, criteria: mapFailureToCriterion(t.title) }));
  const criteriaRows = mapCriterionStatus(tests);

  const artifactRel = `workflow/artifacts/${iterationId}/qa`;
  fs.writeFileSync(qaReportPath, buildQaReport(iterationId, criteriaRows, failures, artifactRel));
  fs.writeFileSync(uiReviewPath, buildUiReview(iterationId, failures, criteriaRows, artifactRel));

  const gate = await run(
    'bash',
    ['/Users/home/IdeaProjects/flow-agent-orchestrator/scripts/check-gates.sh', repoRoot],
    { cwd: repoRoot },
  );

  const now = new Date().toISOString();
  fs.appendFileSync(
    iterationLogPath,
    `\n### Automated cycle (${now})\n- Playwright exit: ${testRun.code}\n- Gate exit: ${gate.code}\n- Failures: ${failures.length}\n`,
  );

  process.exit(gate.code);
}

await main();

