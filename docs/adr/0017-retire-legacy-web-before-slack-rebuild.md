# ADR 0017: Retire the legacy Web runtime before the Slack-first rebuild

- Status: Accepted
- Date: 2026-09-04
- Related Issue: [#116](https://github.com/kohei321dev/saydeck/issues/116)
- Supersedes: ADR 0013、0014、0015、0016の現行product・runtime判断

## Context

SayDeckは、独立した英語学習WebサービスとしてINPUT / LISTS / EXPORTを提供してきた。しかし、添削、候補生成、文脈保持、教材管理、音声生成の多くは既存のAIサービスとAnkiで代替でき、Web UIを開かなければ使えない導線は実際に英語を使いたい瞬間と分離している。

今後の価値は、Slackなど普段使う場所で発生した日本語の意図を、その場で使える英語1文へ変換し、同じ会話の中で採用・再生成などの判断を記録できるintegrationに置く。

現行Web UIは現在利用していない。旧実装はGit履歴から参照・復元できるため、新しいSlack runtimeを完成させてから段階移行するのではなく、最初にrepositoryから撤去してよいとownerが判断した。

## Decision

1. SayDeckの将来productはWeb UIを操作面にしない。主要な利用面をSlackなどのintegrationへ移す。
2. 最初の実装Issueとして、trackedな旧Web runtimeをrepositoryから全面撤去する。
3. 撤去対象にはNext.js UI・Route Handler、GitHub OAuth、Neon/Postgres domain、AI/TTS、APKG、Vercel Blob、旧deployment設定、runtime dependency、migration、専用script、Neon専用repository skillを含める。
4. 過去ADRは意思決定履歴として保持する。旧機能の詳細文書は現行正本から外し、不要なものは実装Issueで削除する。
5. Git履歴を復元経路とし、旧runtimeの互換layer、非表示UI、空のbuild用package、tombstone Webアプリは作らない。
6. 撤去後、新しいSlack runtimeが実装されるまで、repositoryに実行可能なSayDeckサービスが存在しない期間を許容する。
7. Vercel、Neon、Vercel Blob、GitHub OAuth App、Slack Appなど外部resourceはこの判断では削除・変更しない。
8. Google Cloud architecture、Slack event・reaction契約、保存model、LLM/TTS provider、Discord・公開API、Anki連携は別ADR・別Issueで決定する。

## Options Considered

### Option A: 新しいSlack runtimeへ切り替えてから旧Web runtimeを削除する

- 利点: 稼働中の機能を維持でき、rollback先も分かりやすい。
- 却下理由: 現行UIを利用しておらず、旧domainを残すことで新設計が不要な互換性へ引っ張られる。

### Option B: UIだけを非表示にし、API、DB、APKG実装を残す

- 利点: 削除量が小さく、既存の生成・保存実装を再利用しやすい。
- 却下理由: Web UIを前提に設計した認証、保存、分類、exportの責務とdependencyが残り、Slack-firstの小さいdomain境界を作りにくい。

### Option C: repository内の旧runtimeを先に全面撤去する

- 採用理由: Git履歴を安全な参照先として利用しながら、次期runtimeを必要な責務だけで設計できる。現在利用していないサービスの互換維持も不要になる。

## Consequences

- repositoryは一時的にdocsと開発運用ファイルが中心になり、`npm run dev`、lint、typecheck、buildを提供しない。
- 現行Productionの外部resourceは残る。repositoryからruntimeを削除しても、Vercel上の既存deployment、domain、Neon data、Blob artifactが自動削除されるわけではない。
- main更新によりVercelのGit連携がbuildを試行し、runtime不在で失敗する可能性を許容する。外部連携の停止・削除は別作業とする。
- 旧実装から再利用したい処理が見つかった場合は、Git履歴から必要な考え方または最小コードだけを明示的に取り出す。
- 未完了の旧Web product向けIssueとPRは、そのまま実装・mergeせず、cleanup後にcloseまたは次期仕様へ再起票する。
- 現行APKG実装は削除する。将来のAnki連携を残すかは未決定であり、このADRはAnki integration自体を恒久廃止する判断ではない。

## Security / Privacy

- cleanupで`.env.local`、API key、OAuth secret、DB connection string、Blob token、raw provider payloadを読まない。
- repositoryからsecret名や設定例を削除しても、外部secret storeの値は変更しない。
- 外部dataのbackup、export、deleteは本ADRの権限に含めない。
- 次期Slack runtimeでは、Slack署名検証、workspace/user allowlist、event重複排除、raw会話本文をlogへ残さない境界を別ADRで定義する。

## Operations

1. docs-only計画PRをreview・mergeする。
2. Issue #116を実装前評価し、ownerの実装承認後に旧runtimeを削除する。
3. `git diff --check`とtracked file・dependency・文書linkの静的確認を行う。
4. cleanup PRのmerge後、旧Issue・PRと外部resourceの扱いを別途判断する。
5. Google Cloud上のSlack-first MVPを新しいIssueで設計・実装する。

## Revisit Conditions

- cleanup実装前に現行Web UIを再利用する必要が生じた場合。
- Git履歴だけでは保持できないrepository artifactが判明した場合。
- 外部Vercel・Neon resourceも同じ作業で削除するようownerが明示的に範囲変更した場合。

## References

- [Issue #116](https://github.com/kohei321dev/saydeck/issues/116)
- `docs/product-brief.md`
- `docs/requirements.md`
- `docs/design.md`
- `docs/adr/0013-expression-production-and-apkg-only.md`
- `docs/adr/0016-situation-first-expression-and-anki-contract.md`
