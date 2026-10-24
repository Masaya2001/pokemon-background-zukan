# 背景ポケモン図鑑

[図鑑を開く](https://masaya2001.github.io/pokemon-background-zukan/)

Pokémon GOのロケーション背景・スペシャル背景を、初登場順に確認して所持状態を記録する非公式ツールです。国内・海外の背景、進化・合体後、告知済みの開催予定を収録しています。

- 背景画像の拡大表示、背景ごとの対象ポケモン一覧
- 検索、初登場年・背景の種類・所持・色違い・開催予定の絞り込み
- ブラウザ内への記録保存、JSONバックアップ・CSV出力と読込
- 旧版の22組み合わせの所持記録を自動引継ぎ

データ確認日：2026-10-24。開催予定は変更される場合があります。初登場日を特定できない項目は「日付未確認」として末尾に表示します。同じ背景の再開催はまとめ、一時的なメガシンカ演出は注記しています。各カードに出典を記録しています。資料間の差異などによる未確認項目は残る場合があります。

## データと画像の出典

- [Pokémon GO公式](https://pokemongo.com/news)
- [Dittobase](https://www.dittobase.com/pokemon-go/backgrounds)
- [Serebii](https://www.serebii.net/pokemongo/backgrounds.shtml)
- [ポケとく](https://www.poke-toku.com/backgrounds)
- [PokeMiners / pogo_assets](https://github.com/PokeMiners/pogo_assets)（ゲーム内画像）

各資料の事実データを照合し、日本語の管理用一覧に整理しています。画像・キャラクターの権利は各権利者に帰属します。画像はゲーム内背景の参照用プレビューです。一部の背景の動き・ポケモンごとの色変化・一時的な追加演出は静止画像では再現していません。

©Pokémon / Nintendo / Creatures / GAME FREAK / Scopely Explore

## 保存について

データはlocalStorage（`pogo-bg-collection-v1`）に保存します。端末・ブラウザ間の自動同期はありません。ブラウザのデータを削除する前にJSONバックアップを保存してください。

## 構成

GitHub Pagesでそのまま配信する静的サイトです。`catalog.json`のマニフェストから`data/`内の背景一覧を読み込みます。背景画像は`images/`に収録しています。サーバーへの所持データ送信はありません。
