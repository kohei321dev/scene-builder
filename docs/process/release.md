# Release process

- Status: Not applicable
- Reason: remote mainに実行可能なSayDeck runtime、package、deployment設定が存在しないため、現在releaseできるapplication artifactがない。
- Revisit when: 承認済みの次期runtimeとdeployment境界がrepositoryに追加されたとき。

文書だけの変更はPull Requestのreview、`scripts/validate-docs.ps1`、`git diff --check` の成功をmerge gateとする。外部resourceの変更はこの文書移行に含めない。
