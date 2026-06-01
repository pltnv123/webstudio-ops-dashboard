# WebStudio V2.4B — Branch Strategy

- Repo: pltnv123/webstudio-ops-dashboard
- Visibility: PUBLIC
- Old default branch: main
- Target durable production/default branch: webstudio/product-build-v31
- Target remote SHA: c002bd7db0e1ed8ef1024f8eeccf5191ce4171cb
- Local SHA: c002bd7db0e1ed8ef1024f8eeccf5191ce4171cb
- Minimum required baseline SHA: c002bd7db0e1ed8ef1024f8eeccf5191ce4171cb
- Target branch exists: yes
- Target branch is c002bd7 or newer/current: yes
- Pages workflow includes target branch trigger: yes

## Decision

Owner-approved durable production/default branch: webstudio/product-build-v31.

## Safety gates

- No force push.
- No branch deletion.
- No gateway/systemd restart.
- No secrets exposed or committed.
