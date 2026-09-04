# SayDeck 移行要求

- Status: Accepted / Phase 0 completed
- Date: 2026-09-04
- Related: `docs/product.md`, `docs/architecture.md`, `docs/decisions/0017-retire-legacy-web-before-slack-rebuild.md`

## 1. 目的

SayDeckを独立した英語学習Webサービスから、Slackなど実際に使う場所で英語表現を得て採否を記録するintegrationサービスへ再構築する。

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

## 3. Slack-first rebuild candidates

次の要求候補は別ADR・別Issueで確定する。Phase 0の実装には含めない。

- Slackの明示入力を受ける
- Slackへ短時間でackし、LLM処理を非同期化する
- 同じthreadへ英語1文を返す
- 1 Bot messageを1候補としてreaction対象を一意にする
- 採用・再生成・修正を処理して保存する
- provider、model、prompt versionと処理状態を追跡する
- transportに依存しないdomain境界を作り、将来adapterを追加できるようにする

## 4. Repository requirements

- runtime不在を隠す空package、常に成功するbuild、tombstone UIを置かない。
- READMEと現行docsは利用可能なWeb UI、localhost、production Web serviceを案内しない。
- GitHub workflowを追加する場合、実際に存在するruntimeと検証だけを実行する。
- PR templateは特定runtimeへ依存せず、Issue固有の検証と外部変更を明示させる。
- 旧実装の参照・復元にはGit履歴を使用する。

## 5. External resource isolation

repository cleanupは次を変更していない。停止・削除・再利用は別Issueで扱う。

- Vercel Project、deployment、domain、Environment Variables
- Neon Project、database、data
- Vercel Blob storeとartifact
- GitHub OAuth App
- Slack App、token、Signing Secret、Request URL
- Google Cloud resource

repositoryから設定名やadapterを削除することと、外部resourceを削除することを同一視しない。

## 6. Security and worktree requirements

詳細な安全境界の正本は [`security.md`](security.md) とする。

- `.env.local`、API key、OAuth secret、DB connection string、Blob token、raw provider payloadを読まない。
- userが作成した未追跡fileと別worktreeを変更しない。
- unrelatedなGoogle CloudまたはSlack implementationをcleanupへ混在させない。
- 次期runtimeでもsecretとraw会話本文をrepository、PR、application logへ出さない。

## 7. Next implementation gate

Slack-first runtimeの実装は、少なくとも次を承認済み文書で確定してから開始する。

1. Slack event・command・reactionの入出力契約
2. 署名検証、workspace/user allowlist、再送と重複排除
3. 同期ackと非同期workerの責務境界
4. 保存data、retention、削除方法
5. Google Cloud service、region、IAM、secret管理、費用上限
6. LLM provider、model、timeout、retry、fallback
7. 可観測性とraw本文を残さないlog設計

本節は承認済みの開始条件であり、個別のSlack入出力やGoogle Cloud構成を承認するものではない。未決定の契約は [`specifications/README.md`](specifications/README.md) に、運用上の不足は [`operations/README.md`](operations/README.md) に記録する。
