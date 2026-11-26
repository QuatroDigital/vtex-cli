# vtex-cli

**The VTEX IO CLI, ready for monorepos, scripts and AI agents.**

Every `vtex` command you already use, from [vtex/toolbelt](https://github.com/vtex/toolbelt), plus what upstream is missing:

- **One login per repository.** Keep each project on its own account and workspace; `vtex use` in one repo never moves another.
- **Run it from anywhere in a monorepo.** Point any command at an app folder with `--path`, no `cd` needed.
- **Know when a link is really live.** `vtex link --events-file` writes machine-readable events, including when the workspace is still serving an old version.
- **Runs on Node 24+.** Upstream crashes on load there.

## Install

Add it to your project as a devDependency (pick the latest version from [Releases](https://github.com/QuatroDigital/vtex-cli/releases)):

```sh
npm install --save-dev https://github.com/QuatroDigital/vtex-cli/releases/download/v<version>/vtex-<version>.tgz
npx --no -- vtex --version   # vtex/14.x
```

Versions start at 14.x, so `vtex --version` tells it apart from upstream's 4.x.

## One login per repository

```sh
vtex login <account> --local
```

The login and workspace live in the repository's root `.vtex/` instead of `~/.vtex`. Every package of a monorepo, and every git worktree inside the repository, shares them. The CLI git-ignores its own folders there, so tokens never reach a commit.

Commit the account in `.vtex/config.json`, so nobody has to type it:

```json
{ "account": "storecomponents" }
```

Then `vtex login --local` logs straight into it.

Without `--local`, nothing changes: `~/.vtex` stays the default. `VTEX_HOME` overrides both.

## Run from anywhere: `--path`

```sh
vtex --path apps/my-app link
vtex --path=apps/my-app publish
```

Runs any command as if started in that folder, like `git -C`. Handy in monorepo scripts and for agents that shouldn't `cd`.

## Follow a link from scripts: `--events-file`

```sh
vtex link --events-file tmp/link.jsonl
```

One JSON object per line, so a script or an AI agent can wait for the link instead of parsing colored logs:

```json
{"ts":"2026-01-01T12:00:00.000Z","app":"vendor.my-app@1.0.0","event":"build","status":"start"}
{"ts":"2026-01-01T12:00:20.000Z","app":"vendor.my-app@1.0.0","event":"build","status":"success"}
{"ts":"2026-01-01T12:00:21.000Z","app":"vendor.my-app@1.0.0","event":"ready"}
```

- `build`: `start`, `success` or `fail` (with `errorCode` and `message`).
- `ready`: the workspace serves this version.
- `stale`: the build succeeded but the workspace still serves another linked version, which happens after a patch on top of a failed build.
- `error`: the link itself failed.

## Everything else

Commands, workspaces and app development work exactly as upstream: run `vtex help`, or see the [upstream repository](https://github.com/vtex/toolbelt).
