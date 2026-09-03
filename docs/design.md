# SayDeck 移行設計

- Status: Proposed
- Date: 2026-09-04
- Requirements: `docs/requirements.md`
- Decision: `docs/adr/0017-retire-legacy-web-before-slack-rebuild.md`
- Implementation Issue: [#116](https://github.com/kohei321dev/saydeck/issues/116)

## 1. Transition architecture

```text
現在
  Next.js Web UI / API
  + GitHub OAuth
  + Neon/Postgres
  + xAI / TTS
  + Vercel Blob / APKG

Phase 0
  repositoryから旧runtimeを全面撤去
  → docsと開発運用fileだけの再構築状態
  → 実行可能なSayDeck runtimeなし

将来
  Slack-first integration runtime
  → 別ADR・別Issueで設計、実装
```

Phase 0は移植ではなく撤去である。旧moduleを将来用として残したり、Web routeを非表示にするだけの互換layerを作ったりしない。

## 2. Deletion map

| Area | Phase 0 action | Reason |
| --- | --- | --- |
| `src/app/**` | 削除 | 全Web画面、Route Handler、NextAuth endpointが旧product境界 |
| `src/components/**` | 削除 | INPUT / LISTS / EXPORT専用UI |
| `src/lib/**` | 削除 | 旧Web、Neon、APKG契約へ結合したserver module |
| `src/types/**` | 削除 | NextAuth専用型 |
| `db/**` | 削除 | 外部Neon dataは残すが、旧schemaのrepository migrationは利用しない |
| `scripts/**` | 削除 | APKG/WASM build専用 |
| Node / Next / Vercel config | 削除 | cleanup後にNode runtimeを提供しない |
| `.env.example` | 削除 | 旧runtimeのsecret・接続設定だけを案内している |
| Neon repository skills | 削除 | 次期Google Cloud設計で使用しない旧database専用resource |
| CI / PR template | 整理 | 存在しないnpm、UI、OAuth検証を要求させない |
| 旧active docs | 削除またはlegacy化 | 次期仕様の正本と誤認させない |

## 3. Retained map

| Area | Retention rule |
| --- | --- |
| `.git` history | 旧runtimeの復元・参照経路として保持 |
| `LICENSE` | repositoryのlicenseとして保持 |
| `docs/adr/**` | 過去判断を時系列で追跡するため保持 |
| Product Brief / requirements / design | Slack-firstの方向と移行状態を示す文書として保持 |
| generic GitHub settings | 次期implementationにも有効なものだけ保持 |

## 4. External boundary

Phase 0のcommitやcommandは外部resourceを直接削除・変更しない。

```text
Repository cleanup                         External state
--------------------------------------     -----------------------------
delete Neon adapter/migration          != delete Neon Project/data
delete Vercel config                   != delete Vercel Project/domain
delete Blob adapter                    != delete Blob objects/store
delete NextAuth code                   != delete GitHub OAuth App
delete Slack draft code                != delete installed Slack App
```

Vercelの既存Git連携がmain更新を検知する可能性はあるが、外部設定変更や既存deployment削除は行わない。Production Web UIを実際に停止・削除する作業は別Issueで扱う。

## 5. Historical documentation

- ADR 0013〜0016はADR 0017がAcceptedになった時点で現行判断ではなくなるが、file自体は削除しない。
- `docs/specifications/anki-export.md`と`docs/vercel-deployment.md`はlegacy文書として扱う。
- `docs/uiux/**`と`docs/observability/**`はPhase 0 implementationでactive referenceを確認し、次期設計に不要なら削除する。
- 過去文書から有用な安全設計を再利用するときは、次期ADRへ判断として書き直す。旧文書を暗黙の現行契約にしない。

## 6. Candidate next architecture

次は方向性を示す候補であり、Issue #116では実装しない。

```text
Slack Events API
  → public ingress（署名・owner・重複検証、即時ack）
  → managed task queue
  → private generation worker
  → LLM / Slack Web API
  → accepted suggestion store
```

Google CloudではCloud Run、Cloud Tasks、Firestore、Secret Managerが候補である。API Gateway、Cloud SQL、cache、Cloud Storage、Pub/Subを最初から必須にはしない。正式なservice分割、region、IAM、data retention、cost guardは別ADRで決定する。

## 7. Phase 0 verification

1. `git diff --check`
2. `git ls-files`で旧runtime pathがないことを確認
3. `git grep`でNext.js、NextAuth、Neon、Vercel Blob、APKG、旧routeのactive referenceを確認
4. `.github/workflows`が削除済みruntimeを実行しないことを確認
5. READMEと現行docsのlinkを確認
6. `git status`で未追跡のuser fileや別worktreeを変更していないことを確認

runtimeが存在しないため、Phase 0のrelease gateにlint、typecheck、production build、localhost E2Eを含めない。
