/**
 * Custom ESLint formatter that emits a CTRF (Common Test Report Format) JSON
 * report. Each lint message becomes a "test"; clean files become a passing
 * test. Severity 2 (error) -> failed, severity 1 (warning) -> other.
 *
 * Usage: eslint src tests --format=./scripts/eslint-ctrf-formatter.cjs \
 *                         --output-file=ctrf/lint-ctrf-report.json
 */

module.exports = function eslintCtrfFormatter(results, context) {
  const start = Date.now();
  const tests = [];
  let passed = 0;
  let failed = 0;
  let other = 0;

  for (const result of results) {
    const relPath = result.filePath;

    if (!result.messages || result.messages.length === 0) {
      tests.push({
        name: relPath,
        status: 'passed',
        duration: 0,
      });
      passed += 1;
      continue;
    }

    for (const msg of result.messages) {
      const isError = msg.severity === 2;
      const status = isError ? 'failed' : 'other';
      const ruleId = msg.ruleId || (msg.fatal ? 'fatal' : 'parse-error');
      const location = `${relPath}:${msg.line ?? 0}:${msg.column ?? 0}`;
      const test = {
        name: `${ruleId} (${location})`,
        status,
        duration: 0,
        suite: relPath,
        message: msg.message,
        trace: location,
        rawStatus: isError ? 'error' : 'warning',
        extra: {
          ruleId,
          severity: isError ? 'error' : 'warning',
          line: msg.line,
          column: msg.column,
          endLine: msg.endLine,
          endColumn: msg.endColumn,
          file: relPath,
        },
      };
      tests.push(test);
      if (isError) failed += 1;
      else other += 1;
    }
  }

  const stop = Date.now();

  const report = {
    reportFormat: 'CTRF',
    specVersion: '0.0.0',
    results: {
      tool: {
        name: 'eslint',
        version: (context && context.rulesMeta && '') || undefined,
      },
      summary: {
        tests: tests.length,
        passed,
        failed,
        pending: 0,
        skipped: 0,
        other,
        start,
        stop,
      },
      tests,
    },
  };

  return JSON.stringify(report, null, 2);
};
