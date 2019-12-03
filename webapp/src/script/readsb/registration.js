"use strict";
var READSB;
(function (READSB) {
    class Registration {
        static Init() {
            let c1;
            let c2;
            let c3;
            for (const sm of this.strideMappings) {
                const mapping = sm;
                if (!mapping.Alphabet) {
                    mapping.Alphabet = this.fullAlphabet;
                }
                if (mapping.First) {
                    c1 = mapping.Alphabet.indexOf(mapping.First.charAt(0));
                    c2 = mapping.Alphabet.indexOf(mapping.First.charAt(1));
                    c3 = mapping.Alphabet.indexOf(mapping.First.charAt(2));
                    mapping.Offset = c1 * mapping.S1 + c2 * mapping.S2 + c3;
                }
                else {
                    mapping.Offset = 0;
                }
                if (mapping.Last) {
                    c1 = mapping.Alphabet.indexOf(mapping.Last.charAt(0));
                    c2 = mapping.Alphabet.indexOf(mapping.Last.charAt(1));
                    c3 = mapping.Alphabet.indexOf(mapping.Last.charAt(2));
                    mapping.End = mapping.Start - mapping.Offset +
                        c1 * mapping.S1 +
                        c2 * mapping.S2 +
                        c3;
                }
                else {
                    mapping.End = mapping.Start - mapping.Offset +
                        (mapping.Alphabet.length - 1) * mapping.S1 +
                        (mapping.Alphabet.length - 1) * mapping.S2 +
                        (mapping.Alphabet.length - 1);
                }
            }
            for (const nm of this.numericMappings) {
                nm.End = nm.Start + nm.Count - 1;
            }
        }
        static FromHexId(hexid) {
            const id = +("0x" + hexid);
            if (isNaN(id)) {
                return null;
            }
            let reg = this.nReg(id);
            if (reg) {
                return reg;
            }
            reg = this.jaReg(id);
            if (reg) {
                return reg;
            }
            reg = this.hlReg(id);
            if (reg) {
                return reg;
            }
            reg = this.numericReg(id);
            if (reg) {
                return reg;
            }
            reg = this.strideReg(id);
            if (reg) {
                return reg;
            }
            return null;
        }
        static strideReg(hexid) {
            for (const sm of this.strideMappings) {
                if (hexid < sm.Start || hexid > sm.End) {
                    continue;
                }
                let offset = hexid - sm.Start + sm.Offset;
                const i1 = Math.floor(offset / sm.S1);
                offset = offset % sm.S1;
                const i2 = Math.floor(offset / sm.S2);
                offset = offset % sm.S2;
                const i3 = offset;
                if (i1 < 0 || i1 >= sm.Alphabet.length ||
                    i2 < 0 || i2 >= sm.Alphabet.length ||
                    i3 < 0 || i3 >= sm.Alphabet.length) {
                    continue;
                }
                return sm.Prefix + sm.Alphabet.charAt(i1) + sm.Alphabet.charAt(i2) + sm.Alphabet.charAt(i3);
            }
            return null;
        }
        static numericReg(hexid) {
            for (const nm of this.numericMappings) {
                if (hexid < nm.Start || hexid > nm.End) {
                    continue;
                }
                const reg = (hexid - nm.Start + nm.First) + "";
                return nm.Template.substring(0, nm.Template.length - reg.length) + reg;
            }
        }
        static nLetters(rem) {
            if (rem === 0) {
                return "";
            }
            --rem;
            return this.limitedAlphabet.charAt(Math.floor(rem / 25)) + this.nLetter(rem % 25);
        }
        static nLetter(rem) {
            if (rem === 0) {
                return "";
            }
            --rem;
            return this.limitedAlphabet.charAt(rem);
        }
        static nReg(hexid) {
            let offset = hexid - 0xA00001;
            if (offset < 0 || offset >= 915399) {
                return null;
            }
            const digit1 = Math.floor(offset / 101711) + 1;
            let reg = "N" + digit1;
            offset = offset % 101711;
            if (offset <= 600) {
                return reg + this.nLetters(offset);
            }
            offset -= 601;
            const digit2 = Math.floor(offset / 10111);
            reg += digit2;
            offset = offset % 10111;
            if (offset <= 600) {
                return reg + this.nLetters(offset);
            }
            offset -= 601;
            const digit3 = Math.floor(offset / 951);
            reg += digit3;
            offset = offset % 951;
            if (offset <= 600) {
                return reg + this.nLetters(offset);
            }
            offset -= 601;
            const digit4 = Math.floor(offset / 35);
            reg += digit4.toFixed(0);
            offset = offset % 35;
            if (offset <= 24) {
                return reg + this.nLetter(offset);
            }
            offset -= 25;
            return reg + offset.toFixed(0);
        }
        static hlReg(hexid) {
            if (hexid >= 0x71BA00 && hexid <= 0x71bf99) {
                return "HL" + (hexid - 0x71BA00 + 0x7200).toString(16);
            }
            if (hexid >= 0x71C000 && hexid <= 0x71C099) {
                return "HL" + (hexid - 0x71C000 + 0x8000).toString(16);
            }
            if (hexid >= 0x71C200 && hexid <= 0x71C299) {
                return "HL" + (hexid - 0x71C200 + 0x8200).toString(16);
            }
            return null;
        }
        static jaReg(hexid) {
            let offset = hexid - 0x840000;
            if (offset < 0 || offset >= 229840) {
                return null;
            }
            let reg = "JA";
            const digit1 = Math.floor(offset / 22984);
            if (digit1 < 0 || digit1 > 9) {
                return null;
            }
            reg += digit1;
            offset = offset % 22984;
            const digit2 = Math.floor(offset / 916);
            if (digit2 < 0 || digit2 > 9) {
                return null;
            }
            reg += digit2;
            offset = offset % 916;
            if (offset < 340) {
                const digit3 = Math.floor(offset / 34);
                reg += digit3;
                offset = offset % 34;
                if (offset < 10) {
                    return reg + offset;
                }
                offset -= 10;
                return reg + this.limitedAlphabet.charAt(offset);
            }
            offset -= 340;
            const letter3 = Math.floor(offset / 24);
            return reg + this.limitedAlphabet.charAt(letter3) + this.limitedAlphabet.charAt(offset % 24);
        }
    }
    Registration.limitedAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    Registration.fullAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    Registration.strideMappings = [
        { Start: 0x008011, S1: 26 * 26, S2: 26, Prefix: "ZS-" },
        { Start: 0x390000, S1: 1024, S2: 32, Prefix: "F-G" },
        { Start: 0x398000, S1: 1024, S2: 32, Prefix: "F-H" },
        { Start: 0x3C4421, S1: 1024, S2: 32, Prefix: "D-A", First: "AAA", Last: "OZZ" },
        { Start: 0x3C0001, S1: 26 * 26, S2: 26, Prefix: "D-A", First: "PAA", Last: "ZZZ" },
        { Start: 0x3C8421, S1: 1024, S2: 32, Prefix: "D-B", First: "AAA", Last: "OZZ" },
        { Start: 0x3C2001, S1: 26 * 26, S2: 26, Prefix: "D-B", First: "PAA", Last: "ZZZ" },
        { Start: 0x3CC000, S1: 26 * 26, S2: 26, Prefix: "D-C" },
        { Start: 0x3D04A8, S1: 26 * 26, S2: 26, Prefix: "D-E" },
        { Start: 0x3D4950, S1: 26 * 26, S2: 26, Prefix: "D-F" },
        { Start: 0x3D8DF8, S1: 26 * 26, S2: 26, Prefix: "D-G" },
        { Start: 0x3DD2A0, S1: 26 * 26, S2: 26, Prefix: "D-H" },
        { Start: 0x3E1748, S1: 26 * 26, S2: 26, Prefix: "D-I" },
        { Start: 0x448421, S1: 1024, S2: 32, Prefix: "OO-" },
        { Start: 0x458421, S1: 1024, S2: 32, Prefix: "OY-" },
        { Start: 0x460000, S1: 26 * 26, S2: 26, Prefix: "OH-" },
        { Start: 0x468421, S1: 1024, S2: 32, Prefix: "SX-" },
        { Start: 0x490421, S1: 1024, S2: 32, Prefix: "CS-" },
        { Start: 0x4A0421, S1: 1024, S2: 32, Prefix: "YR-" },
        { Start: 0x4B8421, S1: 1024, S2: 32, Prefix: "TC-" },
        { Start: 0x740421, S1: 1024, S2: 32, Prefix: "JY-" },
        { Start: 0x760421, S1: 1024, S2: 32, Prefix: "AP-" },
        { Start: 0x768421, S1: 1024, S2: 32, Prefix: "9V-" },
        { Start: 0x778421, S1: 1024, S2: 32, Prefix: "YK-" },
        { Start: 0x7C0000, S1: 1296, S2: 36, Prefix: "VH-" },
        { Start: 0xC00001, S1: 26 * 26, S2: 26, Prefix: "C-F" },
        { Start: 0xC044A9, S1: 26 * 26, S2: 26, Prefix: "C-G" },
        { Start: 0xE01041, S1: 4096, S2: 64, Prefix: "LV-" },
    ];
    Registration.numericMappings = [
        { Start: 0x140000, First: 0, Count: 100000, Template: "RA-00000" },
        { Start: 0x0B03E8, First: 1000, Count: 1000, Template: "CU-T0000" },
    ];
    READSB.Registration = Registration;
})(READSB || (READSB = {}));
//# sourceMappingURL=registration.js.map