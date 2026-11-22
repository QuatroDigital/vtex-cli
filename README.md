# vtex-cli

Fork of [vtex/toolbelt](https://github.com/vtex/toolbelt), the VTEX IO CLI, with a few additions for scripts, monorepos and AI agents. Every upstream command works as before (`vtex help`); versions start at 14.x so `vtex --version` tells the fork apart from upstream's 4.x.

## Install

Add it to the project as a devDependency instead of installing it globally:

```sh
npm install --save-dev https://github.com/QuatroDigital/vtex-cli/releases/download/v14.0.0/vtex-14.0.0.tgz
npx --no -- vtex --version
```

Runs on Node 24+.

## What the fork adds

### One login per repository

By default the CLI keeps its login and workspace in `~/.vtex`, shared by every project, as upstream does. To give a repository its own, log in with `--local`:

```sh
vtex login <account> --local
```

It creates `.vtex/session` at the repository root (the main checkout's root when run from a worktree). From then on every folder inside the repository finds it from the current folder up: every package of a monorepo, and worktrees under it, share that login and workspace, and `vtex use` there doesn't move other projects. The CLI's folders there (`session/`, `logs/`, …) get their own `.gitignore`, so login tokens stay out of git.

Resolution order: `VTEX_HOME` if set, else the nearest `.vtex/session` from the current folder up, else `~/.vtex`.

### `--path <dir>`

Run any command as if it were started in another folder, like `git -C`:

```sh
vtex --path apps/my-app link
vtex --path=apps/my-app deploy
```

Useful for monorepo scripts that would otherwise need `cd apps/my-app && vtex …`. The per-project session is resolved from that folder too.

### `vtex link --events-file <file>`

Writes the link's build events as JSON lines (the file is emptied at start), so scripts can follow a link without parsing its terminal output:

```json
{"ts":"2026-01-01T12:00:00.000Z","app":"vendor.my-app@1.0.0","event":"build","status":"start"}
{"ts":"2026-01-01T12:00:20.000Z","app":"vendor.my-app@1.0.0","event":"build","status":"success"}
{"ts":"2026-01-01T12:00:21.000Z","app":"vendor.my-app@1.0.0","event":"ready"}
```

- `build` with `status` `start`, `success` or `fail` (`fail` adds `errorCode` and `message`).
- After each success: `ready` once the workspace serves this version, or `stale` with the version still linked (a patch on top of a failed build can report success while the old link keeps serving).
- `error` when the link itself fails.

## Development

```sh
npm install
npm run build
npm test
npm run watch   # rebuilds on change; see docs/contributing.md
```
