# Documentation process

## 責務

- Product: 目的、対象、非対象、成功条件
- Requirement: 満たすべき条件とrelease gate
- Specification: 外部から観測できる入出力とふるまい
- Architecture: componentと責務・data flow・failure boundary
- Security: 認証、認可、secret、privacy、retention
- Operation: 監視、障害対応、retry、cost、rollback
- Guide: 利用者が実行する手順
- Decision Record: 選択肢、判断、影響、再検討条件

## 書き方

現行の事実、承認済みの判断、未承認の候補を区別する。情報が不足するときは `Incomplete` として不足根拠と必要な判断を書く。適用不可なときは `Not applicable` とし、理由と再検討条件を書く。

変更後は `scripts/validate-docs.ps1` で必須文書、内部link、Decision Recordを検証する。
