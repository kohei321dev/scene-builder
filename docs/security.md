# Security

- Status: Accepted boundary / Incomplete for the next runtime
- Updated: 2026-09-04

## 確認済みの境界

- `.env.local`、API key、OAuth secret、database connection string、storage token、raw provider payloadをrepository、Issue、Pull Request、application logに残さない。
- Issue #116のrepository cleanupはVercel、Neon、Blob、GitHub OAuth App、Slack App、Google Cloud resourceの設定・data・secretを変更していない。
- Issue [#122](https://github.com/kohei321dev/saydeck/issues/122)でCodeRabbitのaccessをこのrepositoryから外し、Vercel ProjectとのGit連携を解除した。他repositoryのCodeRabbit access、およびVercel Project・deployment・domain・Environment Variablesは変更していない。
- 外部連携の再接続時は、対象repositoryだけに必要最小限の権限を付与し、目的と解除方法を同じIssueで確認する。
- 次期Slack runtimeはowner本人と許可済みworkspaceだけを対象とし、ownerが明示した入力以外の周辺会話を無断取得しない。
- raw Slack本文とprovider responseをapplication logへ出力しない。

## Incomplete

Slack署名検証、workspace/user allowlist、event再送と重複排除、IAM、secret配布、保存data、retention、削除方法は未決定である。現在runtimeと承認済みのSlack契約がないことが不足根拠である。Issue #120のDecision Recordと後続実装Issueで検証可能な条件を承認するまで、候補を実装仕様として扱わない。
