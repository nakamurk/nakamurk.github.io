# sticky_movie 技術文書

## アーキテクチャ
- 方式: クライアントサイド単一ページアプリ
- 構成ファイル:
  - index.html: UI構造
  - styles.css: レイアウトと見た目
  - app.js: ロジックと状態管理

## レイアウト実装（beta_v1.5）
- `page-header` 下に動画領域とコメント入力領域を配置。
- 下段はコメント一覧テーブルを単独カードで全幅表示。
- レポート入力は左側 `70vw` のオーバーレイドロワーとして実装。
- レポート表示位置は `page-header` 下端に合わせて動的調整。
- レポート開閉は `reportToggleTab` / `reportCloseButton` / backdrop / `Escape` で制御。

## 主要コンポーネント
1. 状態管理（app.js）
- グローバル状態オブジェクトで以下を管理:
  - プレーヤーインスタンスと準備状態
  - 区間再生用タイマー制御
  - 行番号カウンタ
  - 分類ごとのメモコレクション

2. YouTube連携
- YouTube IFrame API（YT.Player）を利用。
- ライフサイクルイベントを処理:
  - onReady
  - onStateChange
  - onError
- seek + 指定秒後の一時停止再生をサポート。
- 動画設定入力は `section1`（details）へ集約し、入力項目は `videoId` と `sleepTime` のみ。

3. コメントテーブルエンジン
- DOM APIで動的にテーブルを生成。
- 行単位の操作:
  - 再生
  - 削除
- 種類セルは `select` 要素で編集。
- フィルター（分類/種類/事象/コメント）とリセット操作を提供。
- getComments() でシリアライズ。

4. Markdownエンジン
- 生成側:
  - レポート項目とメモデータをMarkdown文字列へ変換。
- 解析側:
  - 見出し、箇条書き、タイムラインブロックを抽出。
  - フォーム項目とコメント行を復元。

6. 箇条書きマッピング処理
- `collectReportBulletFields()`:
  - 箇条書き入力欄（8項目）の現在値を収集し、JSON出力向け `report_bullets` を構築。
- `applyReportBulletFields(fields)`:
  - 読込データを箇条書き入力欄（8項目）へ一括反映。
- Markdown読込では解析結果を `applyReportBulletFields()` に渡してUIへ反映。
- JSON読込では `report_bullets` が存在する場合に `applyReportBulletFields()` でUIへ反映。

5. 永続化レイヤー
- JSONファイルの読み込み/書き出し。
- localStorageキャッシュ:
  - バージョン付きペイロード
  - サイズ上限ガード
  - 自動保存/自動復元（F5対策）

## 正式版フォルダ
- `v1.0.0/` を正式版として追加。
- `beta_v1.5` の現行実装を引き継ぎ、README/Docsを正式版基準へ更新。

## データ構造
1. JSONエクスポート
- video_id: string
- comments: 行を持つインデックス付きオブジェクト

2. コメント行
- seek, sleep, comment, category, event, type

3. キャッシュペイロード
- version
- savedAt
- formスナップショット

## エラーハンドリング
- JSONパース検証。
- Markdown読込失敗時のフィードバック。
- 操作前のプレーヤー準備状態チェック。
- YouTube APIエラーのステータス表示。

## 技術メモ
- フレームワーク非依存のJavaScript実装。
- 静的ホスティングで直接配信可能な設計。
- サーバーサイド依存なし。
