# Twitter Flame Checker

Twitter(現X)での投稿前に、炎上リスクをAIで自動チェックするブラウザ拡張機能です。

## 機能

- **リアルタイム分析**: 投稿テキストの入力中にリアルタイムで炎上リスクを評価
- **AI判定**: Google Gemini APIを使用した高精度な炎上リスク分析
- **視覚的フィードバック**: 投稿入力欄の色とメッセージでリスクレベルを表示
- **3段階評価**: Safe（安全）、Caution（注意）、Dangerous（危険）で判定

## インストール

1. このリポジトリをクローンまたはダウンロード
2. Chrome拡張機能管理画面（chrome://extensions/）を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. プロジェクトフォルダを選択

## 設定

1. 拡張機能アイコンをクリック
2. 「設定」ボタンを押す
3. Google Gemini APIキーを入力
4. 「接続テスト」で動作確認
5. 「保存」をクリック

### Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. 「Get API key」をクリック
3. 新しいAPIキーを作成
4. 生成されたキーをコピーして設定に貼り付け

## 使用方法

1. TwitterまたはXのウェブサイトを開く
2. 投稿作成画面でテキストを入力


3. 自動的に炎上リスクが分析され、結果が表示されます

### リスクレベル

- **✅ Safe**: 炎上リスクが低い（緑色の枠）
- **⚠️ Caution**: 注意が必要（黄色の枠）
- **🚨 Dangerous**: 炎上リスクが高い（赤色の枠）

## ファイル構成

```
├── manifest.json      # 拡張機能の設定ファイル
├── content.js         # Twitter/X画面での監視とUI表示
├── background.js      # Gemini API連携
├── popup.html         # 拡張機能ポップアップ
├── popup.js          # ポップアップの動作
├── options.html       # 設定画面
├── options.js        # 設定画面の動作
└── icon.png          # 拡張機能アイコン
```

## 技術仕様

- **対応ブラウザ**: Chrome、Edge（Chromiumベース）
- **API**: Google Gemini 1.5 Flash
- **対応サイト**: Twitter、X（旧Twitter）
- **言語**: JavaScript

## ライセンス

MIT License