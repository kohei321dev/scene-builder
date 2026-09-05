# ADR 0018: Use a private personal API with Slack as the first adapter

- Status: Proposed
- Date: 2026-09-05
- Related Issue: [#120](https://github.com/kohei321dev/saydeck/issues/120)
- Extends: [ADR 0017](0017-retire-legacy-web-before-slack-rebuild.md)
- Supersedes: None
- Approval gate: owner review後、このPull Requestをmergeする前にStatusを`Accepted`へ更新する

## Context

ADR 0017で旧Web runtimeを撤去し、Slack-first再構築の詳細を後続Decision Recordへ分離した。ownerは、SayDeckの本体を個人用APIとし、Slack Bot、将来のDiscordやapplicationをUI adapterとしてAPIから利用する方針を示した。

Slackは外部HTTP requestへ3秒以内の応答を要求し、失敗したEvents API deliveryを再送する。LLM生成を同期処理に含めるとack期限を超え、同じ入力を重複処理する可能性がある。次期runtimeでは、外部入力の認証、即時ack、非同期生成、保存、返信を分離し、owner以外の入力や周辺会話を処理しない境界が必要である。

## Decision

### 1. Product and API boundary

1. SayDeckの本体をowner専用の個人用APIとする。
2. Slackを最初のUI adapterとし、Slack固有payloadをtransport非依存のAPI commandへ変換する。
3. 初期APIはInternetから到達可能でもowner認証が必須であり、第三者向け公開API、multi-user、API key配布を行わない。
4. Discord、native application、CLIは同じAPI contractを利用できる余地を残すが、本Decisionの実装対象には含めない。
5. Web UI、provider切替UI、TTS、Anki、旧database schemaは復元しない。

### 2. Initial Google Cloud topology

初期構成は`asia-northeast1`（Tokyo）へ集約する。

```text
owner / Slack
  -> saydeck-api (Cloud Run, public ingress)
       -> application authentication
       -> Firestore transaction / idempotency record
       -> Cloud Tasks
            -> saydeck-worker (Cloud Run, IAM private)
                 -> xAI Responses API
                 -> Firestore
                 -> Slack Web API when source is Slack
```

- `saydeck-api`: `/v1/**`ではowner bearer token、`/slack/**`ではSlack署名を検証する。入力を正規化し、idempotency recordとtaskを作成して応答する。LLM生成は行わない。
- `saydeck-worker`: Cloud Tasksからだけ呼び出せるprivate serviceとし、生成、正規化、保存、adapterへの返信を行う。
- Cloud Tasks: 一対一の非同期dispatchと有限retryを担当する。
- Firestore Native mode: operation、明示入力、正規化済み候補、採否、生成metadata、期限を保存する。
- Secret Manager: owner API token、Slack Signing Secret、Slack Bot Token、xAI API keyを別secretとして保持する。
- Cloud Logging / Monitoring: contentを含まないstructured log、metric、alertを保持する。

API Gateway、Cloud SQL、Pub/Sub、Redis、VPC connector、multi-regionは初期構成へ追加しない。必要性を計測してから別Decision Recordで検討する。

### 3. Authentication and IAM

- Cloud Runの`/v1/**`はTLSと`Authorization: Bearer`によるowner tokenを必須とする。tokenはSecret Managerに置き、constant-time比較を行い、request・log・databaseへ保存しない。
- `/slack/**`はraw request bodyに対するSlack signature、timestamp、許可済み`team_id`、ownerの`user_id`を検証する。timestamp差が5分を超えるrequestは拒否する。
- `saydeck-api`と`saydeck-worker`へ別service accountを割り当てる。
- API service accountにはFirestoreへの必要最小限のwrite、Cloud Tasks enqueue、API側secretの参照だけを許可する。
- Cloud Tasks専用service accountだけにworkerの`roles/run.invoker`を許可する。
- worker service accountにはFirestoreへの必要最小限のread/writeと、xAI・Slack返信用secretの参照だけを許可する。
- user-managed service account keyは作成しない。service identityとOIDC tokenを使用する。

### 4. Slack contract

- 初期入力は`/saydeck <日本語>`と、ownerによる`app_mention`だけを受け付ける。
- `reaction_added`はSayDeckが生成した候補messageだけを対象にし、`white_check_mark`を採用、`arrows_counterclockwise`を再生成へ割り当てる。
- 修正は候補messageのthreadで、ownerが`@SayDeck 修正: <指示>`と明示した`app_mention`だけを受け付ける。一般のchannel messageを購読・取得しない。
- Event APIとslash commandは署名検証とallowlist確認後、3秒以内にackする。LLM処理はack前に実行しない。
- 1つのBot messageには1つの英語候補だけを表示する。
- Events APIの`event_id`、slash commandの`trigger_id`、APIの`Idempotency-Key`から重複排除keyを作り、raw payloadをkeyとして保存しない。

詳細は [`../specifications/slack.md`](../specifications/slack.md) と [`../specifications/personal-api.md`](../specifications/personal-api.md) を正本とする。

### 5. Persistence and deletion

- 明示された`input_ja`、任意のtone、正規化済み`sentence_en`、source参照、action、status、provider、requested/actual model、prompt version、token数、cost、処理時間を保存する。
- Slackの周辺会話、raw request body、`response_url`、Authorization header、secret、raw provider responseは保存しない。
- 未採用候補、operation、generation attemptは`expires_at`を持ち、30日後にFirestore TTLの削除対象とする。
- 採用済み候補と明示入力はownerが削除するまで保持する。owner deleteはSayDeck内のrecordをhard deleteし、Slack側のmessageやprovider側retentionを自動削除したとは扱わない。
- TTL削除は即時ではなく通常は期限後24時間以内に行われるため、期限超過後も削除完了まで残る可能性を運用上の残存riskとして扱う。

### 6. LLM provider

- 初期providerはxAI Responses API、modelは`grok-4.3`、reasoning effortは`none`とする。
- server-side tool、Web search、X search、Files、stateful conversationを使用せず、`store: false`とJSON Schema structured outputを指定する。
- provider request timeoutは20秒、Cloud Run worker timeoutは45秒とする。
- process内で再試行せず、Cloud Tasksを最大3 attempts（初回を含む）、10秒から最大60秒のbackoff、最大retry duration 10分で使用する。
- `429`、timeout、`5xx`だけをretry対象とし、認証、schema、入力errorは分類済みの終端failureとする。
- 自動fallbackを行わない。異なるprovider/modelの結果を黙って採用しない。
- xAIが返すactual model、token usage、`cost_in_usd_ticks`を保存し、raw responseは保存しない。

xAIの標準API data retentionが最大30日であることをowner向けMVPの残存riskとして受け入れる。ZDRが利用可能になった場合は、実入力を送る前に採否を再評価する。

### 7. Cost controls

- xAIはprepaid creditだけを使い、auto top-upを無効、monthly invoiced spending limitを`$0`にする。
- xAI API keyは`grok-4.3`とtext inference endpointだけへACLを限定し、上限を1 request/second、60 requests/minuteとする。
- applicationは生成をowner全体で100 attempts/dayに制限し、超過時は翌日まで新規生成を拒否する。
- Cloud Tasksは1 dispatch/second、最大1 concurrent dispatchとする。
- Cloud Runは各serviceをmin instances 0、max instances 1、request-based billingで開始する。Slack ackのcold startが継続的にSLOを破る場合だけ、API serviceのmin instances 1を再検討する。
- Google Cloudのmonthly budgetをbilling accountの通貨でJPY 1,000相当、通知thresholdを50%、80%、100%に設定する。billing accountがJPY以外なら作成前に換算値をownerが確認する。budget alertはhard capではないため、max instances、queue rate、application quotaを主な防波堤とする。

### 8. Observability

structured logに許可するfieldは、`operation_id`、adapter、action、status、分類済みerror code、attempt、latency、provider、model、token count、cost ticksとする。

次をlogへ出さない。

- `input_ja`と`sentence_en`
- Slack raw body、message本文、`response_url`
- Authorization header、cookie、secret、provider request/response
- private URLまたはownerを直接識別する値

application logは`_Default` bucketで30日保持する。Slack ack latency、queue age、generation success、retry exhaustion、provider error、daily attemptsとcostをmetric化する。

## Options Considered

### Option A: Slack固有runtimeだけを作る

- 利点: 最初の機能を最短で実装できる。
- 却下理由: Discordやapplicationを追加すると生成・保存・認証境界をadapterごとに複製する。ownerが示した個人用APIという本体定義とも一致しない。

### Option B: API Gateway、複数queue、複数workerを最初から用意する

- 利点: transport、認証、providerを強く分離できる。
- 却下理由: owner一人の初期trafficに対してcomponentと運用負荷が大きい。測定前の拡張性へ費用を払うことになる。

### Option C: public API service、private worker、managed queueを使う

- 採用理由: API-first境界、Slackの3秒ack、LLMの有限retry、将来adapterの追加余地を、最小のservice数で両立できる。

## Consequences

- API serviceはInternetから到達可能なため、routeごとの認証と入力制限がsecurity boundaryになる。
- Slackと直接APIの入力は同じapplication commandへ正規化される。
- FirestoreとCloud Tasksはat-least-onceを前提とし、exactly-onceを主張しない。
- Slack返信成功後、保存前にprocessが停止すると重複返信する小さなwindowが残る。candidate IDとdelivery stateで検出し、完全な解消が必要ならoutbox専用workerを再検討する。
- min instances 0は費用を抑える一方、cold startによりSlack ack SLOを満たさない可能性がある。
- provider retention、Slack側message retention、Firestore TTLの遅延はSayDeck単独では即時削除できない。

## Follow-up implementation Issues

1. 個人用APIのdomain contract、認証、idempotency、contract testを実装する。
2. Cloud Run、Cloud Tasks、Firestore、Secret Manager、IAM、budgetをInfrastructure as Codeで定義する。
3. Slack署名検証、allowlist、slash command、app mention、reaction、修正reply adapterを実装する。
4. xAI structured output generation workerと分類済みerror処理を実装する。
5. Firestoreのoperation・suggestion・attempt、TTL、owner deleteを実装する。
6. contentを含まないmetrics、alerts、cost tracking、runbookを実装する。

各Issueはruntimeまたはinfraの一つの独立成果だけを扱い、個別に実装前評価と人間の承認を得る。

## Revisit Conditions

- Slack以外のadapter実装を開始するとき。
- owner以外の利用者、複数workspace、第三者向けAPI keyが必要になったとき。
- 100 attempts/day、max instances 1、JPY 1,000/monthが実利用を妨げる、または費用を抑えられないとき。
- Slack ack p95が2.5秒を超え、cold startが主因と確認されたとき。
- xAIのmodel、price、retention、ZDR availabilityが変わったとき。
- Firestoreではquery、transaction、retention要件を満たせないとき。
- duplicate Slack replyを許容できなくなったとき。

## References

次の一次資料を2026-09-05に確認した。

- [Slack: Verifying requests](https://api.slack.com/docs/verifying-requests-from-slack)
- [Slack: Events API](https://api.slack.com/events-api)
- [Slack: Slash commands](https://api.slack.com/slash-commands)
- [Slack: chat.postMessage](https://api.slack.com/methods/chat.postMessage)
- [Google Cloud: Cloud Run authentication](https://cloud.google.com/run/docs/authenticating/service-to-service)
- [Google Cloud: Cloud Run locations](https://cloud.google.com/run/docs/locations)
- [Google Cloud: Cloud Tasks queue configuration](https://cloud.google.com/tasks/docs/configuring-queues)
- [Google Cloud: Firestore locations](https://cloud.google.com/firestore/docs/locations)
- [Google Cloud: Firestore TTL](https://cloud.google.com/firestore/docs/ttl)
- [Google Cloud: Secret Manager best practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Google Cloud: Logging retention](https://cloud.google.com/logging/quotas#logs_retention_periods)
- [Google Cloud: Budgets and alerts](https://cloud.google.com/billing/docs/how-to/budgets)
- [xAI: Models](https://docs.x.ai/developers/models)
- [xAI: Structured Outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs)
- [xAI: API security and retention](https://docs.x.ai/developers/faq/security)
- [xAI: Cost Tracking](https://docs.x.ai/developers/cost-tracking)
- [xAI: Billing](https://docs.x.ai/console/billing)
