# SayDeck

SayDeckは、owner専用の個人用APIを本体とし、Slack Botなど普段使うUIから日本語の意図をその場で使える英語1文へ変換し、採否を記録するintegrationサービスとして再構築中です。

## Current status

- Issue [#116](https://github.com/kohei321dev/saydeck/issues/116)で、旧Next.js Web UI、API、database adapter、認証、音声、Anki export、deployment設定をrepositoryから撤去しました。
- 現在、repositoryに実行可能なSayDeck runtimeはありません。
- 個人用APIと最初のSlack adapter、Google Cloud構成は未実装です。Issue [#120](https://github.com/kohei321dev/saydeck/issues/120)のProposedなDecision Recordをreviewし、Acceptedになってから後続Issueで追加します。
- runtime不在を隠す空のpackage、常に成功するbuild、代替Web画面は置きません。

## Product direction

```text
Slack BotなどのUIで日本語の意図を明示する
  → owner認証された個人用APIへ渡す
  → 非同期で英語1文を生成し、元のUIへ返す
  → 採用・再生成・修正をsource非依存のdataとして記録する
```

SayDeckは汎用的な英語生成AIそのものではなく、個人用APIを中心に、実際の利用場面、生成、返信、利用者の判断をつなぐ接着部分を責務とします。最初のUI adapterはSlackとし、Discordやapplicationはcore API成立後に別Issueで検討します。

## Repository contents

- [`docs/README.md`](docs/README.md): 正規文書全体の入口
- `docs/product.md`: productの目的と境界
- `docs/requirements.md`: 移行要求と後続実装の開始条件
- `docs/architecture.md`: cleanup後の構成と外部resource境界
- `docs/decisions/**`: 過去を含む意思決定履歴

旧実装を確認または復元する場合はGit履歴を使用します。過去ADRは履歴として保持していますが、現行runtimeの仕様ではありません。

## External resources

Issue [#122](https://github.com/kohei321dev/saydeck/issues/122)で、Vercel Project `saydecks` とこのrepositoryのGit連携、およびCodeRabbitのこのrepositoryへのaccessを解除しました。GitHub Actionsは文書検証用のDocs checkだけを維持しています。

Vercel Project・過去deployment・domain・Environment Variables、Neon Project・data、Vercel Blob、GitHub OAuth App、既存Slack Appは削除または変更していません。VercelのGit連携またはCodeRabbitを再度有効にする場合は、対象runtimeと必要性を別Issueで承認してから設定します。

## Development

現時点ではinstall、localhost起動、lint、typecheck、buildのcommandを提供していません。新しいruntimeは、AcceptedなDecision Recordと1 Issue 1 PRの単位で追加します。

## License

MIT License. See `LICENSE`.
