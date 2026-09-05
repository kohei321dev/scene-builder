# Specifications

- Status: Proposed
- Reason: repositoryに実行可能なruntimeはない。Issue #120で個人用APIと最初のSlack adapterの外部contractを提案する。
- Required decision: Decision Record 0018と次の仕様をreviewし、Acceptedにする。

## Proposed contracts

- [Personal API](personal-api.md): owner認証、idempotency、生成、採否、削除、error、limit
- [Slack adapter](slack.md): request署名、allowlist、slash command、app mention、reaction、修正、ack、返信

Productの目標は [`../product.md`](../product.md)、実装開始条件は [`../requirements.md`](../requirements.md)、責務分離は [`../architecture.md`](../architecture.md) を参照する。仕様とDecision RecordがAcceptedになるまで、runtimeが利用可能であるとは案内しない。
