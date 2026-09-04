# Operations

- Status: Incomplete
- Reason: 現在はrepository内runtimeがなく、外部resourceの稼働・停止・再利用状態も本Issueでは確認していない。
- Required decision: 次期runtimeのretry、監視、障害対応、rollback、費用上限、retentionと削除手順を承認する。

runtime不在中は、repository変更がVercelなどの外部automationを起動する可能性がある。ただし、これらの外部resource変更は別Issueの人間承認なしに実施しない。
