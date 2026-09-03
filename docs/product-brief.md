# Product Brief: SayDeck

- Status: Accepted direction / Rebuild pending
- Updated: 2026-09-04
- Decision: `docs/adr/0017-retire-legacy-web-before-slack-rebuild.md`

## Product statement

SayDeckは、Slackなど普段使う場所で発生した「日本語では言いたいことがあるが、英語ですぐ表現できない」という瞬間を捉え、その場で使える英語1文を同じ会話へ返し、採用・再生成・修正などの判断を個人の表現dataとして記録するowner向けintegrationサービスである。

SayDeckの本体は汎用的な英語生成AIではない。利用場面、生成、返信、採否記録、将来の外部教材連携をつなぐ接着部分である。

## Problem

独立したWeb UIでは、英語を必要とした瞬間とSayDeckを開く瞬間が分離する。添削、文脈保持、教材管理、音声生成そのものは既存AIサービスやAnkiで代替できるため、INPUT / LISTS / EXPORTを備えた別のWebサービスを維持する価値が小さい。

一方、実際の会話があるSlackから明示的な意図を渡し、同じthreadで候補を受け取り、その場の判断を記録する流れは、利用者が別画面へ移らずに完結する。

## Target experience

### Capture

ownerはSlackでSayDeckへ、日本語の`言いたいこと`、用途、任意のtoneを明示する。SayDeckは周辺会話を無断取得せず、ownerが明示的に渡した内容だけを入力とする。

### Suggest

SayDeckは同じthreadへ、その場で送信できる英語1文を返す。reaction対象を一意にするため、1つのBot messageには1候補だけを表示する。

### Decide

ownerはreactionまたはthread返信で候補を扱う。

- 採用: 候補を保存する
- 再生成: 別案を新しいBot messageとして1件作る
- 修正: threadの明示的な修正指示から新候補を作る
- 音声・説明: core flowの成立後に追加を検討する

### Reuse

採用した表現はsourceに依存しないdomain dataとして保持し、将来Slack以外のadapter、Discord、CLI/API、Ankiなどから利用できる余地を残す。具体的な公開APIとAnki連携方式は未決定とする。

## Current transition

最初の変更は[Issue #116](https://github.com/kohei321dev/saydeck/issues/116)である。現行Web UI、API、GitHub OAuth、Neon、APKG、Vercel runtimeをrepositoryから撤去し、新runtimeが実装されるまでサービス不在の期間を許容する。

Vercel Project、Neon Project、Blob、GitHub OAuth App、Slack Appなどの外部resourceはこのcleanupでは変更しない。

## Success measures

- ownerが別のWeb UIを開かず、Slack内で1件の候補を得られる。
- どの入力・候補・reactionを処理しているかmessage単位で一意に追跡できる。
- Slackの再送やworkerの再試行でも同じ候補・保存dataが重複しない。
- owner以外のeventを処理しない。
- 採用候補にprovider、model、prompt versionを記録できる。
- raw Slack本文、secret、provider responseをapplication logへ出さない。

## Product boundaries

- 初期版はowner本人と許可済みSlack workspaceだけを対象にする。
- Web UI、Web設定画面、アプリ内学習、採点、復習queueを持たない。
- SayDeckがSlack channelの周辺会話を自動収集することはしない。
- Discord、公開API、Codex・Claude Code連携はSlack core flowの後に検討する。
- 音声、説明、provider切替、Anki exportはcleanup Issue #116に含めない。
- 外部cloud resourceの削除はrepository cleanupと分離する。

## Source of truth

- 移行要求: `docs/requirements.md`
- 移行設計: `docs/design.md`
- 判断: `docs/adr/0017-retire-legacy-web-before-slack-rebuild.md`
- 旧APKG仕様: `docs/specifications/anki-export.md`（legacy）
- 旧Vercel運用: `docs/vercel-deployment.md`（legacy）
