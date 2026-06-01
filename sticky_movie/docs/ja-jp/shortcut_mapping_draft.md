# sticky_movie ショートカット仕様（同期版）

対象: v1.0.1実装同期  
更新日: 2026-06-02

## 1. 目的
- キーボード入力で、画面UI（チェックボックス/ラジオボタン/プルダウン/入力欄/ボタン）を高速操作する。
- 初期読み込み時に既定ショートカットを読み込み、画面操作の一貫性を保つ。

## 2. スコープ
- 本仕様は「キー入力と機能のマッピング」に限定する。
- 対象操作:
  - コメント追加ボタン実行
  - 入力欄へのフォーカス移動
  - 種類プルダウンの展開
  - 分類/チームラジオ選択
  - ラベルチェックボックスのトグル
- 対象外:
  - 動画プレーヤー（再生/シーク）ショートカット
  - OS/ブラウザで強制予約されたキーの保証

## 3. 設定画面仕様
- 設定画面はJavaScript制御オーバーレイで表示する。
- 表示トリガー: ヘッダーの `設定` ボタン。
- 閉じる操作: `閉じる` ボタン、背景クリック、`Esc`。
- オーバーレイ表示幅: 90%（`90vw`）。

## 4. デフォルトショートカット（v1.0.1）
1. 操作
- `Ctrl+Enter`: コメント追加
- `Shift+J`: 事象にフォーカス
- `Shift+K`: 種類プルダウンを展開
- `Shift+?`: コメントにフォーカス

2. 分類
- `Alt+1`: 前半
- `Alt+2`: 後半
- `Alt+3`: その他

3. チーム
- `Alt+H`: ホーム
- `Alt+V`: ビジター

4. ラベル
- `Alt+T`: タックル
- `Alt+M`: モール
- `Alt+R`: ラック
- `Alt+P`: PK
- `Alt+F`: FK
- `Alt+S`: スクラム
- `Alt+L`: ラインアウト
- `Shift+T`: ターンオーバー

## 5. 初期マッピング定義
```json
{
  "version": 1,
  "enabled": true,
  "allowInTextInput": true,
  "preventBrowserDefault": true,
  "bindings": [
    {"combo":"Ctrl+Enter","action":"clickButton","target":"addCommentButton","value":"","description":"コメントを追加"},
    {"combo":"Shift+J","action":"focusElement","target":"commentEvent","value":"","description":"事象へフォーカス"},
    {"combo":"Shift+K","action":"expandSelect","target":"commentType","value":"","description":"種類プルダウンを展開"},
    {"combo":"Shift+?","action":"focusElement","target":"comment","value":"","description":"コメントへフォーカス"},
    {"combo":"Alt+1","action":"selectRadio","target":"commentCategory","value":"前半","description":"分類を前半にする"},
    {"combo":"Alt+2","action":"selectRadio","target":"commentCategory","value":"後半","description":"分類を後半にする"},
    {"combo":"Alt+3","action":"selectRadio","target":"commentCategory","value":"その他","description":"分類をその他にする"},
    {"combo":"Alt+H","action":"selectRadio","target":"commentTeam","value":"ホーム","description":"チームをホームにする"},
    {"combo":"Alt+V","action":"selectRadio","target":"commentTeam","value":"ビジター","description":"チームをビジターにする"},
    {"combo":"Alt+T","action":"toggleCheckbox","target":"commentLabel:タックル","value":"","description":"タックルをトグル"},
    {"combo":"Alt+M","action":"toggleCheckbox","target":"commentLabel:モール","value":"","description":"モールをトグル"},
    {"combo":"Alt+R","action":"toggleCheckbox","target":"commentLabel:ラック","value":"","description":"ラックをトグル"},
    {"combo":"Alt+P","action":"toggleCheckbox","target":"commentLabel:PK","value":"","description":"PKをトグル"},
    {"combo":"Alt+F","action":"toggleCheckbox","target":"commentLabel:FK","value":"","description":"FKをトグル"},
    {"combo":"Alt+S","action":"toggleCheckbox","target":"commentLabel:スクラム","value":"","description":"スクラムをトグル"},
    {"combo":"Alt+L","action":"toggleCheckbox","target":"commentLabel:ラインアウト","value":"","description":"ラインアウトをトグル"},
    {"combo":"Shift+T","action":"toggleCheckbox","target":"commentLabel:ターンオーバー","value":"","description":"ターンオーバーをトグル"}
  ]
}
```

## 6. アクション種別
- `clickButton`: ボタン押下を実行
- `focusElement`: 入力欄へフォーカス
- `expandSelect`: `select` を展開（候補全表示に近いサイズまで拡大）
- `selectRadio`: ラジオ値選択
- `toggleCheckbox`: チェック状態を反転
- `setCheckbox`: チェックを明示ON/OFF

## 7. 設定UI要件
- 設定オーバーレイにショートカット設定セクションを表示する。
- 表示項目:
  - ショートカット有効/無効
  - テキスト入力中許可
  - ブラウザ既定ショートカット上書き
  - 割当一覧（combo, action, target, value, description）
  - `割当を追加` ボタン
  - `設定更新` ボタン
  - `デフォルトにリセット` ボタン

## 8. ルール
- 同一 `combo` の重複は不可。
- 設定更新時は検証後に反映する。
- `preventBrowserDefault=true` の場合、ショートカット一致時に `preventDefault` / `stopPropagation` を実行する。

## 9. 受け入れ基準
- `Ctrl+Enter` でコメント追加が実行される。
- `Shift+J` で事象欄にフォーカスする。
- `Shift+K` で種類プルダウンが展開する。
- `Alt+1/2/3` で分類が切り替わる。
- `Alt+H/V` でチームが切り替わる。
- ラベル系ショートカットで対応チェックがトグルする。
- 設定画面の `設定更新` と `デフォルトにリセット` が機能する。

## 10. 補足
- `Shift+?` はキーボード配列によって入力しづらい場合があるため、運用で別キーへ再割当可能。