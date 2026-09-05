# SayDeck documentation

SayDeckの正規文書と意思決定履歴への入口である。現在はrepositoryに実行可能なruntimeがなく、Slack-first再構築の仕様と設計は未承認である。

## 正規文書

- [Product](product.md): 目的、対象ユーザー、非対象、成功条件
- [Requirements](requirements.md): 承認済み要求と次期実装開始条件
- [Specifications](specifications/README.md): 外部から観測できる入出力契約
- [Architecture](architecture.md): 現在の構成と責務・外部resource境界
- [Security](security.md): 認証、権限、secret、privacy、retentionの境界
- [Decision Records](decisions/README.md): 意思決定一覧と運用
- [Development process](process/development.md): IssueからPull Requestまでの変更手順
- [Documentation process](process/documentation.md): 文書の責務と更新方法
- [Release process](process/release.md): release判断
- [Operations](operations/README.md): 運用、監視、障害対応
- [Guides](guides/README.md): 利用者向け手順

## 現行と履歴の区別

Product、Requirements、ArchitectureとAcceptedなDecision Record 0017が現在の正本である。ProposedまたはSupersededなDecision RecordとGit履歴の旧runtimeは参考記録であり、現行仕様ではない。

## 検証

`powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
