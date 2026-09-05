# Security

- Status: Accepted baseline / Proposed next runtime boundary
- Updated: 2026-09-05

## 確認済みの境界

- `.env.local`、API key、OAuth secret、database connection string、storage token、raw provider payloadをrepository、Issue、Pull Request、application logに残さない。
- Issue #116のrepository cleanupはVercel、Neon、Blob、GitHub OAuth App、Slack App、Google Cloud resourceの設定・data・secretを変更していない。
- Issue [#122](https://github.com/kohei321dev/saydeck/issues/122)でCodeRabbitのaccessをこのrepositoryから外し、Vercel ProjectとのGit連携を解除した。他repositoryのCodeRabbit access、およびVercel Project・deployment・domain・Environment Variablesは変更していない。
- 外部連携の再接続時は、対象repositoryだけに必要最小限の権限を付与し、目的と解除方法を同じIssueで確認する。
- 次期Slack runtimeはowner本人と許可済みworkspaceだけを対象とし、ownerが明示した入力以外の周辺会話を無断取得しない。
- raw Slack本文とprovider responseをapplication logへ出力しない。

## Proposed API and Slack boundary

Issue [#120](https://github.com/kohei321dev/saydeck/issues/120)と[Decision Record 0018](decisions/0018-private-api-with-slack-adapter.md)で、次を提案する。

- `/v1/**`はowner bearer token、`/slack/**`はSlack signatureと5分以内のtimestampで認証する。
- 許可済みworkspaceとowner `user_id`の両方が一致した入力だけを処理する。
- slash command、app mention、保存済みcandidateへの指定reactionだけを処理し、一般message eventやchannel historyを要求しない。
- public API serviceとprivate workerへ別service accountを割り当て、Cloud Tasks専用identityだけにworker invokeを許可する。
- owner token、Slack Signing Secret、Slack Bot Token、xAI API keyを別のSecret Manager secretとして保持し、serviceごとに必要なsecret versionだけを参照する。
- user-managed service account keyを作らない。
- raw Slack body、Authorization header、`response_url`、secret、raw provider responseを保存またはloggingしない。
- 未採用dataとoperationは30日TTL、採用dataはowner deleteまで保持する。
- xAI requestは`store: false`、tool・searchなしとする。ただしproviderの標準retentionが最大30日である残存riskはowner向けMVPで受け入れる。

## Remaining verification

- Status: Incomplete
- Missing evidence: runtime、cloud resource、service account、secret、Slack App設定が未実装であり、実効権限、署名検証、owner拒否、TTL、log除外、provider retentionを実環境で検証していない。
- Required decision: Decision Record 0018をreview・Acceptedにし、後続Issueごとにsecurity testと権限差分を承認する。
