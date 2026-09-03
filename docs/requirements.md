# SayDeck 移行要求

- Status: Accepted direction / Rebuild pending
- Date: 2026-09-04
- Related: `docs/product-brief.md`, `docs/design.md`, `docs/adr/0017-retire-legacy-web-before-slack-rebuild.md`

## 1. 目的

SayDeckを独立した英語学習Webサービスから、Slackなど実際に使う場所で英語表現を得て採否を記録するintegrationサービスへ再構築する。

最初の成果は新機能ではなく、利用していない旧Web runtimeをrepositoryから全面撤去し、次期runtimeを旧data model・認証・deploymentへ依存せず設計できる状態にすることである。

## 2. 実装順序

### Phase 0: Legacy runtime cleanup

[Issue #116](https://github.com/kohei321dev/saydeck/issues/116)で次を削除する。

- Next.jsのINPUT / LISTS / EXPORTと全Web画面
- Web UI用Route HandlerとGitHub OAuth / NextAuth
- Neon/Postgres schema、migration、store
- 旧xAI生成、TTS、APKG、Vercel Blob実装
- Next.js、Vercel、npm build、旧runtime専用設定・dependency・script
- repository内のNeon専用agent skill
- 旧runtimeを現行として扱うCI、PR確認項目、文書、link

cleanup後、新しいSlack runtimeが実装されるまで実行可能なSayDeckサービスが存在しない状態を許容する。

### Phase 1以降: Slack-first rebuild

次の要求候補は別ADR・別Issueで確定する。Issue #116の実装範囲には含めない。

- Slackの明示入力を受ける
- Slackへ短時間でackし、LLM処理を非同期化する
- 同じthreadへ英語1文を返す
- 1 Bot messageを1候補としてreaction対象を一意にする
- 採用・再生成を処理して保存する
- provider、model、prompt versionと処理状態を追跡する
- transportに依存しないdomain境界を作り、将来adapterを追加できるようにする

## 3. Phase 0機能要件

### CR-1: Repository runtime removal

- `src/`と`db/`の旧runtimeをtracked fileから削除する。
- 旧runtimeだけが使用するpackage、lockfile、config、env example、scriptを削除する。
- runtimeがない状態を隠すための空package、常に成功するbuild、tombstone UIを作らない。

### CR-2: Development workflow cleanup

- npm、Next.js、localhost、OAuth、Vercel、Neon、APKGを前提とするCIを削除またはruntime未実装の状態へ合わせる。
- PR templateから旧Web runtime固有の確認項目を除く。
- Neon専用repository skillとlock情報を削除する。

### CR-3: Documentation boundary

- README、Product Brief、要求、設計はWeb UIを現行productとして案内しない。
- 過去ADRは削除せず、意思決定履歴として保持する。
- APKG仕様、Vercel deployment、旧UIUX・observability文書を現行正本から外す。
- 新しいSlack / Google Cloud設計が未実装・未確定であることを明示する。

### CR-4: External resource isolation

cleanupは次を変更しない。

- Vercel Project、deployment、domain、Environment Variables
- Neon Project、database、data
- Vercel Blob storeとartifact
- GitHub OAuth App
- Slack App、token、Signing Secret、Request URL
- Google Cloud resource

repositoryから設定名やadapterを削除することと、外部resourceを削除することを同一視しない。

## 4. 非機能要件

- `.env.local`、API key、OAuth secret、DB connection string、Blob token、raw provider payloadを読まない。
- userが作成した未追跡fileと別worktreeを変更しない。
- cleanupはGit履歴から旧実装を参照・復元できる形で通常のcommitとして行う。
- unrelatedなGoogle CloudまたはSlack implementationをcleanup commitへ混在させない。

## 5. Phase 0非対象

- 新しいSlack Botの実装
- Google Cloud architectureの確定・resource作成
- LLM/TTS providerの選定・比較
- Firestore schemaの確定
- Discord、公開REST API、MCP、CLI integration
- 将来のAnki連携を維持または廃止する最終判断
- 外部Vercel・Neon・Blob・OAuth resourceの停止・削除
- 旧Issue・PRの自動close

## 6. Phase 0 release gates

- `git diff --check`が成功する。
- tracked file一覧に旧Web UI・API・database・APKG runtimeが残っていない。
- dependency・設定一覧にNext.js、React、NextAuth、Postgres、Vercel Blob、Anki/APKG、sql.jsが残っていない。
- GitHub Actionsが存在する場合、削除済みnpm runtimeを要求しない。
- READMEと現行docsに利用可能なINPUT / LISTS / EXPORT、localhost、Production Web UIの案内がない。
- historical ADR以外の現行文書から旧runtimeへの有効linkがない。
- 外部resourceを変更していない。
