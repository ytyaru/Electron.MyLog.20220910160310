class FontSize {
    static resize() {
        const MAIN = document.querySelector('main:not([hidden])');
        const WRITING_MODE = document.getElementById('writing-mode').value;
        const LINE_OF_CHARS = parseInt(document.getElementById('line-of-chars').value);
        const LETTER_SPACING = parseFloat(document.getElementById('letter-spacing').value);
        const IS_VERTICAL = ('vertical-rl' === WRITING_MODE);
        //const LINE_OF_PX = (IS_VERTICAL) ? MAIN.clientHeight : MAIN.clientWidth; // １行の表示領域 684msかかり遅い
        const LINE_OF_PX = parseFloat(Css.Main.get('inline-size')); // １行の表示領域 なぜかこれで高速化した
        const COL_COUNT= parseInt(document.getElementById('column-count').value);
        //const COL_GAP_EM = parseFloat(Css.Root.get('--column-gap-em'));
        const COL_GAP_EM = parseFloat(Css.Root.get('--column-gap'));
        //const COL_RULE_W = parseFloat(Css.Root.get('--column-rule-width-px'));
        const COL_RULE_W = parseFloat(Css.Root.get('--column-rule-width'));
    //    const fontSizePx = (LINE_OF_PX / COL_COUNT) / ((lineOfChars * (1 + letterSpacing)) + (COL_GAP_EM / 2));
    //    const fontSizePx = ((LINE_OF_PX / COL_COUNT) - (COL_RULE_W * (COL_COUNT - 1))) / ((lineOfChars * (1 + letterSpacing)) + (COL_GAP_EM / 2));
        const fontSizePx = ((LINE_OF_PX / COL_COUNT) - (COL_RULE_W * (COL_COUNT - 1))) / ((LINE_OF_CHARS * (1 + LETTER_SPACING)) + (COL_GAP_EM * (COL_COUNT - 1)));
        Css.Root.set('--font-size', `${fontSizePx}px`)
    }
}
