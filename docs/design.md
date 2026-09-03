# SayDeck 移行設計

- Status: Accepted / Phase 0 completed
- Date: 2026-09-04
- Requirements: `docs/requirements.md`
- Decision: `docs/adr/0017-retire-legacy-web-before-slack-rebuild.md`
- Implementation Issue: [#116](https://github.com/kohei321dev/saydeck/issues/116)

## 1. Current architecture

```text
SayDeck repository
  ├─ README
  ├─ current product / requirements / design
  ├─ historical ADRs
  └─ generic repository operation files

Executable application runtime: none
```

Phase 0は移植ではなく撤去である。旧moduleを将来用として残したり、Web routeを非表示にするだけの互換layerを作ったりしていない。

## 2. Removed repository areas

| Area | Phase 0 result |
| --- | --- |
| `src/**` | 全Web画面、API、認証、AI、TTS、database、export実装を削除 |
| `db/**` | 旧schema migrationを削除 |
| `scripts/**` | 旧Anki/WASM専用scriptを削除 |
| Node / Next / Vercel config | package、lockfile、compiler、lint、deployment設定を削除 |
| `.env.example` | 旧runtime専用の設定例を削除 |
| Neon repository skills | 旧database専用skillとlock情報を削除 |
| GitHub Actions | 存在しないnpm runtimeを実行するCIを削除 |
| Legacy active docs | 旧UI、Anki export、Vercel deployment、observability文書を削除 |

旧runtimeの復元経路はGit履歴だけとする。空package、dummy build、tombstone applicationは作らない。

## 3. Retained repository areas

| Area | Retention rule |
| --- | --- |
| `.git` history | 旧runtimeの復元・参照経路として保持 |
| `LICENSE` | repositoryのlicenseとして保持 |
| `docs/adr/**` | 過去判断を時系列で追跡するため全件保持 |
| Product Brief / requirements / design | Slack-firstの方向と現在の移行状態を示す正本 |
| generic GitHub settings | 次期implementationにも有効なものだけ保持 |

## 4. External boundary

Phase 0のcommitやcommandは外部resourceを直接削除・変更していない。

```text
Repository cleanup                         External state
--------------------------------------     -----------------------------
delete Neon adapter/migration          != delete Neon Project/data
delete Vercel config                   != delete Vercel Project/domain
delete Blob adapter                    != delete Blob objects/store
delete NextAuth code                   != delete GitHub OAuth App
delete Slack draft code                != delete installed Slack App
```

Git連携など既存の外部automationがmain更新を検知する可能性はあるが、外部設定変更や既存resource削除は別作業とする。

## 5. Decision history

- ADR 0017はPhase 0実装によりAcceptedとする。
- ADR 0013〜0016はADR 0017により現行product・runtime判断としてはSupersededとなる。
- ADR fileは削除せず、当時の背景・判断・trade-offを確認できる状態で保持する。
- 旧UI、export、deployment、observabilityの詳細文書はactive specificationと誤認されないようrepositoryから削除した。必要な情報はGit履歴から参照する。

## 6. Candidate next architecture

次は方向性を示す候補であり、未実装・未確定である。

```text
Slack Events API
  → public ingress（署名・owner・重複検証、即時ack）
  → managed task queue
  → private generation worker
  → LLM / Slack Web API
  → accepted suggestion store
```

Google CloudではCloud Run、Cloud Tasks、Firestore、Secret Managerが候補である。API Gateway、Cloud SQL、cache、Cloud Storage、Pub/Subを最初から必須にはしない。正式なservice分割、region、IAM、data retention、cost guardは別ADRで決定する。

## 7. Verification boundary

Phase 0は次を静的に確認する。

1. `git diff --check`
2. tracked file一覧に旧runtime pathがないこと
3. runtime dependency、migration、旧workflowがないこと
4. READMEと現行docsに利用可能な旧Web serviceへの案内・linkがないこと
5. ADRが全件保持されていること
6. external resource操作とsecret読み取りを行っていないこと

runtimeが存在しないため、lint、typecheck、production build、localhost E2Eは実行しない。これらを成功させるためだけのpackageやscriptも置かない。
