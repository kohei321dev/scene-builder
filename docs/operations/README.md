# Operations

- Status: Current repository state accepted / Next runtime operations proposed
- Reason: repository内runtimeは存在しない。Issue #120で次期runtimeのretry、監視、障害対応、費用guard、retention、rollbackを提案し、実環境検証は後続Issueへ分離する。
- Required decision: Decision Record 0018をreview・Acceptedにし、後続Issueごとにcloud変更を承認する。

## 現在のrepository連携

- Issue [#122](https://github.com/kohei321dev/saydeck/issues/122)で、Vercel Project `saydecks` とこのrepositoryのGit連携を解除した。この作業ではProject・過去deployment・domain・Environment Variablesを変更していない。
- 2026-09-05にownerから、Issue [#125](https://github.com/kohei321dev/saydeck/issues/125)のVercel ProjectとIssue [#126](https://github.com/kohei321dev/saydeck/issues/126)のNeon Projectを削除済みとの報告を受けた。
- CodeRabbitはこのrepositoryをaccess対象から外し、repository固有設定fileも削除した。他repositoryのCodeRabbit設定は変更していない。
- `.github/workflows/docs-check.yml`は文書構造の検証に必要なため維持している。VercelまたはCodeRabbitを直接実行するGitHub Actions workflowは存在しない。

現在、repositoryへのpushまたはPull Requestを契機としたVercelの自動deploymentは行わない。Vercel、Neon、CodeRabbitを再利用する場合は、承認済みのruntime、作成対象、連携目的、必要権限、検証方法、rollbackを別Issueで定める。

### External deletion evidence

- Status: Incomplete
- Missing evidence: repository作業ではVercel・NeonのProject消失、backup、billing、Project専用credentialの失効、Project外resourceを独立検証していない。Issue #125と#126はownerの削除済み報告に基づいてcloseした。
- Required decision: 将来の監査または課金確認で証跡が必要になった場合は、secret、data内容、private URLを出力しないread-only検証を別Issueで承認する。

## Proposed initial runtime operations

正本は[Decision Record 0018](../decisions/0018-private-api-with-slack-adapter.md)とする。

| Area | Proposed value |
| --- | --- |
| Region | `asia-northeast1` |
| Cloud Run | `saydeck-api` public ingress、`saydeck-worker` IAM private |
| Scaling | request-based billing、各service min instances 0 / max instances 1 |
| API timeout | Slack ack 3秒未満、内部目標p95 2.5秒未満 |
| Worker timeout | 45秒 |
| Provider timeout | 20秒 |
| Cloud Tasks retry | 最大3 attempts、10〜60秒backoff、最大10分 |
| Queue rate | 1 dispatch/second、最大1 concurrent dispatch |
| Application quota | owner全体で100 generation attempts/day |
| Firestore TTL | 未採用candidate、operation、attemptを30日後に削除 |
| Application log | contentを含まないstructured logを30日保持 |
| Google Cloud budget | billing accountの通貨でJPY 1,000相当/month、50%・80%・100%通知。JPY以外は作成前にowner確認。hard capではない |
| xAI billing | prepaid creditのみ、auto top-up off、invoiced spending limit `$0` |

## Metrics and alerts

- Slack ack latencyと3秒超過数
- queue age、retry count、retry exhaustion
- generation success/failure、provider latency、分類済みerror code
- Slack delivery success/failureと重複検出数
- daily attempts、token count、`cost_in_usd_ticks`
- Google Cloud budget threshold

alert条件は、Slack ack p95が2.5秒を超える、最古taskが5分を超える、taskが最大attemptへ到達する、1時間のgeneration failureが20%を超える、budget thresholdへ到達する場合とする。低trafficでpercentageが不安定な間は件数も併記する。

## Failure response

1. 新規生成をapplication quotaまたはqueue pauseで止める。
2. raw contentを見ず、operation ID、error code、queue、provider statusを確認する。
3. retryable errorと終端errorを分け、無制限retryを行わない。
4. 直前のCloud Run revisionへtrafficを戻す。schema rollbackが必要な変更を同じIssueへ混在させない。
5. owner deleteとFirestore TTLを確認する。Slack messageとprovider retentionは別境界として扱う。

## Revisit

- cold startによりSlack ack SLOを継続して満たせない場合は、`saydeck-api`だけmin instances 1を検討する。
- max instances、queue rate、daily quota、budgetが実利用を妨げる、または費用を抑えられない場合は実測を添えて変更する。
- provider/model、price、retention、Google Cloud serviceの仕様が変わった場合はDecision Recordを再評価する。
