// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// database.js: load aircraft metadata from indexeddb
//
// Copyright (c) 2017 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you may copy, redistribute and/or modify it
// under the terms of the GNU General Public License as published by the
// Free Software Foundation, either version 2 of the License, or (at your
// option) any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

var dbName = "Dump1090";
var dbVersion = 1;
var Dump1090DB = {};
var OnlineDatabaseUrl = "";

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

Dump1090DB.indexedDB = {};
Dump1090DB.indexedDB.db = null;
Dump1090DB.indexedDB.onerror = function (e) {
    console.log(e.target.error.name + " : " + e.target.error.message);
};

/* Open indexed database */
Dump1090DB.indexedDB.open = function () {
    try {
        var request = indexedDB.open(dbName, dbVersion);
        /* Causes an error when trying to open with lower version than existing */
    }
    catch (e) {
        alert("Error opening database!\n"
            + "Your browser may not support indexed database, it's diabled, or you are browsing in private mode.\n"
            + "Firefox:   about:config => dom.indexedDB.enabled => true\n");
        throw new Error("Failed to open database!\n" + e.message);
    };

    var defOpen = $.Deferred();
    
    request.onsuccess = function (e) {
        Dump1090DB.indexedDB.db = e.target.result;
        console.log("Successfully open database: " + dbName);
        defOpen.resolve();
    };

    request.onupgradeneeded = function (e) {
        console.log("New database version! Upgrading...");
        Dump1090DB.indexedDB.db = e.target.result;
        var db = Dump1090DB.indexedDB.db;
        
        /* Create structure of new database */
        if (e.oldVersion < 1) {
            // Create settings structure
            var store = db.createObjectStore("Settings");

            // Create operators structure
            store = db.createObjectStore("Operators", {keyPath: "id"});
            store.createIndex("id", "id", { unique: true });

            // Create aircraft types structure
            store = db.createObjectStore("Types", {keyPath: "type"});
            store.createIndex("type", "type", { unique: true });

            // Create aircrafts structure
            store = db.createObjectStore("Aircrafts", {keyPath: "icao24"});
            store.createIndex("icao24", "icao24", { unique: true });
        }
        
        /* Preload database from online data once structure is created */
        e.target.transaction.oncomplete = Dump1090DB.indexedDB.initOperators;
    };

    request.onerror = function (e) {
        alert("Failed to open database!\n" + e.target.error.name + "\n" + e.target.error.message);
    };
    return defOpen.promise();
};

/* Preload aircraft operator database from online data */
Dump1090DB.indexedDB.initOperators = function () {
    $.ajax({ url: OnlineDatabaseUrl + 'db/operators.json',
            cache: false,
            timeout: 0,
            dataType : 'json' })
    .done(function (json) {
        var db = Dump1090DB.indexedDB.db;
        var trans = db.transaction(["Operators"], "readwrite");
        // Preload types next
        trans.oncomplete = Dump1090DB.indexedDB.initTypes;
        var store = trans.objectStore("Operators");
        $.each(json, function(index, element) {
            var entry = {
                "id": index,
                "name": element.n,
                "country": element.c,
                "radio": element.r
            };
            var req = store.put(entry);
            // Add some error handling
        });
        console.log("Done preloading operator database.");
    })
    .fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request operators JSON failed: " + err);
    });
};

/* Preload aircraft types database from online data */
Dump1090DB.indexedDB.initTypes = function () {
        $.ajax({ url: OnlineDatabaseUrl + 'db/types.json',
                cache: false,
                timeout: 0,
                dataType : 'json' })
        .done(function (json) {
            var db = Dump1090DB.indexedDB.db;
            var trans = db.transaction(["Types"], "readwrite");
            // Preload aircrafts next
            trans.oncomplete = Dump1090DB.indexedDB.initAircrafts;
            var store = trans.objectStore("Types");
            $.each(json, function(index, element) {
                var entry = {
                    "type": index,
                    "desc": element.desc,
                    "wtc": element.wtc
                };
                var req = store.put(entry);
                // Add some error handling
            });
            console.log("Done preloading aircraft types database.");
        })
        .fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request aircraft types JSON failed: " + err);
        });
};

/* Preload aircrafts database from online data */
Dump1090DB.indexedDB.initAircrafts = function () {
        $.ajax({ url: OnlineDatabaseUrl + 'db/aircrafts.json',
                cache: false,
                timeout: 0,
                dataType : 'json' })
        .done(function (json) {
            var db = Dump1090DB.indexedDB.db;
            var trans = db.transaction(["Aircrafts"], "readwrite");
            var store = trans.objectStore("Aircrafts");
            $.each(json, function(index, element) {
                var entry = {
                    "icao24": index,
                    "reg": element.r,
                    "type": element.t,
                    "flags": element.f,
                    "desc": element.d
                };
                var req = store.put(entry);
                // Add some error handling
            });
            console.log("Done preloading aircrafts database.");
        })
        .fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request aircrafts JSON failed: " + err);
        });
};

