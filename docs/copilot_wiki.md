# Copilot参照Wiki

このページは、Copilotがこのリポジトリを素早く理解するための知識ベースです。

## 1. リポジトリの目的

- 個人サイト兼ナレッジ蓄積リポジトリ
- 主な公開コンテンツは docs 配下
- 実験用の小ツールやスクリプトも同居

## 2. 主要ディレクトリ

- `docs/`: 公開対象のMarkdown・HTML・RSS
- `sticky_movie/`: YouTubeコメント補助ツールの各バージョン
- `display_related_page/`: ブラウザ拡張（manifest v3）
- `utils_python/`: 小規模ユーティリティスクリプト
- `dict/`, `myenv/`, `無題のファイル/`: メモ系コンテンツ
- `_layouts/`, `_config.yml`: Jekyll系設定

## 3. docs配下の情報設計

数値プレフィックス付きフォルダでテーマ分類している。

- `000_rule`: ルール・基礎方針
- `100_life`: 生活・習慣・雑記
- `110_service`: サービス調査
- `111_rugby`: ラグビー関連
- `190_news`: 年次ニュース
- `210_idea`: アイデア・構想
- `211_google_extension`: 拡張機能メモ
- `300_engineer`: エンジニアリング
- `310_Microsoft`: Microsoft関連学習
- `321_AtCoder`: 競プロ学習
- `390_Certification`: 資格
- `410_bounty`: 懸賞・収集
- `700_hobby`: 趣味
- `900_util`: 実用メモ

## 4. インデックス関連ファイル

- `docs/index.html`: トップの静的ページ
- `docs/me.md`: docs配下Markdown一覧（ほぼ機械的な索引）
- `docs/sitemap.md`: 人間向けの巡回サイトマップ（本Wiki作成時に再整理）

## 5. 主要ツール/実装メモ

### 5.1 `sticky_movie/`

- `beta_v1.0` から `beta_v1.3` まで段階的に存在
- YouTube IFrame APIを利用し、再生区間コメントを保存/読込

### 5.2 `display_related_page/`

- Microsoft Learn の `ja-jp` ページ閲覧時に `en-us` をiframe表示
- `Ctrl + M` で表示切替

### 5.3 `utils_python/webbrowser_gogen.py`

- 引数を語源サイトURLに連結してブラウザ起動

## 6. 更新ルール（推奨）

- 新規記事は `docs/<カテゴリ>/` に追加
- 追加後は次を更新
  - `docs/me.md`（網羅一覧）
  - `docs/sitemap.md`（人間向け導線）
  - 本ページ `docs/copilot_wiki.md`（構造変更時）

## 7. Copilot向け運用メモ

- 内容探索の起点は `docs/copilot_wiki.md` → `docs/sitemap.md` → `docs/me.md`
- カテゴリ単位の修正は、番号付きディレクトリの責務を崩さない
- 公開ページ導線の変更時は `docs/index.html` 側のリンク確認を行う
