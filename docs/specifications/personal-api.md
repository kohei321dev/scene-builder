# Personal API specification

- Status: Proposed
- Date: 2026-09-05
- Decision: [`../decisions/0018-private-api-with-slack-adapter.md`](../decisions/0018-private-api-with-slack-adapter.md)
- Implementation: Not started

SayDeck本体はowner専用の個人用APIである。Slack adapterと将来のUI adapterは、このcontractへ入力を正規化する。以下は外部から観測できる初期contractであり、runtimeはまだ存在しない。

## Authentication

- `/v1/**`はHTTPSと`Authorization: Bearer <owner token>`を必須とする。
- tokenがない、形式が違う、一致しない場合は`401 unauthorized`を返す。
- owner以外へtokenを発行しない。adapter固有credentialとowner tokenを共用しない。
- token、Authorization header、request全文をlogまたは保存dataへ残さない。

## Common headers

stateを変更するrequestは`Idempotency-Key`を必須とする。

- UTF-8で1〜128文字
- secretや入力本文を含めない
- 同じkeyと同じrequestは、最初に返したresourceまたはoperationを返す
- 同じkeyで異なるrequestは`409 idempotency_conflict`を返す

## Create suggestion

`POST /v1/suggestions`

```json
{
  "input_ja": "明日の会議を午後に変更できますか",
  "tone": "neutral"
}
```

- `input_ja`: 必須、trim後1〜1000文字。ownerが明示した本文だけを受け付ける。
- `tone`: 任意。`neutral`、`casual`、`formal`のいずれか。省略時は`neutral`。
- 1 requestから生成する候補は英語1文だけとする。

正常時は`202 Accepted`を返す。

```json
{
  "operation_id": "op_...",
  "status": "queued"
}
```

## Read operation

`GET /v1/operations/{operation_id}`

```json
{
  "operation_id": "op_...",
  "status": "queued | processing | succeeded | failed",
  "suggestion": {
    "suggestion_id": "sg_...",
    "sentence_en": "Could we move tomorrow's meeting to the afternoon?"
  },
  "error": null
}
```

- `suggestion`は`succeeded`のときだけ返す。
- `error`は分類済みcodeと安全なmessageだけを返し、provider responseを含めない。

## Act on suggestion

`POST /v1/suggestions/{suggestion_id}/actions`

```json
{
  "action": "accept | regenerate | correct",
  "correction_ja": "もう少し丁寧に"
}
```

- `correction_ja`は`correct`のときだけ必須で、trim後1〜1000文字。
- `accept`は候補を採用済みにする。
- `regenerate`と`correct`は新しいoperationを作り、元候補を上書きしない。
- 正常時は`202 Accepted`を返す。既に同じactionが完了している場合は同じ結果を返す。

## Delete suggestion

`DELETE /v1/suggestions/{suggestion_id}`

- ownerの保存record、明示入力、生成metadataをhard deleteする。
- resourceが既に存在しない場合も`204 No Content`を返す。
- Slack messageとprovider側のretentionはこの操作の対象外である。

## Error envelope

```json
{
  "error": {
    "code": "invalid_input",
    "message": "入力を確認してください",
    "operation_id": null
  }
}
```

初期codeは`unauthorized`、`invalid_input`、`not_found`、`idempotency_conflict`、`daily_limit_exceeded`、`provider_unavailable`、`internal_error`とする。

## Limits

- request body: 最大16 KiB
- `input_ja`と`correction_ja`: 各1000文字
- generation: owner全体で100 attempts/day
- provider timeout: 20秒
- provider fallback: なし

## Data exposure

- API responseは正規化済み候補と分類済みerrorだけを返す。
- provider、model、prompt version、token、costはowner向けoperation metadataとして保持するが、既定responseには含めない。
- raw Slack payload、raw provider response、secret、private URLは返さない。
