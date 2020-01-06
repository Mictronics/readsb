"use strict";
var LocI18next;
(function (LocI18next) {
    function Init(i18n, opts) {
        i18next = i18n;
        options = defaults;
        if (opts !== undefined && opts !== null) {
            options = Object.assign(Object.assign({}, options), opts);
        }
        return handle;
    }
    LocI18next.Init = Init;
    let i18next;
    const defaults = {
        document,
        optionsAttr: "i18n-options",
        parseDefaultValueFromContent: true,
        selectorAttr: "data-i18n",
        targetAttr: "i18n-target",
        useOptionsAttr: false,
    };
    let options;
    function extendDefault(o, val) {
        return options.parseDefaultValueFromContent ? Object.assign(Object.assign({}, o), { defaultValue: val }) : o;
    }
    function parse(elem, key, opts) {
        let attr = "text";
        let startIdx;
        let endIdx;
        if (key.indexOf("[") === 0) {
            const parts = key.split("]");
            key = parts[1];
            attr = parts[0].substr(1, parts[0].length - 1);
        }
        key = key.indexOf(";") === key.length - 1 ? key.substr(0, key.length - 2) : key;
        if (attr === "html") {
            elem.innerHTML = i18next.t(key, extendDefault(opts, elem.innerHTML));
        }
        else if (attr === "text") {
            elem.textContent = i18next.t(key, extendDefault(opts, elem.textContent));
        }
        else if (attr === "prepend") {
            startIdx = elem.innerHTML.indexOf("<loc-i18n>");
            endIdx = elem.innerHTML.indexOf("</loc-i18n>") + 11;
            if (startIdx > -1 && endIdx > 6) {
                elem.innerHTML = [elem.innerHTML.substring(0, startIdx), elem.innerHTML.slice(endIdx)].join("");
            }
            elem.innerHTML = ["<loc-i18n>", i18next.t(key, extendDefault(opts, elem.innerHTML)), "</loc-i18n>", elem.innerHTML].join("");
        }
        else if (attr === "append") {
            startIdx = elem.innerHTML.indexOf("<loc-i18n>");
            endIdx = elem.innerHTML.indexOf("</loc-i18n>") + 11;
            if (startIdx > -1 && endIdx > 6) {
                elem.innerHTML = [elem.innerHTML.substring(0, startIdx), elem.innerHTML.slice(endIdx)].join("");
            }
            elem.innerHTML = [elem.innerHTML, "<loc-i18n>", i18next.t(key, extendDefault(opts, elem.innerHTML), "</loc-i18n>")].join("");
        }
        else if (attr.indexOf("data-") === 0) {
            const dataAttr = attr.substr("data-".length);
            const translated = i18next.t(key, extendDefault(opts, elem.getAttribute(dataAttr)));
            elem.setAttribute(dataAttr, translated);
            elem.setAttribute(attr, translated);
        }
        else {
            elem.setAttribute(attr, i18next.t(key, extendDefault(opts, elem.getAttribute(attr))));
        }
    }
    function relaxedJsonParse(badJSON) {
        return JSON.parse(badJSON.replace(/:\s*"([^"]*)"/g, (match, p1) => {
            return ': "' + p1.replace(/:/g, "@colon@") + '"';
        }).replace(/:\s*'([^']*)'/g, (match, p1) => {
            return ': "' + p1.replace(/:/g, "@colon@") + '"';
        }).replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ').replace(/@colon@/g, ":"));
    }
    function loc(elem, opts) {
        const key = elem.getAttribute(options.selectorAttr);
        if (!key) {
            return;
        }
        let target = elem;
        const targetSelector = elem.getAttribute(options.targetAttr);
        if (targetSelector != null) {
            target = elem.querySelector(targetSelector) || elem;
        }
        if (!opts && options.useOptionsAttr === true) {
            opts = relaxedJsonParse(elem.getAttribute(options.optionsAttr) || "{}");
        }
        opts = opts || {};
        if (key.indexOf(";") >= 0) {
            const keys = key.split(";");
            for (let ix = 0, lix = keys.length; ix < lix; ix++) {
                if (keys[ix] !== "") {
                    parse(target, keys[ix], opts);
                }
            }
        }
        else {
            parse(target, key, opts);
        }
        if (options.useOptionsAttr === true) {
            let clone = {};
            clone = Object.assign({ clone }, opts);
            delete clone.lng;
            elem.setAttribute(options.optionsAttr, JSON.stringify(clone));
        }
    }
    function handle(selector, opts) {
        const elems = options.document.querySelectorAll(selector);
        for (const elem of elems) {
            const childs = elem.querySelectorAll("[" + options.selectorAttr + "]");
            for (const child of childs) {
                loc(child, opts);
            }
            loc(elem, opts);
        }
    }
})(LocI18next || (LocI18next = {}));
//# sourceMappingURL=loc-i18next.js.map