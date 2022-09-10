# つぶやきを保存するElectron版12

　フォントサイズをJSで計算するようにした。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220910101121

## インストール＆実行

```sh
NAME='Electron.MyLog.20220910101121'
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm install
npm start
```

### 準備

1. [GitHubアカウントを作成する](https://github.com/join)
1. `repo`スコープ権限をもった[アクセストークンを作成する](https://github.com/settings/tokens)
1. [インストール＆実行](#install_run)してアプリ終了する
	1. `db/setting.json`ファイルが自動作成される
1. `db/setting.json`に以下をセットしファイル保存する
	1. `username`:任意のGitHubユーザ名
	1. `email`:任意のGitHubメールアドレス
	1. `token`:`repo`スコープ権限を持ったトークン
	1. `repo.name`:任意リポジトリ名
	1. `address`:任意モナコイン用アドレス
1. `dst/mytestrepo/.git`が存在しないことを確認する（あれば`dst`ごと削除する）
1. GitHub上に同名リモートリポジトリが存在しないことを確認する（あれば削除する）

### 実行

1. `npm start`で起動またはアプリで<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>キーを押す（リロードする）
1. `git init`コマンドが実行される
	* `repo/リポジトリ名`ディレクトリが作成され、その配下に`.git`ディレクトリが作成される
1. [createRepo][]実行後、リモートリポジトリが作成される

### GitHub Pages デプロイ

　アップロードされたファイルからサイトを作成する。

1. アップロードしたユーザのリポジトリページにアクセスする（`https://github.com/ユーザ名/リポジトリ名`）
1. 設定ページにアクセスする（`https://github.com/ユーザ名/リポジトリ名/settings`）
1. `Pages`ページにアクセスする（`https://github.com/ユーザ名/リポジトリ名/settings/pages`）
    1. `Source`のコンボボックスが`Deploy from a branch`になっていることを確認する
    1. `Branch`を`master`にし、ディレクトリを`/(root)`にし、<kbd>Save</kbd>ボタンを押す
    1. <kbd>F5</kbd>キーでリロードし、そのページに`https://ytyaru.github.io/リポジトリ名/`のリンクが表示されるまでくりかえす（***数分かかる***）
    1. `https://ytyaru.github.io/リポジトリ名/`のリンクを参照する（デプロイ完了してないと404エラー）

　すべて完了したリポジトリとそのサイトが以下。

* [作成DEMO][]
* [作成リポジトリ][]

[作成DEMO]:https://ytyaru.github.io/Electron.MyLog.20220908121018.Site/
[作成リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220908121018.Site

# フォントサイズJS計算

　スライダーUIで一行あたりの表示字数を20〜50字で設定させる。それを画面サイズで割って`font-size`とする。

　実際は余白や`letter-spacing`が関わってくるのでもっと複雑だが、大体そんな感じ。

## index.html

```html
<input id="line-of-chars" type="range" min="20" max="50" value="40" step="1"></input>
<span><span id="line-of-chars-count"></span>字／行</span>
```

## style.css

```css
:root {
    --line-of-chars:40;
    --font-size:calc(100vw / (var(--line-of-chars)));
    --font-size-code:calc(100vw / (var(--line-of-chars) * 2));
    --line-height:1.5em; /*1.5〜1.75em*/
    --letter-spacing:0.05em; /*0.05〜0.075em*/

}
body {
    font-size: var(--font-size);
    line-height: var(--line-height);
    letter-spacing: var(--letter-spacing);
}
```

## ui.css

```css
label, legend, form, fieldset, button, input, textarea, select, option, output {
    font-size: var(--font-size);
    line-height: var(--line-height);
    letter-spacing: var(--letter-spacing);
}
pre > code {
    font-size: var(--font-size-code);
}
```

## renere.js

### スライドUI

　一行あたりの表示字数を設定する。

```javascript
function setFontSize() {
    const MIN = 16
    const MAIN = document.querySelector('main:not([hidden])')
    const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
    const lineOfChars = document.getElementById('line-of-chars').value
    const fontSize = LINE_OF_PX / (lineOfChars * 1.05) - 0.1 // letter-spacing:0.05em
    document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
    document.getElementById('line-of-chars-count').innerText = lineOfChars
    document.querySelector(':root').style.setProperty('--font-size-code', `${Math.max((fontSize / 2), MIN)}px`);
}
document.querySelector('#line-of-chars').addEventListener('input', async()=>{ setFontSize() })
```

　スライダーUIを操作したときのイベント処理として、フォントサイズの計算とセットを実装した。

　計算はかなり雑。

* 字間である`letter-spacing`が`0.05em`固定であることを前提にしている
* 余白部分は勝手に表示されていてサイズ不明のため適当に`0.1em`固定値にしている
* `16px`以上であることを保証する（小さくなりすぎない）

### 窓リサイズ

　画面サイズに応じてスライダーの最大値を`20`〜`50`の間で決定する。

```javascript
function resize() {
    setFontSize()
    const MIN = 16
    const MAIN = document.querySelector('main:not([hidden])')
    const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
    const max = Math.max(Math.min(Math.floor(LINE_OF_PX / MIN), 50), 20) // 20〜50字
    console.log('max:', max)
    const preValue = document.getElementById('line-of-chars').value
    console.log('preValue:', preValue)
    document.getElementById('line-of-chars').max = max
    const lineOfChars = document.getElementById('line-of-chars').value
    console.log('lineOfChars:', lineOfChars)
    if (max < preValue) {
        document.getElementById('line-of-chars').value = max
        document.getElementById('line-of-chars-count').innerText = max
        document.getElementById('line-of-chars').dispatchEvent(new Event('input', { bubbles: true, cancelable: true,}))
    }
    document.getElementById('line-of-chars-max').innerText = max
}
let timeoutId = 0
window.addEventListener("resize", function (e) { // 画面リサイズ時に字／行の最大値を計算・設定する
    clearTimeout(timeoutId);
    timeoutId = setTimeout(()=>{ resize() }, 500); // 500ms
})
```

　もしスライダーの値が最大値より大きくなってしまったら、スライダーの値を最大値にセットする。

　リサイズイベントが大量に発行され、動作が重くなってしまった。そこでリサイズ処理が完了したとき最後に一回だけ実行するよう実装した。

* [【JavaScript】ウィンドウのリサイズ完了後に処理を実行する][]

[【JavaScript】ウィンドウのリサイズ完了後に処理を実行する]:https://into-the-program.com/javascript-run-after-resize/

