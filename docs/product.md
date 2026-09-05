# Product Brief: SayDeck

- Status: Accepted legacy retirement / Proposed API-first direction
- Updated: 2026-09-05
- Decisions: `docs/decisions/0017-retire-legacy-web-before-slack-rebuild.md`、`docs/decisions/0018-private-api-with-slack-adapter.md`

## Product statement

SayDeckはowner専用の個人用APIを本体とする。Slack Botなど普段使うUIで発生した「日本語では言いたいことがあるが、英語ですぐ表現できない」という瞬間をAPIへ渡し、その場で使える英語1文を元のUIへ返し、採用・再生成・修正などの判断を個人の表現dataとして記録するintegrationサービスである。

SayDeckの本体は汎用的な英語生成AIでもSlack専用Botでもない。owner認証された個人用APIとsource非依存のdomainを中心に、利用場面、生成、返信、採否記録、将来のadapter・教材連携をつなぐ接着部分である。

## Problem

独立したWeb UIでは、英語を必要とした瞬間とSayDeckを開く瞬間が分離する。添削、文脈保持、教材管理、音声生成そのものは既存AIサービスや教材で代替できるため、別のWebサービスを維持する価値が小さい。

一方、実際の会話があるSlackなどのUIから明示的な意図を個人用APIへ渡し、元のUIで候補を受け取り、その場の判断を記録する流れは、利用者が別画面へ移らずに完結する。

## Target experience

### Capture

ownerはSlackなどのUIからSayDeckの個人用APIへ、日本語の`言いたいこと`と任意のtoneを明示する。SayDeckは周辺会話を無断取得せず、ownerが明示的に渡した内容だけを入力とする。

### Suggest

SayDeck APIは、その場で送信できる英語1文を1候補として返す。Slack adapterでは同じthreadまたはchannelへ1つのBot messageとして表示し、reaction対象を一意にする。

### Decide

ownerはreactionまたはthread返信で候補を扱う。

- 採用: 候補を保存する
- 再生成: 別案を新しいBot messageとして1件作る
- 修正: threadの明示的な修正指示から新候補を作る
- 音声・説明: core flowの成立後に追加を検討する

### Reuse

採用した表現はsourceに依存しないdomain dataとして保持し、将来Slack以外のadapter、Discord、application、CLI、Ankiなどから同じ個人用APIを利用できる余地を残す。第三者向け公開API、multi-user、教材連携方式は未決定とする。

## Current transition

Issue [#116](https://github.com/kohei321dev/saydeck/issues/116)で旧Web runtimeをrepositoryから撤去した。現在は実行可能なruntimeを持たず、Issue [#120](https://github.com/kohei321dev/saydeck/issues/120)で個人用APIとSlack adapterの次期contractを提案している。

旧実装はGit履歴から参照できる。Issue #122でVercelのGit連携とCodeRabbitのSayDeck accessを解除した。その後、2026-09-05にownerからIssue #125のVercel ProjectとIssue #126のNeon Projectを削除済みとの報告を受けた。repository作業では外部Project消失、backup、billingを独立検証していない。

## Success measures

- ownerが別のWeb UIを開かず、Slack内で1件の候補を得られる。
- どの入力・候補・reactionを処理しているかmessage単位で一意に追跡できる。
- Slackの再送やworkerの再試行でも同じ候補・保存dataが重複しない。
- owner以外のeventを処理しない。
- 採用候補にprovider、model、prompt versionを記録できる。
- raw Slack本文、secret、provider responseをapplication logへ出さない。

## Product boundaries

- 初期版はowner本人だけが利用できる個人用APIと、許可済みSlack workspaceのadapterを対象にする。
- Web UI、Web設定画面、アプリ内学習、採点、復習queueを持たない。
- SayDeckがSlack channelの周辺会話を自動収集することはしない。slash command、app mention、候補への指定reactionだけを扱う。
- Discord、native application、CLI、Codex・Claude Code連携は個人用APIとSlack adapterのcore flow成立後に検討する。
- 第三者向け公開API、multi-user、adapterへの共通API key配布は行わない。
- 音声、説明、provider切替、Anki連携は後続Issueで必要性から判断する。
- 外部cloud resourceの削除はrepository cleanupと分離する。

## Source of truth

- 移行要求: `docs/requirements.md`
- 移行設計: `docs/architecture.md`
- 現行判断: `docs/decisions/0017-retire-legacy-web-before-slack-rebuild.md`
- 次期runtime提案: `docs/decisions/0018-private-api-with-slack-adapter.md`
- Proposed API contract: `docs/specifications/personal-api.md`
- Proposed Slack contract: `docs/specifications/slack.md`
- 過去判断: `docs/decisions/**`
