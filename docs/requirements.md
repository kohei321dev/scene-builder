# SayDeck 移行要求

- Status: Accepted Phase 0 / Proposed next runtime contract
- Date: 2026-09-05
- Related: `docs/product.md`, `docs/architecture.md`, `docs/decisions/0017-retire-legacy-web-before-slack-rebuild.md`、`docs/decisions/0018-private-api-with-slack-adapter.md`

## 1. 目的

SayDeckを独立した英語学習Webサービスから、owner専用の個人用APIを本体とし、Slackなど実際に使うUIから英語表現を得て採否を記録するintegrationサービスへ再構築する。

Phase 0では、利用していない旧Web runtimeをrepositoryから全面撤去し、次期runtimeを旧data model・認証・deploymentへ依存せず設計できる状態にした。

## 2. Current state

Issue [#116](https://github.com/kohei321dev/saydeck/issues/116)により、次のtracked resourceを撤去した。

- Next.jsの全Web画面とRoute Handler
- GitHub OAuth / NextAuth実装
- Neon/Postgres adapter、schema、migration
- 旧AI生成、TTS、Anki/APKG、binary storage実装
- Node / Next.js / Vercelのruntime dependency、設定、env example、script
- repository内のNeon専用agent skillとlock情報
- 旧runtimeだけを検証するCI
- 旧Web UI、Anki export、Vercel deployment、observabilityのactive文書

過去ADRは削除せず、意思決定履歴として保持する。新しいSlack runtimeが実装されるまで、実行可能なSayDeckサービスが存在しない状態を許容する。

## 3. Proposed API-first runtime contract

Issue [#120](https://github.com/kohei321dev/saydeck/issues/120)では、次をDecision Record 0018と外部仕様として提案する。Decision RecordがAcceptedになるまでruntime実装を開始しない。

- owner bearer tokenで保護した個人用APIをcore contractとする
- Slackを最初のUI adapterとし、署名済みのslash commandとapp mentionだけを受ける
- Slackへ3秒以内にackし、LLM処理をCloud Tasksで非同期化する
- 元のSlack threadまたはchannelへ英語1文を返す
- 1 Bot messageを1候補としてreaction対象を一意にする
- 採用・再生成・明示的な修正をidempotentに処理して保存する
- xAIのprovider、requested/actual model、prompt version、token、cost、処理状態を追跡する
- transportに依存しないdomain境界を作り、将来Discordやapplication adapterを追加できるようにする
- 未採用dataは30日後に削除し、採用dataはownerの明示削除まで保持する
- raw Slack body、周辺会話、secret、raw provider responseを保存・loggingしない

## 4. Repository requirements

- runtime不在を隠す空package、常に成功するbuild、tombstone UIを置かない。
- READMEと現行docsは利用可能なWeb UI、localhost、production Web serviceを案内しない。
- GitHub workflowを追加する場合、実際に存在するruntimeと検証だけを実行する。
- PR templateは特定runtimeへ依存せず、Issue固有の検証と外部変更を明示させる。
- 旧実装の参照・復元にはGit履歴を使用する。

## 5. External resource isolation and reported state

Issue #116のrepository cleanupは次を変更していない。停止・削除・再利用は別Issueで扱う境界とした。

- Vercel Project、deployment、domain、Environment Variables
- Neon Project、database、data
- Vercel Blob storeとartifact
- GitHub OAuth App
- Slack App、token、Signing Secret、Request URL
- Google Cloud resource

repositoryから設定名やadapterを削除することと、外部resourceを削除することを同一視しない。

その後の状態は次のとおりである。

- Issue #122: VercelのGit連携とCodeRabbit accessを解除した。
- Issue #125: 2026-09-05にownerからVercel Projectを削除済みとの報告を受けた。
- Issue #126: 2026-09-05にownerからNeon Projectを削除済みとの報告を受けた。
- Status: Incomplete
- Missing evidence: repository作業ではVercel・NeonのProject消失、backup、billing、credential失効、Project外resourceを独立検証していない。
- Required decision: 外部状態の証跡が必要になった場合は、secretやprivate URLを出力しないread-only検証を別Issueで承認する。

## 6. Security and worktree requirements

詳細な安全境界の正本は [`security.md`](security.md) とする。

- `.env.local`、API key、OAuth secret、DB connection string、Blob token、raw provider payloadを読まない。
- userが作成した未追跡fileと別worktreeを変更しない。
- unrelatedなGoogle CloudまたはSlack implementationをcleanupへ混在させない。
- 次期runtimeでもsecretとraw会話本文をrepository、PR、application logへ出さない。

## 7. Next implementation gate

個人用APIとSlack adapterのruntime実装は、少なくとも次をAcceptedなDecision Recordと正規文書で確定してから開始する。

1. owner認証、idempotency、個人用APIの入出力契約
2. Slack event・command・reaction・修正replyの入出力契約
3. 署名検証、workspace/user allowlist、再送と重複排除
4. 同期ackと非同期workerの責務境界
5. 保存data、retention、削除方法
6. Google Cloud service、region、IAM、secret管理、費用上限
7. LLM provider、model、timeout、retry、fallback
8. 可観測性とraw本文を残さないlog設計

具体案は [`specifications/personal-api.md`](specifications/personal-api.md)、[`specifications/slack.md`](specifications/slack.md)、[`architecture.md`](architecture.md)、[`security.md`](security.md)、[`operations/README.md`](operations/README.md)、Decision Record 0018に記録する。本PRのmerge後も、cloud resource、secret、Slack App、runtimeは後続Issueの個別評価と人間承認なしに変更しない。
