# Releases (CalVer @ deploy)

GitHub Releases use **CalVer** (`YYYY.M.D` or `YYYY.M.D.N` for multiple deploys same day). Tags are created only after a **successful** [Deploy to production](https://github.com/arpi09/grocery-manager/actions/workflows/deploy.yml) run — merge history lives in [CHANGELOG.md](./CHANGELOG.md).

**Dependency PRs:** Merged Dependabot PRs do **not** get a per-PR line in CHANGELOG. A monthly rollup workflow ([`changelog-deps-monthly.yml`](../.github/workflows/changelog-deps-monthly.yml)) adds one summary line under `[Unreleased]`. See [DEPENDENCY_HEALTH.md](./DEPENDENCY_HEALTH.md).

| CalVer | Prod SHA | Deploy run | PRs |
|--------|----------|------------|-----|
| [2026.6.24](https://github.com/arpi09/grocery-manager/releases/tag/2026.6.24) | `a9ddaabca` | [28083527659](https://github.com/arpi09/grocery-manager/actions/runs/28083527659) | — |
