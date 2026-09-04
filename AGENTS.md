# SayDeck repository guidance

## 文書の確認順

SayDeckを変更する前に `docs/README.md` を入口とし、Product、Requirement、Specification、Architecture、Security、Decision Record、Process、Operation、Guideの順で関連文書を確認する。

## 更新規則

- 入出力、パラメーター、画面・API・保存・生成・exportのふるまい、要求、仕様、設計を変える場合は関連する `docs/**` を同じPull Requestで更新する。
- 後から変更しにくい責務境界、外部service、data、認証、security、costの判断は `docs/decisions/` にDecision Recordを作る。
- 過去のDecision Recordは現行仕様として扱わず、Statusと置換関係を確認する。IDは再利用しない。
- 確認できない事実は推測せず `Incomplete`、適用対象がない場合は理由と再検討条件を伴う `Not applicable` とする。
- 文書変更後は `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` と `git diff --check` を実行する。
- secret、token、connection string、private URL、raw provider payloadをrepository、Issue、Pull Request、logへ記録しない。
