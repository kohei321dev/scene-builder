# Development process

1. Issueで1つの独立した成果、対象・対象外、完了条件、文書影響を定義する。
2. `docs/README.md` から関連する正本とDecision Recordを確認する。
3. 責務境界、入出力、保存、安全性、運用を変える場合は、実装前に文書と必要なDecision Recordを承認する。
4. remote mainからIssue専用branchを作り、1 Issue / 1 Pull Requestで実装する。
5. Issueの完了条件、関連検証、文書検証、`git diff --check` を実行する。実行不可な検証は理由と再検討条件をPull Requestに記録する。
6. 日本語のcommitとPull Requestを作成し、人間のreviewとmergeを待つ。

secret、token、private URL、raw logを読み込んだり成果物へ記録したりしない。
