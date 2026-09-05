# Slack adapter specification

- Status: Proposed
- Date: 2026-09-05
- Decision: [`../decisions/0018-private-api-with-slack-adapter.md`](../decisions/0018-private-api-with-slack-adapter.md)
- API: [`personal-api.md`](personal-api.md)
- Implementation: Not started

SlackはSayDeck個人用APIの最初のUI adapterである。Slack固有payloadをAPI commandへ変換するが、一般のchannel履歴や周辺会話を入力にしない。

## Request routes

| Route | Content type | Purpose |
| --- | --- | --- |
| `POST /slack/events` | `application/json` | URL verification、`app_mention`、`reaction_added` |
| `POST /slack/commands` | `application/x-www-form-urlencoded` | `/saydeck` |

すべてのrouteでraw bodyを保持したままSlack signatureを検証する。timestamp差が5分を超える、signatureが一致しない、必要fieldがないrequestは処理しない。

Events APIのURL verificationは署名とworkspaceを検証して`challenge`を返し、generation commandや保存dataを作らない。このrequestにはowner `user_id`がないため、次節のuser allowlistはevent・commandだけへ適用する。

## Authorization

1. Slack signatureとtimestampを検証する。
2. `team_id`が許可済みworkspaceと一致することを確認する。
3. eventまたはcommandの`user_id`がownerと一致することを確認する。
4. SayDeck自身のBot eventと、保存済みcandidateに紐づかないreactionを無視する。

署名不正はHTTP `401`とする。署名が正しくてもworkspaceまたはuserが対象外なら、Events APIには`200`を返して処理せず、slash commandには権限がないことをephemeral responseで返す。

## Generate

### Slash command

`/saydeck <input_ja>`を受け付ける。slash commandはthread内で実行できないため、生成された候補をchannelの新しいBot messageとして投稿する。

検証とqueue登録後、3秒以内に次のephemeral ackを返す。

```json
{
  "response_type": "ephemeral",
  "text": "SayDeckで英語候補を作成しています。"
}
```

### App mention

ownerの`app_mention`本文からBot mentionを除いた明示部分を`input_ja`とする。

- parent messageへのmention: 候補はそのmessageのthreadへ返す。
- thread内のmention: 候補は同じparent threadへ返す。
- 候補threadで`修正:`から始まるmention: correction actionとして扱う。

Events APIにはqueue登録後、3秒以内に空のHTTP `200`を返す。

## Candidate reply

- 候補は`chat.postMessage`で投稿する。
- 1つのBot messageには1つの`sentence_en`だけを表示する。
- message metadataにはsecretや入力本文を含めず、candidate IDだけを持たせる。
- app mentionからの生成は元messageの`thread_ts`を指定する。
- slash commandからの生成は新しいroot messageとして投稿する。

## Decide

SayDeckが生成した未削除candidate messageへのownerのreactionだけを処理する。

| Reaction | Action | Result |
| --- | --- | --- |
| `white_check_mark` | accept | candidateを採用済みにする |
| `arrows_counterclockwise` | regenerate | 元candidateを保持し、新しい候補を別Bot messageで返す |

同じreactionの再送は同じactionとしてdeduplicateする。他のreactionは無視する。

## Correct

ownerがcandidate messageのthreadで`@SayDeck 修正: <correction_ja>`と明示した場合だけcorrection actionを作る。threadの他messageやmentionのないreplyは取得・処理しない。修正後の候補は新しいBot messageとして同じthreadへ返す。

## Idempotency

- Events API: envelopeの`event_id`
- Slash command: `trigger_id`
- Core API: adapter種別と上記IDから作るopaqueな`Idempotency-Key`
- Reaction: `event_id`とcandidate ID

同じkeyの再送では新しいoperation、LLM request、採否recordを作らない。Cloud TasksとSlack deliveryはat-least-onceであり、candidate IDとdelivery stateで重複を検出する。

## Failure behavior

- queue登録前の一時failureは非`2xx`とし、Events APIのretry対象にする。
- providerの終端failureは分類済みの短いerrorを同じthreadまたはchannelへ返す。
- Slack APIの`429`と`5xx`はCloud Tasksの有限retry対象にする。
- secret、raw request、raw provider response、入力本文をerror logへ出さない。

## Minimal Slack permissions

- Bot token scope: `app_mentions:read`、`chat:write`、`reactions:read`、`commands`
- Event subscriptions: `app_mention`、`reaction_added`
- Slash command: `/saydeck`

一般message event、channel history、file、user profileのscopeは初期版で要求しない。
