# ADR運用ガイド

このリポジトリでは、後から変更しにくい技術判断、外部サービス選定、データ保存方針、認証・権限・コストに関わる判断をArchitecture Decision Recordとして残す。

生成AIとの対話中に複数の選択肢が短時間で出る場合でも、採用した判断、却下した案、前提、再検討条件を短く残す。

## 保管場所

- ADR一覧と運用ルール: `docs/ADR.md`
- 個別ADR: `docs/adr/NNNN-short-title.md`
- 機能別メモ: 必要なら `docs/<feature-name>/` に置く

ADR本体は `docs/adr/` に集約する。機能別メモ、Issue、PRからADR番号へリンクする。

## 現行のプロダクト判断

- `docs/adr/0017-retire-legacy-web-before-slack-rebuild.md`（Accepted）: Web UIを廃止し、外部resourceを変更せずrepository内の旧Web runtimeを先に全面撤去した。Slack-firstの詳細は後続ADRで決める。

ADR 0013〜0016はADR 0017により現行product・runtime判断としてSupersededとなった。fileは当時の意思決定履歴として保持するが、新規機能の設計根拠としては使用しない。

- `docs/adr/0016-situation-first-expression-and-anki-contract.md`: 旧主・副シチュエーション、表現レイヤー、Anki契約
- `docs/adr/0015-situation-tag-taxonomy-and-anki-deck-hierarchy.md`: 旧シチュエーション分類とAnki deck階層
- `docs/adr/0014-private-object-storage-selection.md`: 旧音声・APKG private storage選定
- `docs/adr/0013-expression-production-and-apkg-only.md`: 旧INPUT / LISTS / EXPORTとAPKG-only product scope

`docs/adr/0011-rename-to-saydeck.md`を含むそれ以前のADRも履歴として保持する。旧実装の詳細が必要な場合はGit履歴と併せて参照する。

## 書くタイミング

次のいずれかに該当する場合は、Issueまたは実装ブランチを進める前にADRを作る。

- 永続化、認証、外部API、クラウドサービス、課金、運用に関わる
- 後から移行コストが高くなる
- 複数の妥当な選択肢があり、トレードオフを説明する必要がある
- 生成AIとの相談で前提や選択肢が変化した
- セキュリティ、secret、privacy、公開範囲に影響する
- 複数ファイル、複数コンポーネント、複数リリースにまたがる

以下はADR不要とする。

- 小さな文言修正
- UIの軽微な見た目調整
- 既存ADRの範囲内に収まるバグ修正
- 依存関係や責務境界を変えない局所的なリファクタ

## 命名

```text
docs/adr/0008-neon-postgres-practice-records.md
```

- 4桁連番
- 英小文字kebab-case
- タイトルは決定内容が分かる短い名前

## Status

- `Proposed`: 実装前、またはIssue起票前の提案
- `Accepted`: 実装方針として採用済み
- `Superseded`: 後続ADRで置き換え済み
- `Deprecated`: 使わない方針として残す

軽量運用として、Issue起票時点では `Proposed`、実装PRがmergeされたら `Accepted` に更新する。

## 標準構成

```md
# ADR NNNN: Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context

## Decision

## Options Considered

## Consequences

## Security / Privacy

## Operations

## Revisit Conditions

## References
```

外部サービス、DB、認証、AI APIでは `Security / Privacy` と `Operations` を必須にする。

## 変更時の扱い

最終ゴールが変わらず、実装手段だけ変わった場合は、既存ADRに `Addendum` を追加する。

最終ゴール、責務境界、保存対象、公開範囲が変わる場合は、新しいADRを作り、古いADRを `Superseded` にする。

## 生成AI利用時の記録ルール

- raw chat logはADRに貼らない
- secret、token、private URL、raw provider responseは書かない
- 採用案、却下案、保留案を分ける
- `[事実]` `[推測]` `[未検証]` を必要に応じて使う
- 価格、仕様、制限など変わりやすい情報は一次情報の確認日を添える
- 「なぜ今この判断をしたか」と「何が変わったら見直すか」を残す

## 参考にする考え方

- 『ソフトウェアアーキテクチャの基礎 第2版』: アーキテクチャ決定を記録し、トレードオフとして扱う
- 『システム思考の世界へ』: 複雑な変更では相互依存とフィードバックを扱う
