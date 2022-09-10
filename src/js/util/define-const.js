function defineConst(name, value) { // グローバル定数を定義する
    Object.defineProperty(window, name, {
        value: value,
        writable: false
    });
}
