#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function everyTagMatchesExpectedWrapping(content, expectedWrapped) {
  const regex = /\[T-\d{3}\]/g;
  let match;
  let found = false;
  while ((match = regex.exec(content)) !== null) {
    found = true;
    const start = match.index;
    const end = start + match[0].length;
    const isWrapped = content[start - 1] === '`' && content[end] === '`';
    if (isWrapped !== expectedWrapped) {
      return false;
    }
  }
  return found ? true : null; // null: no tags present to check
}

function checkTagFormat() {
  const driverDoc = read('agents/implementation-driver.md');
  const docBacktickWrapped = /`\[T-###\]`/.test(driverDoc);

  const targets = [
    'skills/spec-driven-dev/templates/tasks-template.md',
    'skills/spec-driven-dev/examples/example-tasks.md',
  ];

  const mismatches = [];
  for (const relPath of targets) {
    const content = read(relPath);
    const result = everyTagMatchesExpectedWrapping(content, docBacktickWrapped);
    if (result === false) {
      mismatches.push(relPath);
    }
  }

  if (mismatches.length > 0) {
    return {
      name: 'tag-format',
      ok: false,
      detail: `agents/implementation-driver.md shows tags as ${docBacktickWrapped ? 'backtick-wrapped' : 'not backtick-wrapped'}, but ${mismatches.join(', ')} ${mismatches.length > 1 ? 'do' : 'does'} not consistently match`,
    };
  }
  return { name: 'tag-format', ok: true };
}

function checkAgentDelegation() {
  const targets = [
    { file: 'commands/spec.md', agent: 'request-analyst' },
    { file: 'commands/plan.md', agent: 'implementation-architect' },
    { file: 'commands/tasks.md', agent: 'task-decomposer' },
  ];

  const missing = [];
  for (const { file, agent } of targets) {
    const content = read(file);
    if (!content.includes(agent)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    return {
      name: 'agent-delegation',
      ok: false,
      detail: `missing agent reference in: ${missing.join(', ')}`,
    };
  }
  return { name: 'agent-delegation', ok: true };
}

function runCheck(fn) {
  try {
    return fn();
  } catch (err) {
    return { name: fn.name, ok: false, detail: `error: ${err.message}` };
  }
}

function main() {
  const results = [runCheck(checkTagFormat), runCheck(checkAgentDelegation)];
  const allOk = results.every((r) => r.ok);

  if (allOk) {
    // Clean pass: stay quiet. Under Claude Code's PostToolUse hook semantics,
    // exit 0 output (stdout or stderr) goes only to the debug log and is never
    // shown to Claude or the user — this is the whole reason a plain "PASS"
    // here would be silently invisible, not evidence of nothing running.
    process.stdout.write('PASS all checks\n');
    process.exit(0);
  }

  // A failure must go to stderr with exit 2: PostToolUse never blocks (the
  // triggering edit already landed), but exit 2 is the only combination that
  // actually surfaces stderr to Claude automatically. Exit 0/1 with stdout
  // (the original implementation) is invisible under the same hook.
  for (const r of results) {
    if (r.ok) {
      process.stderr.write(`PASS ${r.name}\n`);
    } else {
      process.stderr.write(`FAIL ${r.name}: ${r.detail}\n`);
    }
  }
  process.exit(2);
}

main();
