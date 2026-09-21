#!/usr/bin/env node
'use strict';

const fs = require('fs');

function main() {
  const [, , taskListPath, taskId] = process.argv;

  if (!taskListPath || !taskId) {
    process.stderr.write('USAGE: node mark-task-complete.js <task-list-path> <task-id>\n');
    process.exit(2);
  }

  let content;
  try {
    content = fs.readFileSync(taskListPath, 'utf8');
  } catch (err) {
    process.stderr.write(`NOT_FOUND: [${taskId}] (could not read file: ${err.message})\n`);
    process.exit(2);
  }

  const lines = content.split('\n');
  const tag = `[${taskId}]`;

  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('### Task ') && line.includes(tag) && !line.trimEnd().endsWith('✓')) {
      candidates.push(i);
    }
  }

  if (candidates.length === 0) {
    process.stderr.write(`NOT_FOUND: ${tag}\n`);
    process.exit(2);
  }

  if (candidates.length > 1) {
    process.stderr.write(`AMBIGUOUS: ${tag} matched ${candidates.length} lines\n`);
    process.exit(1);
  }

  const targetIndex = candidates[0];
  lines[targetIndex] = `${lines[targetIndex]} ✓`;

  let allComplete = true;
  for (const line of lines) {
    if (line.startsWith('### Task ') && !line.trimEnd().endsWith('✓')) {
      allComplete = false;
      break;
    }
  }

  let statusApplied = false;
  let statusWarn = false;

  if (allComplete) {
    const statusIndex = lines.findIndex((line) => /^status:\s*\S/.test(line));
    if (statusIndex === -1) {
      statusWarn = true;
    } else {
      lines[statusIndex] = 'status: complete';
      statusApplied = true;
    }
  }

  fs.writeFileSync(taskListPath, lines.join('\n'));

  process.stdout.write(`MARKED ${tag}\n`);
  if (statusApplied) {
    process.stdout.write('STATUS complete\n');
  }
  if (statusWarn) {
    process.stdout.write(`WARN: status line not found, ${tag} still applied\n`);
  }
  process.exit(0);
}

main();
