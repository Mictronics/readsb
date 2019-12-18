// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// loc-i18next.ts: Use HTML5 selectors with i18next.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Typescript version based on loc-i18next by Matthieu Viry
// See https://github.com/mthh/loc-i18next
// Original relased under MIT license.
//
// The MIT License (MIT)
//
// Copyright(c) 2015 i18next, 2016 mthh
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files(the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

namespace LocI18next {
    export interface ILocI18nextOptions {
        document?: HTMLDocument;
        optionsAttr?: string;
        parseDefaultValueFromContent?: boolean;
        selectorAttr?: string;
        targetAttr?: string;
        useOptionsAttr?: boolean;
    }

    export function Init(i18n: i18next.i18n, opts?: ILocI18nextOptions) {
        i18next = i18n;
        options = defaults;
        if (opts !== undefined && opts !== null) {
            options = { ...options, ...opts };
        }
        return handle;
    }

    let i18next: i18next.i18n;
    const defaults: ILocI18nextOptions = {
        document,
        optionsAttr: "i18n-options",
        parseDefaultValueFromContent: true,
        selectorAttr: "data-i18n",
        targetAttr: "i18n-target",
        useOptionsAttr: false,
    };
    let options: ILocI18nextOptions;

    function extendDefault(o: any, val: any) {
        return options.parseDefaultValueFromContent ? { ...{}, ...o, ...{ defaultValue: val } } : o;
    }

    function parse(elem: Element, key: string, opts: any) {
        let attr = "text";
        let startIdx: number;
        let endIdx: number;

        if (key.indexOf("[") === 0) {
            const parts = key.split("]");
            key = parts[1];
            attr = parts[0].substr(1, parts[0].length - 1);
        }

        key = key.indexOf(";") === key.length - 1 ? key.substr(0, key.length - 2) : key;

        if (attr === "html") {
            elem.innerHTML = i18next.t(key, extendDefault(opts, elem.innerHTML));
        } else if (attr === "text") {
            elem.textContent = i18next.t(key, extendDefault(opts, elem.textContent));
        } else if (attr === "prepend") {
            startIdx = elem.innerHTML.indexOf("<loc-i18n>");
            endIdx = elem.innerHTML.indexOf("</loc-i18n>") + 11;
            if (startIdx > -1 && endIdx > 6) {
                elem.innerHTML = [elem.innerHTML.substring(0, startIdx), elem.innerHTML.slice(endIdx)].join("");
            }
            elem.innerHTML = ["<loc-i18n>", i18next.t(key, extendDefault(opts, elem.innerHTML)), "</loc-i18n>", elem.innerHTML].join("");
        } else if (attr === "append") {
            startIdx = elem.innerHTML.indexOf("<loc-i18n>");
            endIdx = elem.innerHTML.indexOf("</loc-i18n>") + 11;
            if (startIdx > -1 && endIdx > 6) {
                elem.innerHTML = [elem.innerHTML.substring(0, startIdx), elem.innerHTML.slice(endIdx)].join("");
            }
            elem.innerHTML = [elem.innerHTML, "<loc-i18n>", i18next.t(key, extendDefault(opts, elem.innerHTML), "</loc-i18n>")].join("");
        } else if (attr.indexOf("data-") === 0) {
            const dataAttr = attr.substr("data-".length);
            const translated = i18next.t(key, extendDefault(opts, elem.getAttribute(dataAttr)));
            // we change into the data cache
            elem.setAttribute(dataAttr, translated);
            // we change into the dom
            elem.setAttribute(attr, translated);
        } else {
            elem.setAttribute(attr, i18next.t(key, extendDefault(opts, elem.getAttribute(attr))));
        }
    }

    function relaxedJsonParse(badJSON: string) {
        return JSON.parse(badJSON.replace(/:\s*"([^"]*)"/g, (match, p1) => {
            return ': "' + p1.replace(/:/g, "@colon@") + '"';
        }).replace(/:\s*'([^']*)'/g, (match, p1) => {
            return ': "' + p1.replace(/:/g, "@colon@") + '"';
        }).replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ').replace(/@colon@/g, ":"));
    }

    function loc(elem: Element, opts: any) {
        const key = elem.getAttribute(options.selectorAttr);
        if (!key) {
            return;
        }

        let target = elem;
        const targetSelector = elem.getAttribute(options.targetAttr);

        if (targetSelector != null) { target = elem.querySelector(targetSelector) || elem; }

        if (!opts && options.useOptionsAttr === true) { opts = relaxedJsonParse(elem.getAttribute(options.optionsAttr) || "{}"); }

        opts = opts || {};

        if (key.indexOf(";") >= 0) {
            const keys = key.split(";");
            for (let ix = 0, lix = keys.length; ix < lix; ix++) {
                if (keys[ix] !== "") {
                    parse(target, keys[ix], opts);
                }
            }
        } else {
            parse(target, key, opts);
        }

        if (options.useOptionsAttr === true) {
            let clone: i18next.InitOptions = {};
            clone = { ...{ clone }, ...opts };
            delete clone.lng;
            elem.setAttribute(options.optionsAttr, JSON.stringify(clone));
        }
    }

    function handle(selector: string, opts?: any) {
        const elems = options.document.querySelectorAll(selector);
        for (const elem of elems) {
            const childs = elem.querySelectorAll("[" + options.selectorAttr + "]");
            for (const child of childs) {
                loc(child, opts);
            }
            loc(elem, opts);
        }
    }
}
