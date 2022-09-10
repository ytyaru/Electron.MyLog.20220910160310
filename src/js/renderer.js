window.addEventListener('DOMContentLoaded', async(event) => {
    Loading.setup()
    console.log('DOMContentLoaded!!');
    //console.log(getComputedStyle(document.querySelector('main:not([hidden])')).getPropertyValue('inline-size'));
    //const LINE_OF_PX = parseFloat(Css.Main.get('inline-size')); // １行の表示領域 なぜかこれで高速化した
    //console.log(LINE_OF_PX);
    const db = new MyLogDb()
    await window.myApi.loadDb(db.path)
    let setting = await Setting.load()
    console.log(setting)
    const maker = new SiteMaker(setting)
    if (setting?.mona?.address) { document.getElementById('address').value = setting.mona.address }
    if (setting?.github?.username) { document.getElementById('github-username').value =  setting?.github?.username }
    if (setting?.github?.email) { document.getElementById('github-email').value =  setting?.github?.email }
    if (setting?.github?.token) { document.getElementById('github-token').value = setting?.github?.token }
    if (setting?.github?.repo?.name) { document.getElementById('github-repo-name').value = setting?.github?.repo?.name }
    //document.querySelector('#versions-table').innerHTML = await VersionsToHtml.toHtml()
    document.querySelector('#versions-table').insertAdjacentHTML('afterbegin', await VersionsToHtml.toHtml())
    // https://www.electronjs.org/ja/docs/latest/api/window-open
    document.querySelector('#open-repo').addEventListener('click', async()=>{
        window.open(`https://github.com/${document.getElementById('github-username').value}/${document.getElementById('github-repo-name').value}`, `_blank`)
    })
    document.querySelector('#open-site').addEventListener('click', async()=>{
        window.open(setting.github.repo.homepage, `_blank`)
    })
    const git = new Git(setting)
    const hub = new GitHub(setting)
    document.querySelector('#post').addEventListener('click', async()=>{
        try {
            await insert()
            await push()
        } catch (e) { Toaster.toast(e.message, true) }
    })
    document.querySelector('#delete').addEventListener('click', async()=>{
        try {
            const ids = Array.from(document.querySelectorAll(`#post-list input[type=checkbox][name=delete]:checked`)).map(d=>parseInt(d.value))
            console.debug(ids)
            const isDel = await db.delete(ids)
            if (!isDel) { return false }
            document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
            //document.getElementById('post-list').insertAdjacentHTML('afterbegin', await db.toHtml())
            const uiSetting = await getUiSetting()
            console.log(uiSetting)
            await update(`つぶやき削除:${new Date().toISOString()}`, uiSetting)
            document.getElementById('content').focus()
        } catch (e) { Toaster.toast(e.message, true) }
    })
    document.querySelector('#content').addEventListener('input', async(e)=>{
        const length = db.LENGTH - e.target.value.length
        document.querySelector('#content-length').innerText = length
        const line = db.LINE - ((0 === e.target.value.length) ? 0 : document.querySelector('#content').value.split(/\r\n|\n/).length)
        document.querySelector('#content-line').innerText = line
        valid('#content-length', length, db.LENGTH)
        valid('#content-line', line, db.LINE)
        console.log(length)
        if (0 === e.target.value.length) {
            document.querySelector('#preview').innerHTML = ''
        } else {
            if (0 === document.getElementById('preview').children.length) {
                document.getElementById('preview').insertAdjacentHTML('afterbegin', TextToHtml.toBody(0, Math.floor(new Date().getTime()/1000), document.querySelector('#address').value))
            }
            document.querySelector('#preview div.mylog p').innerHTML = TextToHtml.toText(e.target.value)
            document.querySelector('#preview div.mylog time').remove()
            document.querySelector('#preview div.mylog-meta').insertAdjacentHTML('afterbegin',TextToHtml.toTime(Math.floor(new Date().getTime()/1000)))
        }
    })
    function valid(query, value, max) {
        if (value < 0) { error(query) }
        else if (value < max * 0.2) { warning(query) }
        else { clear(query) }
    }
    function warning(query) { clear(query); document.querySelector(query).classList.add('warning') }
    function error(query) { clear(query); document.querySelector(query).classList.add('error') }
    function clear(query) { document.querySelector(query).classList.remove('warning', 'error');  }
    document.querySelector('#save-setting').addEventListener('click', async()=>{
        setting = await Setting.load()
        setting.mona.address = document.getElementById('address').value
        setting.github.username = document.getElementById('github-username').value
        setting.github.email = document.getElementById('github-email').value
        setting.github.token = document.getElementById('github-token').value
        setting.github.repo.name = document.getElementById('github-repo-name').value
        //setting.github.repo.description = document.getElementById('github-repo-description').value
        //setting.github.repo.homepage = document.getElementById('github-repo-homepage').value
        //setting.github.repo.topics = document.getElementById('github-repo-topics').value
        await Setting.save(setting)
        Toaster.toast(`設定ファイルを保存した`); 
        console.log(setting)
    })
    //ocument.getElementById('line-of-chars').dispatchEvent(new Event('input'))
    //document.getElementById('line-of-chars').dispatchEvent(new Event('input', { bubbles: true, cancelable: true,}))
    setFontSize() 
    resize() 
    document.getElementById('line-of-chars').dispatchEvent(new Event('resize'))
    document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
    document.getElementById('content').focus()
    document.getElementById('content-length').textContent = db.LENGTH
    document.getElementById('content-line').innerText = db.LINE
    async function getUiSetting() {
        return await Setting.obj(
            document.querySelector('#address').value, 
            document.querySelector('#github-username').value,
            document.querySelector('#github-email').value,
            document.querySelector('#github-token').value,
            document.querySelector('#github-repo-name').value,
        )
    }
    function isSetting(setting, uiSetting) {// Object.is(setting, uiSetting)だといつも上書きされてしまうので
        console.log('isSetting')
        console.log(setting)
        console.log(uiSetting)
        const a = JSON.stringify(Object.entries(setting).sort())
        const b = JSON.stringify(Object.entries(uiSetting).sort())
        console.log(a === b)
        console.log(b)
        console.log(b)
        return a === b;
    }
    async function overwriteSetting(uiSetting) {// ファイル／画面UIの値が違う
        console.log(`overwriteSetting()`, setting, uiSetting)
        if (!isSetting(setting, uiSetting)) {
            await Setting.save(uiSetting)
            console.debug(`setting.jsonを上書きした。`, setting, uiSetting)
            Toaster.toast(`設定ファイルを保存した`)
        } else { console.log(`設定ファイルの内容が同じなので上書きせず……`, setting, uiSetting) }
    }
    async function insert() {
        const insHtml = await db.insert(document.getElementById('content').value, document.getElementById('address').value)
        const insEl = new DOMParser().parseFromString(`${insHtml}`, "text/html");
        document.getElementById('post-list').prepend(insEl.body.children[1])
        document.getElementById('post-list').prepend(insEl.body.children[0])
        document.querySelector('#content').value = ''
        document.querySelector('#content').dispatchEvent(new Event('input'))
    }
    async function push() {
        const uiSetting = await getUiSetting()
        console.log(uiSetting)
        const exists = await git.init(uiSetting)
        if (!exists) { // .gitがないなら
            console.log(`リクエスト開始`)
            console.log(setting.github.username)
            console.log(setting.github.token)
            console.log(setting.github.repo)
            const res = await hub.createRepo({
                'name': document.getElementById('github-repo-name').value,
                'description': setting.github.repo.description,
                'homepage': setting.github.repo.homepage,
            }, uiSetting)
            console.log(res)
            await maker.make(uiSetting)
            await git.push('新規作成', uiSetting)
            await git.push('なぜか初回pushではasset/ディレクトリなどがアップロードされないので２回やってみる', uiSetting) 
            await overwriteSetting(uiSetting)
        }
        else { await update(`つぶやく:${new Date().toISOString()}`, uiSetting) }
        document.getElementById('content').focus()
    }
    async function update(message, uiSetting) {
        try {
            await window.myApi.cp(
                `src/db/mylog.db`,
                `dst/${setting.github.repo.name}/db/mylog.db`,
                {'recursive':true, 'preserveTimestamps':true})
            await git.push(message, uiSetting) 
            await overwriteSetting(uiSetting)
        } catch (e) { Toaster.toast(e.message, true) }
    }
    function setFontSize() {
        const MIN = 16
        /*
        const MAIN = document.querySelector('main:not([hidden])')
        const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
        const fontSize = LINE_OF_PX / document.getElementById('line-of-chars').value
        console.log(fontSize, LINE_OF_PX, document.getElementById('line-of-chars').value);
        document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
        */
        const MAIN = document.querySelector('main:not([hidden])')
        const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
        //const LETTER_SPACING_SIZE = 0.05 * document.getElementById('line-of-chars').value
        //const fontSize = LINE_OF_PX / (document.getElementById('line-of-chars').value - LETTER_SPACING_SIZE)
        //const fontSize = LINE_OF_PX / document.getElementById('line-of-chars').value * 1.05 // letter-spacing:0.05em
        //let fontSize = (LINE_OF_PX / document.getElementById('line-of-chars').value)// letter-spacing:0.05em
        //console.log(fontSize, LINE_OF_PX, LETTER_SPACING_SIZE, document.getElementById('line-of-chars').value);
        //600px / 40字 * 1.05
        const lineOfChars = document.getElementById('line-of-chars').value
        const fontSize = LINE_OF_PX / (lineOfChars * 1.05) - 0.1 // letter-spacing:0.05em
        console.log(fontSize, LINE_OF_PX, lineOfChars);
        document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
        document.getElementById('line-of-chars-count').innerText = lineOfChars
        document.querySelector(':root').style.setProperty('--font-size-code', `${Math.max((fontSize / 2), MIN)}px`);

    }
    document.querySelector('#line-of-chars').addEventListener('input', async()=>{ setFontSize() })
    function resize() {
        setFontSize()
        //console.log(window.innerWidth)
        //if (window.innerWidth < 16 * 20) { window.innerWidth = 16 * 20; return; }
        const MIN = 16
        const MAIN = document.querySelector('main:not([hidden])')
        const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
        const max = Math.max(Math.min(Math.floor(LINE_OF_PX / MIN), 50), 20) // 20〜50字
        //const max = Math.min(Math.floor(LINE_OF_PX / MIN), 50)
        console.log('max:', max)
        const preValue = document.getElementById('line-of-chars').value
        console.log('preValue:', preValue)
        document.getElementById('line-of-chars').max = max
        const lineOfChars = document.getElementById('line-of-chars').value
        console.log('lineOfChars:', lineOfChars)
        //if (max < lineOfChars) { document.getElementById('line-of-chars').value = max }
        //if (preValue < lineOfChars) {
        //if (max < lineOfChars) {
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
    /*
    window.addEventListener("resize", function (e) { // 全画面やリサイズ時に字／行の値を再計算する
        console.debug("resize");
        const MAIN = document.querySelector('main:not([hidden])')
        //const LINE_OF_PX = parseFloat(Css.Main.get('inline-size')); // １行の表示領域 なぜかこれで高速化した
        const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
        //const fontSize = LINE_OF_PX / document.getElementById('line-of-chars').value
        const lineOfChars = document.getElementById('line-of-chars').value
        const fontSize = LINE_OF_PX / (lineOfChars * 1.05) - 0.1 // letter-spacing:0.05em
        console.log(fontSize, LINE_OF_PX, lineOfChars);
        document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
        document.getElementById('line-of-chars-count').innerText = lineOfChars
    });
    */
})


