# 安全設計と検証

## 安全ルール

- `.env` はローカル専用にし、公開しません。
- 変更前に node 名、ID、storage、bridge、template を確認します。
- 実タスクの完了結果が必要なら `--wait` を付けます。
- 公開 docs では、ローカル cluster 名ではなく `pve` や `<node>` のような汎用表現を使います。

## helper が面倒を見ること

- `.env` のファイル読み込み
- `root` から `root@pam` への補正
- `POST /access/ticket` による認証
- write request に必要な `Cookie` と `CSRFPreventionToken`
- Proxmox task status endpoint による待機処理

## 検証エビデンス

この repo は次の三層で検証しています。

1. helper CLI 形状の静的確認
2. skill / docs の構造確認
3. 実 Proxmox VE 環境での LXC フロー検証

公開資料では host 固有情報を省きつつ、コマンドの形と実行順序が再現できるようにしています。

## 再利用できる検証 helper

検証時に使った確認系の流れは、次の sample script として内包しています。

- `scripts/examples/cluster_probe.py`
- `scripts/examples/guest_snapshot.py`

どちらも非破壊系なので、起動や作成前の確認手順を安全に繰り返せます。
