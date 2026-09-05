# Release process

- Status: Not applicable
- Reason: remote mainに実行可能なSayDeck runtime、package、deployment設定が存在しないため、現在releaseできるapplication artifactがない。
- Revisit when: 承認済みの次期runtimeとdeployment境界がrepositoryに追加されたとき。

文書だけの変更はPull Requestのreview、`scripts/validate-docs.ps1`、`git diff --check` の成功をmerge gateとする。Issue #122でVercelのGit連携を解除し、2026-09-05にownerからIssue #125のVercel ProjectとIssue #126のNeon Projectを削除済みとの報告を受けたため、repositoryへのpushまたはPull Requestを契機とした旧runtimeの自動deploymentは行わない。次期runtimeのdeployment先とrelease手順を承認するまで新しいProjectや連携を作成しない。
