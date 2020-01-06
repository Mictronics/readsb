// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// database.ts: Functions to access browsers indexed database holding aircraft metadata.
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

namespace READSB {
    export class Database {
        public static DatabaseVersion: number = 1;
        public static OnlineDatabaseUrl: string = ".";
        /**
         * Initialize indexed database.
         */
        public static Init() {
            if (AppSettings.OnlineDatabaseUrl !== undefined && AppSettings.OnlineDatabaseUrl !== null) {
                this.OnlineDatabaseUrl = AppSettings.OnlineDatabaseUrl;
                if (this.OnlineDatabaseUrl === "") {
                    this.OnlineDatabaseUrl = ".";
                }
            }

            fetch(`${this.OnlineDatabaseUrl}/db/dbversion.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res: Response) => {
                    if (res.status >= 200 && res.status < 300) {
                        return Promise.resolve(res);
                    } else {
                        return Promise.reject(new Error(res.statusText));
                    }
                })
                .then((res: Response) => {
                    return res.json();
                })
                .then((json) => {
                    if ("version" in json) {
                        this.DatabaseVersion = json.version;
                    }
                    this.Open().finally(AppSettings.ReadSettings);
                }).catch((error) => {
                    console.error("Request database version JSON failed: " + error);
                    alert(i18next.t("error.databaseUpgrade"));
                    this.Open().finally(AppSettings.ReadSettings);
                });
        }

        /**
         * Get operator details from given flight id.
         * @param flight Flight id of aircraft.
         * @param requestCallback Callback function to store operator on aircraft.
         */
        public static GetOperator(flight: string, requestCallback: (result: any) => void) {
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

        /**
         * Get type details from given ICAO type identifier.
         * @param type Aircraft ICAO type identifier.
         * @param requestCallback Callback function to store type data on aircraft.
         */
        public static GetType(type: string, requestCallback: (result: any) => void) {
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


        /* Get aircraft meta data from database */
        public static GetAircraftData(icao: string, requestCallback: (result: any) => void) {
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

        /* Put aircraft meta data into database */
        public static PutAircraftData(entry: any) {
            const trans = this.db.transaction(["Aircrafts"], "readwrite");
            const store = trans.objectStore("Aircrafts");
            const req = store.put(entry);
            // Add some error handling

            console.info("Aircraft metadata changed.");
        }

        /* Get setting key from database */
        public static GetSetting(key: IDBValidKey) {
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
                    } else {
                        reject();
                    }
                };
                req.onerror = this.OnError;
            });
        }

        /* Store setting key with its value into database */
        public static PutSetting(key: IDBValidKey, value: any) {
            if (key === null || key === undefined) {
                return;
            }
            if (value === null || value === undefined) {
                return;
            }
            const trans = this.db.transaction(["Settings"], "readwrite");
            const store = trans.objectStore("Settings");
            const req = store.put(value, key);
            // Add some error handling
        }

        /* Delete setting by key from database */
        public static DeleteSetting(key: IDBValidKey) {
            if (key === null || key === undefined) {
                return;
            }
            const trans = this.db.transaction(["Settings"], "readwrite");
            const store = trans.objectStore("Settings");
            const req = store.delete(key);
            // Add some error handling
        }

        /**
         * Export entire database to local ZIP file.
         */
        public static ExportDB() {
            const promises = [];
            for (const objectstore of this.db.objectStoreNames) {
                promises.push(
                    new Promise((resolve, reject) => {
                        const transaction = this.db.transaction([objectstore], "readonly");
                        const content: any = [];
                        transaction.oncomplete = () => {
                            console.info("Export " + objectstore + " with " + content.length + " items");
                            resolve({ name: objectstore, data: content });
                        };
                        transaction.onerror = (event) => {
                            console.dir(event);
                        };
                        const handleResult = (event: any) => {
                            const cursor = event.target.result;
                            if (cursor) {
                                content.push({ key: cursor.key, value: cursor.value });
                                cursor.continue();
                            }
                        };
                        const objectStore = transaction.objectStore(objectstore);
                        objectStore.openCursor().onsuccess = handleResult;
                    }),
                );
            }

            Promise.all(promises).then((objectstores: any) => {
                const zip: JSZip = new JSZip();

                zip.file("dbversion.json", "{\"version\":" + this.DatabaseVersion.toString() + "}");
                for (const store of objectstores) {
                    const serializedData = JSON.stringify(store);
                    zip.file(store.name.toLowerCase() + ".json", serializedData);
                }
                zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 }, comment: "Generated by readsb Mictronics" })
                    .then((blob: Blob) => {
                        saveAs(blob, "Readsb_DB_Backup.zip");
                        alert(i18next.t("error.databaseExportDone"));
                    });
            });
        }

        /**
         * Import database from local ZIP file.
         */
        public static ImportDB(e: Event) {
            if (!File || !FileReader || !FileList || !ArrayBuffer) {
                alert(i18next.t("error.databaseApiFailure"));
                return;
            }
            let json;
            let trans;
            let store: IDBObjectStore;
            let req: IDBRequest;
            JSZip.loadAsync((e.target as HTMLInputElement).files[0])
                .then((zip: JSZip) => {
                    /* Read database version */
                    zip.file("dbversion.json").async("text")
                        .then((s: string) => {
                            json = JSON.parse(s);
                            if ("version" in json) {
                                if (json.version < this.DatabaseVersion) {
                                    alert(i18next.t("error.databaseVersionOlder"));
                                }
                            }
                        });
                    return zip;
                })
                .then((zip: JSZip) => {
                    /* Read settings table */
                    zip.file("settings.json").async("text")
                        .then((s: string) => {
                            json = JSON.parse(s);
                            trans = this.db.transaction(["Settings"], "readwrite");
                            store = trans.objectStore("Settings");
                            for (const element of Object.values(json.data)) {
                                req = store.put((element as any).value, (element as any).key);
                            }
                            console.info("Done importing settings.");
                        });
                    return zip;
                })
                .then((zip: JSZip) => {
                    /* Read operator table */
                    zip.file("operators.json").async("text")
                        .then((s: string) => {
                            json = JSON.parse(s);
                            trans = this.db.transaction(["Operators"], "readwrite");
                            store = trans.objectStore("Operators");
                            for (const element of Object.values(json.data)) {
                                req = store.put((element as any).value);
                            }
                            console.info("Done importing operators.");
                        });
                    return zip;
                })
                .then((zip: JSZip) => {
                    /* Read types table */
                    zip.file("types.json").async("text")
                        .then((s: string) => {
                            json = JSON.parse(s);
                            trans = this.db.transaction(["Types"], "readwrite");
                            store = trans.objectStore("Types");
                            for (const element of Object.values(json.data)) {
                                req = store.put((element as any).value);
                            }
                            console.info("Done importing types.");
                        });
                    return zip;
                })
                .then((zip: JSZip) => {
                    /* Read aircrafts table */
                    zip.file("aircrafts.json").async("text")
                        .then((s: string) => {
                            json = JSON.parse(s);
                            trans = this.db.transaction(["Aircrafts"], "readwrite");
                            store = trans.objectStore("Aircrafts");
                            for (const element of Object.values(json.data)) {
                                req = store.put((element as any).value);
                            }
                            console.info("Done importing aircrafts.");
                            alert(i18next.t("error.databaseImportDone"));
                        });
                });
        }

        private static databaseName: string = "Readsb";
        private static db: IDBDatabase;
        private static idxDB: IDBFactory = window.indexedDB;

        /**
         * Log any error of database operation.
         * @param e
         */
        private static OnError(e: any) {
            console.error(e.target.error.name + " : " + e.target.error.message);
        }

        /**
         * Open indexed database.
         * Must be initilized before calling this function.
         */
        private static Open() {
            let request: IDBOpenDBRequest;

            try {
                request = this.idxDB.open(this.databaseName, this.DatabaseVersion);
                /* Causes an error when trying to open with lower version than existing */
            } catch (e) {
                alert(i18next.t("error.indexedDatabaseError"));
                throw new Error("Failed to open database!\n" + e.message);
            }

            return new Promise((resolve, reject) => {
                request.onsuccess = (e) => {
                    this.db = request.result;
                    console.info("Successfully open database: " + this.databaseName);
                    resolve();
                };

                request.onupgradeneeded = (e: any) => {
                    console.info("New database version! Upgrading...");
                    this.db = e.target.result;

                    // Create structure of new database
                    if (e.oldVersion < 1) {
                        // Create settings structure
                        let store: IDBObjectStore = this.db.createObjectStore("Settings");

                        // Create operators structure
                        store = this.db.createObjectStore("Operators", { keyPath: "id" });
                        store.createIndex("id", "id", { unique: true });

                        // Create aircraft types structure
                        store = this.db.createObjectStore("Types", { keyPath: "type" });
                        store.createIndex("type", "type", { unique: true });

                        // Create aircrafts structure
                        store = this.db.createObjectStore("Aircrafts", { keyPath: "icao24" });
                        store.createIndex("icao24", "icao24", { unique: true });
                    }

                    // Preload database from online data once structure is created
                    e.target.transaction.oncomplete = this.InitOperators.bind(this);
                };

                request.onerror = (e: any) => {
                    alert(i18next.t("error.databaseOpenFailure", { name: e.target.error.name, msg: e.target.error.message }));
                    reject();
                };
            });
        }

        /**
         * Preload aircraft operator database from online data.
         */
        private static InitOperators() {
            fetch(`${this.OnlineDatabaseUrl}/db/operators.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res: Response) => {
                    if (res.status >= 200 && res.status < 300) {
                        return Promise.resolve(res);
                    } else {
                        return Promise.reject(new Error(res.statusText));
                    }
                })
                .then((res: Response) => {
                    return res.json();
                })
                .then((json: IOperatorDatabase) => {
                    const trans = this.db.transaction(["Operators"], "readwrite");
                    // Preload types next
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

        /**
         * Preload aircraft types database from online data.
         */
        private static InitTypes() {
            fetch(`${this.OnlineDatabaseUrl}/db/types.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res: Response) => {
                    if (res.status >= 200 && res.status < 300) {
                        return Promise.resolve(res);
                    } else {
                        return Promise.reject(new Error(res.statusText));
                    }
                })
                .then((res: Response) => {
                    return res.json();
                })
                .then((json: ITypeDatabase) => {
                    const trans = this.db.transaction(["Types"], "readwrite");
                    // Preload aircrafts next
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

        /**
         * Preload aircrafts database from online data.
         */
        private static InitAircrafts() {
            fetch(`${this.OnlineDatabaseUrl}/db/aircrafts.json`, {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res: Response) => {
                    if (res.status >= 200 && res.status < 300) {
                        return Promise.resolve(res);
                    } else {
                        return Promise.reject(new Error(res.statusText));
                    }
                })
                .then((res: Response) => {
                    return res.json();
                })
                .then((json: IAircraftDatabase) => {
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
}