/* Get aircraft operator from database */
Dump1090DB.indexedDB.getOperator = function (plane) {
    if((plane.flight === null) || (isNaN(plane.flight.substr(3,1)) === true)) return;
    var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Operators"], "readonly");
    var store = trans.objectStore("Operators");
    var index = store.index("id");
    var req = index.get(plane.flight.substring(0, 3));

    req.onsuccess = function (e) {
        var result = e.target.result;
        if (result !== undefined) {
            if ("radio" in result) {
                plane.callsign = result.radio;
            }
            if ("name" in result) {
                plane.operator = result.name;
            }
        }
    };
    req.onerror = Dump1090DB.indexedDB.onerror;
};

/* Get aircraft type from database */
Dump1090DB.indexedDB.getType = function (plane) {
    var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Types"], "readonly");
    var store = trans.objectStore("Types");
    var index = store.index("type");
    var req = index.get(plane.icaotype.toUpperCase());

    req.onsuccess = function (e) {
        var result = e.target.result;
        if (result !== undefined) {
            if ("wtc" in result) {
                plane.wtc = result.wtc;
            }
            if ("desc" in result) {
                plane.species = result.desc;
            }
        }
    };
    req.onerror = Dump1090DB.indexedDB.onerror;
};

/* Get aircraft meta data from database */
Dump1090DB.indexedDB.getAircraftData = function (plane) {
    if(plane === undefined || plane.icao === undefined) return;
    
    var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Aircrafts"], "readonly");
    var store = trans.objectStore("Aircrafts");
    var index = store.index("icao24");
    var req = index.get(plane.icao.toUpperCase());
    
    req.onsuccess = function (e) {
        var result = e.target.result;
        if (result !== undefined) {
            if ("reg" in result) {
                plane.registration = '# ' + result.reg;
            }
            
            if ("type" in result) {
                plane.icaotype = result.type;
                Dump1090DB.indexedDB.getType(plane);
            }
 
            if ("flags" in result) {
                switch (result.flags) {
                    default:
                    case "00":
                        plane.civilmil = false;
                        plane.interesting = false;
                        break;
                    case "01":
                        plane.civilmil = false;
                        plane.interesting = true;
                        break;
                    case "10":
                        plane.civilmil = true;
                        plane.interesting = false;
                        break;
                    case "11":
                        plane.civilmil = true;
                        plane.interesting = true;
                        break;
                }
            }

            if ("desc" in result) {
                plane.typeDescription = result.desc;
            }
        }
    };
    req.onerror = Dump1090DB.indexedDB.onerror;  
};

/* Put aircraft meta data into database */
Dump1090DB.indexedDB.putAircraftData = function (entry) {
var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Aircrafts"], "readwrite");
    var store = trans.objectStore("Aircrafts");
    var req = store.put(entry);
    // Add some error handling

    console.log("Aircraft metadata changed.");
}

/* Get setting key from database */
Dump1090DB.indexedDB.getSetting = function (key) {
    if(key === null || key === undefined) return null;
    var d = $.Deferred();
    var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Settings"], "readonly");
    var store = trans.objectStore("Settings");
    var req = store.get(key);

    req.onsuccess = function(e){
        if(e.target.result !== undefined)
            d.resolve(e.target.result);
        else
            d.reject();
    };
    req.onerror = Dump1090DB.indexedDB.onerror;
    return d.promise();
};

/* Store setting key with its value into database */
Dump1090DB.indexedDB.putSetting = function (key, value) {
    if(key === null || key === undefined) return;
    if(value === null || value === undefined) return;
    var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Settings"], "readwrite");
    var store = trans.objectStore("Settings");
    var req = store.put(value, key);
    // Add some error handling
};

/* Delete setting by key from database */
Dump1090DB.indexedDB.deleteSetting = function (key) {
    if(key === null || key === undefined) return;
    var db = Dump1090DB.indexedDB.db;
    var trans = db.transaction(["Settings"], "readwrite");
    var store = trans.objectStore("Settings");
    var req = store.delete(key);
    // Add some error handling
};

