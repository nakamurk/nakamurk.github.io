# display_related_page

シンプルな JavaScript だけで作った Chrome Extension です。

URL に設定した Locale が含まれている場合、もう片方の Locale に置き換えたページを右側に `iframe` で表示し、Side by Side で比較できます。

## 機能

- 現在ページ: 左側
- 関連ページ (Locale を入れ替えた URL): 右側
- Locale A / Locale B を設定画面から変更可能
- 動作時ポップアップ通知の ON/OFF
- デバッグログ出力の ON/OFF (ブラウザ開発者ツールの Console)

例:

- 現在 URL に `en-us` が含まれる -> 右側に `ja-jp` 版を表示
- 現在 URL に `ja-jp` が含まれる -> 右側に `en-us` 版を表示

## ファイル構成

- `manifest.json`: 拡張機能定義 (Manifest V3)
- `main.js`: コンテンツスクリプト本体
- `options.html`: 設定画面 UI
- `options.js`: 設定保存/読込処理 (`chrome.storage.sync`)

## 使い方

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパー モード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」で `display_related_page` フォルダを選択

## 設定方法

1. `chrome://extensions` でこの拡張機能の「詳細」を開く
2. 「拡張機能のオプション」を開く
3. `Locale A` と `Locale B` を入力して保存
4. 必要に応じて以下を ON/OFF
	- 動作時にポップアップ通知を表示する
	- コンソールにデバッグログを出力する

デフォルト:

- Locale A: `en-us`
- Locale B: `ja-jp`

## 動作条件

- URL に Locale A または Locale B の文字列が含まれている場合のみ動作
- どちらも含まれていない URL では何もしない
- 外部ライブラリは使用していません
