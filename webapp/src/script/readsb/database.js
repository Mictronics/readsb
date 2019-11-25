"use strict";
var READSB;
(function (READSB) {
    class Database {
        static Init() {
            if (READSB.DefaultOnlineDatabaseUrl !== undefined && READSB.DefaultOnlineDatabaseUrl !== null) {
                this.OnlineDatabaseUrl = READSB.DefaultOnlineDatabaseUrl;
            }
            fetch(`${this.OnlineDatabaseUrl}/db/dbversion.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    return Promise.resolve(res);
                }
                else {
                    return Promise.reject(new Error(res.statusText));
                }
            })
                .then((res) => {
                return res.json();
            })
                .then((json) => {
                if ("version" in json) {
                    this.DatabaseVersion = json.version;
                }
                this.Open().finally(READSB.AppSettings.ReadSettings);
            }).catch((error) => {
                console.error("Request database version JSON failed: " + error);
                alert("Loading database version failed.\nNo upgrade, using old database.");
                this.Open().finally(READSB.AppSettings.ReadSettings);
            });
        }
        static GetOperator(flight, requestCallback) {
            if ((flight === null) || (isNaN(Number.parseInt(flight.substr(3, 1), 10)) === true)) {
                return;
            }
            const trans = this.db.transaction(["Operators"], "readonly");
            const store = trans.objectStore("Operators");
            const index = store.index("id");
            const req = index.get(flight.substring(0, 3));
            req.onsuccess = () => {
                requestCallback(req.result);
            };
            req.onerror = this.OnError;
        }
        static GetType(type, requestCallback) {
            if (type === undefined || type === null || type.length === 0) {
                return;
            }
            const trans = this.db.transaction(["Types"], "readonly");
            const store = trans.objectStore("Types");
            const index = store.index("type");
            const req = index.get(type.toUpperCase());
            req.onsuccess = () => {
                requestCallback(req.result);
            };
            req.onerror = this.OnError;
        }
        static GetAircraftData(icao, requestCallback) {
            if (icao === undefined || icao === null || icao.length === 0) {
                return;
            }
            const trans = this.db.transaction(["Aircrafts"], "readonly");
            const store = trans.objectStore("Aircrafts");
            const index = store.index("icao24");
            const req = index.get(icao.toUpperCase());
            req.onsuccess = () => {
                requestCallback(req.result);
            };
            req.onerror = this.OnError;
        }
        static PutAircraftData(entry) {
            const trans = this.db.transaction(["Aircrafts"], "readwrite");
            const store = trans.objectStore("Aircrafts");
            const req = store.put(entry);
            console.info("Aircraft metadata changed.");
        }
        static GetSetting(key) {
            if (key === null || key === undefined) {
                return null;
            }
            return new Promise((resolve, reject) => {
                const trans = this.db.transaction(["Settings"], "readonly");
                const store = trans.objectStore("Settings");
                const req = store.get(key);
                req.onsuccess = () => {
                    if (req.result !== undefined) {
                        resolve(req.result);
                    }
                    else {
                        reject();
                    }
                };
                req.onerror = this.OnError;
            });
        }
        static PutSetting(key, value) {
            if (key === null || key === undefined) {
                return;
            }
            if (value === null || value === undefined) {
                return;
            }
            const trans = this.db.transaction(["Settings"], "readwrite");
            const store = trans.objectStore("Settings");
            const req = store.put(value, key);
        }
        static DeleteSetting(key) {
            if (key === null || key === undefined) {
                return;
            }
            const trans = this.db.transaction(["Settings"], "readwrite");
            const store = trans.objectStore("Settings");
            const req = store.delete(key);
        }
        static ExportDB() {
            const promises = [];
            for (const objectstore of this.db.objectStoreNames) {
                promises.push(new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([objectstore], "readonly");
                    const content = [];
                    transaction.oncomplete = () => {
                        console.info("Export " + objectstore + " with " + content.length + " items");
                        resolve({ name: objectstore, data: content });
                    };
                    transaction.onerror = (event) => {
                        console.dir(event);
                    };
                    const handleResult = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            content.push({ key: cursor.key, value: cursor.value });
                            cursor.continue();
                        }
                    };
                    const objectStore = transaction.objectStore(objectstore);
                    objectStore.openCursor().onsuccess = handleResult;
                }));
            }
            Promise.all(promises).then((objectstores) => {
                const zip = new JSZip();
                zip.file("dbversion.json", "{\"version\":" + this.DatabaseVersion.toString() + "}");
                for (const store of objectstores) {
                    const serializedData = JSON.stringify(store);
                    zip.file(store.name.toLowerCase() + ".json", serializedData);
                }
                zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 }, comment: "Generated by readsb Mictronics" })
                    .then((blob) => {
                    saveAs(blob, "Readsb_DB_Backup.zip");
                    alert("Database export done.");
                });
            });
        }
        static ImportDB(e) {
            if (!File || !FileReader || !FileList || !ArrayBuffer) {
                alert("The file APIs are not fully supported in this browser.");
                return;
            }
            let json;
            let trans;
            let store;
            let req;
            JSZip.loadAsync(e.target.files[0])
                .then((zip) => {
                zip.file("dbversion.json").async("text")
                    .then((s) => {
                    json = JSON.parse(s);
                    if ("version" in json) {
                        if (json.version < this.DatabaseVersion) {
                            alert("Imported database is older than existing version!");
                        }
                    }
                });
                return zip;
            })
                .then((zip) => {
                zip.file("settings.json").async("text")
                    .then((s) => {
                    json = JSON.parse(s);
                    trans = this.db.transaction(["Settings"], "readwrite");
                    store = trans.objectStore("Settings");
                    for (const element of Object.values(json.data)) {
                        req = store.put(element.value, element.key);
                    }
                    console.info("Done importing settings.");
                });
                return zip;
            })
                .then((zip) => {
                zip.file("operators.json").async("text")
                    .then((s) => {
                    json = JSON.parse(s);
                    trans = this.db.transaction(["Operators"], "readwrite");
                    store = trans.objectStore("Operators");
                    for (const element of Object.values(json.data)) {
                        req = store.put(element.value);
                    }
                    console.info("Done importing operators.");
                });
                return zip;
            })
                .then((zip) => {
                zip.file("types.json").async("text")
                    .then((s) => {
                    json = JSON.parse(s);
                    trans = this.db.transaction(["Types"], "readwrite");
                    store = trans.objectStore("Types");
                    for (const element of Object.values(json.data)) {
                        req = store.put(element.value);
                    }
                    console.info("Done importing types.");
                });
                return zip;
            })
                .then((zip) => {
                zip.file("aircrafts.json").async("text")
                    .then((s) => {
                    json = JSON.parse(s);
                    trans = this.db.transaction(["Aircrafts"], "readwrite");
                    store = trans.objectStore("Aircrafts");
                    for (const element of Object.values(json.data)) {
                        req = store.put(element.value);
                    }
                    console.info("Done importing aircrafts.");
                    alert("Database import done.");
                });
            });
        }
        static OnError(e) {
            console.error(e.target.error.name + " : " + e.target.error.message);
        }
        static Open() {
            let request;
            try {
                request = this.idxDB.open(this.databaseName, this.DatabaseVersion);
            }
            catch (e) {
                alert("Error opening database!\n"
                    + "Your browser may not support indexed database, it's diabled, or you are browsing in private mode.\n"
                    + "Firefox:   about:config => dom.indexedDB.enabled => true\n");
                throw new Error("Failed to open database!\n" + e.message);
            }
            return new Promise((resolve, reject) => {
                request.onsuccess = (e) => {
                    this.db = request.result;
                    console.info("Successfully open database: " + this.databaseName);
                    resolve();
                };
                request.onupgradeneeded = (e) => {
                    console.info("New database version! Upgrading...");
                    this.db = e.target.result;
                    if (e.oldVersion < 1) {
                        let store = this.db.createObjectStore("Settings");
                        store = this.db.createObjectStore("Operators", { keyPath: "id" });
                        store.createIndex("id", "id", { unique: true });
                        store = this.db.createObjectStore("Types", { keyPath: "type" });
                        store.createIndex("type", "type", { unique: true });
                        store = this.db.createObjectStore("Aircrafts", { keyPath: "icao24" });
                        store.createIndex("icao24", "icao24", { unique: true });
                    }
                    e.target.transaction.oncomplete = this.InitOperators.bind(this);
                };
                request.onerror = (e) => {
                    alert("Failed to open database!\n" + e.target.error.name + "\n" + e.target.error.message);
                    reject();
                };
            });
        }
        static InitOperators() {
            fetch(`${this.OnlineDatabaseUrl}/db/operators.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    return Promise.resolve(res);
                }
                else {
                    return Promise.reject(new Error(res.statusText));
                }
            })
                .then((res) => {
                return res.json();
            })
                .then((json) => {
                const trans = this.db.transaction(["Operators"], "readwrite");
                trans.oncomplete = this.InitTypes.bind(this);
                const store = trans.objectStore("Operators");
                for (const [key, value] of Object.entries(json)) {
                    const entry = {
                        country: value.c,
                        id: key,
                        name: value.n,
                        radio: value.r,
                    };
                    const req = store.put(entry);
                }
                console.info("Done preloading operator database.");
            })
                .catch((error) => {
                console.error("Error initializing operators: " + error);
            });
        }
        static InitTypes() {
            fetch(`${this.OnlineDatabaseUrl}/db/types.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    return Promise.resolve(res);
                }
                else {
                    return Promise.reject(new Error(res.statusText));
                }
            })
                .then((res) => {
                return res.json();
            })
                .then((json) => {
                const trans = this.db.transaction(["Types"], "readwrite");
                trans.oncomplete = this.InitAircrafts.bind(this);
                const store = trans.objectStore("Types");
                for (const [key, value] of Object.entries(json)) {
                    const entry = {
                        desc: value.desc,
                        type: key,
                        wtc: value.wtc,
                    };
                    const req = store.put(entry);
                }
                console.info("Done preloading types database.");
            })
                .catch((error) => {
                console.error("Error initializing operators: " + error);
            });
        }
        static InitAircrafts() {
            fetch(`${this.OnlineDatabaseUrl}/db/aircrafts.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    return Promise.resolve(res);
                }
                else {
                    return Promise.reject(new Error(res.statusText));
                }
            })
                .then((res) => {
                return res.json();
            })
                .then((json) => {
                const trans = this.db.transaction(["Aircrafts"], "readwrite");
                const store = trans.objectStore("Aircrafts");
                for (const [key, value] of Object.entries(json)) {
                    const entry = {
                        desc: value.d,
                        flags: value.f,
                        icao24: key,
                        reg: value.r,
                        type: value.t,
                    };
                    const req = store.put(entry);
                }
                console.info("Done preloading aircraft database.");
            })
                .catch((error) => {
                console.error("Error initializing operators: " + error);
            });
        }
    }
    Database.DatabaseVersion = 1;
    Database.OnlineDatabaseUrl = "";
    Database.databaseName = "Readsb";
    Database.idxDB = window.indexedDB;
    READSB.Database = Database;
})(READSB || (READSB = {}));
//# sourceMappingURL=database.js.map