function defineCss() {
    const Css = function() {
        const _Element = function(element) { // 指定した要素のCSSを取得・設定する
            console.log(element)
            this._element = element;
        }
        Object.defineProperties(_Element.prototype, {
            Element: { get: function() { return this._element; } }
        });
        _Element.prototype.get = function(key, isNotComputed=false) {
            const self = this;
            console.log(self._element)
            const STYLE = (isNotComputed) ? self._element.style : getComputedStyle(self._element);
            return STYLE.getPropertyValue(key); 
        }
        _Element.prototype.set = function(key, value, q=null) {
            const self = this;
            const ELEMENT = (q) ? self._element.querySelector(q) : self._element;
            ELEMENT.style.setProperty(key, value);
        }
        this._root = new _Element(document.querySelector(':root'));
        this._body = new _Element(document.querySelector('body'));
        this._main = new _Element(document.querySelector('main:not([hidden])'));
    }
    Object.defineProperties(Css.prototype, {
        Root: { get: function() { return this._root; } },
        Body: { get: function() { return this._body; } },
        Main: { get: function() { return this._main; } },
    });
    Css.prototype.get = function(key, isNotComputed=false, q=':root') {
    //Css.prototype.set = function(key, isNotComputed=false, q=':root') {
        const ELEMEN = (q instanceof HTMLElement) ? q : document.querySelector(q);
        const STYLE = (isNotComputed) ? ELEMENT.style : getComputedStyle(ELEMENT);
        return STYLE.getPropertyValue(key); 
    }
    Css.prototype.set = function(key, value, q=':root') {
        const ELEMEN = (q instanceof HTMLElement) ? q : document.querySelector(q);
        ELEMENT.style.setProperty(key, value);
    }
    return new Css()
}
defineConst('Css', defineCss());