/* Export entire database to local ZIP file */
Dump1090DB.indexedDB.exportDB = function() {
    var db = Dump1090DB.indexedDB.db;
    var promises = [];
    for (var i = 0; i < db.objectStoreNames.length; i++) {
        promises.push(
            $.Deferred(function (defer) {
                var objectstore = db.objectStoreNames[i];
                var transaction = db.transaction([objectstore], "readonly");
                var content = [];
                transaction.oncomplete = function (event) {
                    console.log("Export " + objectstore + " with " + content.length + " items");
                    defer.resolve({name: objectstore, data: content});
                };
                transaction.onerror = function (event) {
                    console.dir(event);
                };
                var handleResult = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        content.push({key: cursor.key, value: cursor.value});
                        cursor.continue();
                    }
                };
                var objectStore = transaction.objectStore(objectstore);
                objectStore.openCursor().onsuccess = handleResult;
            }).promise()
        );
    }
    
    $.when.apply(null, promises).then(function (result) {
        var zip = new JSZip();        
        zip.file("dbversion.json", "{\"version\":" + dbVersion.toString() + "}");
        for(var i = 0; i < arguments.length; i++){
            var serializedData = JSON.stringify(arguments[i]);
            zip.file(arguments[i].name.toLowerCase()+".json", serializedData);
        }
        zip.generateAsync({type:"blob",compressionOptions : {level:9}, comment:"Generated by Dump1090 Mictronics"})
        .then(function(blob) {
            saveAs(blob, "Dump1090_DB_Backup.zip");
            alert("Database export done.");
        });
    }); 
};

/* Import database from local ZIP file */
Dump1090DB.indexedDB.importDB = function(files) {
    if (!window.File || !window.FileReader || !window.FileList || !window.ArrayBuffer) {
        alert("The file APIs are not fully supported in this browser.");
        return;
    }
    var json, trans, store, req;
    var db = Dump1090DB.indexedDB.db;
    JSZip.loadAsync(files[0])
    .then(function(zip) {
        /* Read database version */
        zip.file("dbversion.json").async("string")
        .then(function(s){
            json = JSON.parse(s);
            if("version" in json) {
                if(json.version < dbVersion) {
                    alert("Imported database is older than existing version!");
                }
            }
        });
        return zip;
    })
    .then(function(zip){
    /* Read settings table */
    zip.file("settings.json").async("string")
        .then(function(s){
            json = JSON.parse(s);            
            trans = db.transaction(["Settings"], "readwrite");
            store = trans.objectStore("Settings");
            $.each(json.data, function(index, element) {
                req = store.put(element.value, element.key);
            });
            console.log("Done importing settings.");
        });
        return zip;
    })
    .then(function(zip){
        /* Read operator table */
        zip.file("operators.json").async("string")
        .then(function(s){
            json = JSON.parse(s);
            trans = db.transaction(["Operators"], "readwrite");
            store = trans.objectStore("Operators");
            $.each(json.data, function(index, element) {
                req = store.put(element.value);
            });
            console.log("Done importing operators.");
        });                 
        return zip;
    })
    .then(function(zip){
        /* Read types table */
        zip.file("types.json").async("string")
        .then(function(s){
            json = JSON.parse(s);
            trans = db.transaction(["Types"], "readwrite");
            store = trans.objectStore("Types");
            $.each(json.data, function(index, element) {
                req = store.put(element.value);
            });
            console.log("Done importing types.");
        });         
        return zip;
    })
    .then(function(zip){
        /* Read aircrafts table */
        zip.file("aircrafts.json").async("string")
        .then(function(s){
            json = JSON.parse(s);            
            trans = db.transaction(["Aircrafts"], "readwrite");
            store = trans.objectStore("Aircrafts");
            $.each(json.data, function(index, element) {
                req = store.put(element.value);
            });
            console.log("Done importing aircrafts.");
            alert("Database import done.")
        });                
    }), function (e) {
        console.log("Import error reading: " + e.message);
    };
};

/* Initialize indexed database */
function DatabaseInit() {
    if(DefaultOnlineDatabaseUrl !== undefined && DefaultOnlineDatabaseUrl !== null){
        OnlineDatabaseUrl = DefaultOnlineDatabaseUrl;
    }
    
    $.ajax({ url: OnlineDatabaseUrl + 'db/dbversion.json',
        cache: false,
        timeout: 5000,
        dataType : 'json' })
        .done(function (json) {
            if("version" in json) {
                dbVersion = json.version;
            }
            Dump1090DB.indexedDB.open()
            .done(initialize); /* in script.js */            
        })
        .fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request database version JSON failed: " + err);
            alert("Loading database version failed.\nNo upgrade, using old database.")
            Dump1090DB.indexedDB.open()
            .done(initialize); /* in script.js */            
        });
}