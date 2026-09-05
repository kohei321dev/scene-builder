# SayDeck 移行設計

- Status: Accepted Phase 0 / Proposed next runtime
- Date: 2026-09-05
- Requirements: `docs/requirements.md`
- Decisions: `docs/decisions/0017-retire-legacy-web-before-slack-rebuild.md`、`docs/decisions/0018-private-api-with-slack-adapter.md`
- Related Issues: [#116](https://github.com/kohei321dev/saydeck/issues/116)、[#120](https://github.com/kohei321dev/saydeck/issues/120)

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
| `docs/decisions/**` | 過去判断を時系列で追跡するため全件保持 |
| Product / requirements / architecture | API-firstの方向、Slack adapter、現在の移行状態を示す正本 |
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

## 6. Proposed next architecture

次はDecision Record 0018で提案する構成であり、未実装である。Decision RecordがAcceptedになるまでcloud resourceやruntimeを作らない。

```text
owner client / Slack
  → saydeck-api: Cloud Run public ingress
       ├─ /v1/**: owner bearer token
       ├─ /slack/**: Slack signature + workspace/user allowlist
       ├─ Firestore: operationとidempotency
       └─ Cloud Tasks: 有限retry
            → saydeck-worker: Cloud Run private ingress
                 ├─ xAI Responses API
                 ├─ Firestore: suggestionとgeneration metadata
                 └─ Slack Web API: sourceがSlackの場合の返信
```

全serviceとdataは`asia-northeast1`へ集約する。API serviceだけをpublic ingressとし、workerはCloud Tasks専用service accountからのOIDC requestだけを許可する。secretはSecret Managerでservice単位に分離する。

API Gateway、Cloud SQL、cache、Cloud Storage、Pub/Sub、multi-regionを最初から必須にしない。API contractは [`specifications/personal-api.md`](specifications/personal-api.md)、Slack固有contractは [`specifications/slack.md`](specifications/slack.md) を正本とする。

### Data flow

1. API serviceがroute固有の認証、owner、入力、idempotencyを検証する。
2. Firestore transactionでoperationを作り、Cloud Taskを一意なoperation IDでenqueueする。
3. APIまたはSlackへ`queued`を返す。Slack requestは3秒以内にackする。
4. private workerがtaskを取得し、xAIへ1候補のstructured outputを要求する。
5. workerが正規化済み候補とmetadataをFirestoreへ保存する。
6. sourceがSlackなら、candidate IDを紐づけて元threadまたはchannelへ投稿する。
7. accept、regenerate、correctも新しいidempotent commandとして同じflowを通る。

### Failure boundaries

- API serviceがqueue登録前に失敗したrequestは処理済みと扱わない。
- Cloud Tasksとworkerはat-least-onceであり、Firestoreのoperation stateで重複生成と重複保存を抑止する。
- retry対象はproviderまたはSlackの`429`、timeout、`5xx`だけとする。
- providerの認証・schema・入力errorは終端failureとして保存し、安全なerror codeだけを返す。
- Slack投稿成功直後のprocess停止には重複返信windowが残る。exactly-once deliveryは保証しない。

## 7. Verification boundary

Phase 0は次を静的に確認する。

1. `git diff --check`
2. tracked file一覧に旧runtime pathがないこと
3. runtime dependency、migration、旧workflowがないこと
4. READMEと現行docsに利用可能な旧Web serviceへの案内・linkがないこと
5. ADRが全件保持されていること
6. external resource操作とsecret読み取りを行っていないこと

runtimeが存在しないため、lint、typecheck、production build、localhost E2Eは実行しない。これらを成功させるためだけのpackageやscriptも置かない。

## 8. Implementation state and remaining risks

component、data flow、failure boundary、Google Cloud service、region、IAMはDecision Record 0018としてProposedである。repositoryには引き続きruntime、Infrastructure as Code、cloud resource、secretが存在しない。

次は後続Issueで実装・検証する必要がある。

- Slackの3秒ackをmin instances 0で満たせるか
- Firestore transactionとtask作成のfailure recovery
- provider call後の重複Slack delivery window
- service accountごとの実効権限
- xAI retentionとZDR availability
- JPY 1,000のbudget alert、max instances、daily quotaが費用guardとして機能するか
