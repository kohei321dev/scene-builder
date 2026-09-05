# Operations

- Status: Incomplete
- Reason: 現在はrepository内runtimeがなく、次期runtimeの運用要件と外部resourceの再利用方針が未決定である。
- Required decision: 次期runtimeのretry、監視、障害対応、rollback、費用上限、retentionと削除手順を承認する。

## 現在のrepository連携

- Issue [#122](https://github.com/kohei321dev/saydeck/issues/122)で、Vercel Project `saydecks` とこのrepositoryのGit連携を解除した。Project・過去deployment・domain・Environment Variablesは保持し、値を確認または変更していない。
- CodeRabbitはこのrepositoryをaccess対象から外し、repository固有設定fileも削除した。他repositoryのCodeRabbit設定は変更していない。
- `.github/workflows/docs-check.yml`は文書構造の検証に必要なため維持している。VercelまたはCodeRabbitを直接実行するGitHub Actions workflowは存在しない。

現在、repositoryへのpushまたはPull Requestを契機としたVercelの自動deploymentは行わない。VercelのGit連携またはCodeRabbitを再接続する場合は、承認済みのruntime、連携目的、必要権限、検証方法、rollbackを別Issueで定める。
