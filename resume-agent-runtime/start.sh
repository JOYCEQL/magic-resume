#!/bin/sh
set -eu

mkdir -p /runtime/.opencode/agents /runtime/.opencode/tools
cp /opt/resume-runtime/opencode.json /runtime/opencode.base.json
cp /opt/resume-runtime/.opencode/agents/resume-orchestrator.txt /runtime/.opencode/agents/resume-orchestrator.txt
cp /opt/resume-runtime/.opencode/tools/resume.ts /runtime/.opencode/tools/resume.ts
if [ ! -f /runtime/opencode.json ]; then
  cp /opt/resume-runtime/opencode.json /runtime/opencode.json
fi
chmod -R a+rwX /runtime

exec opencode "$@"
