// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// database.js: load aircraft metadata from indexeddb
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

import { DefaultOnlineDatabaseUrl } from './config.js';
import './filesaver.js';
import './jszip.min.js';
import { Initialize } from './script.js';

const dbName = 'Readsb';
let dbVersion = 1;
let OnlineDatabaseUrl = '';

window.IDBTransaction = window.IDBTransaction
  || window.webkitIDBTransaction
  || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

let database = null;
function Onerror(e) {
  console.error(`${e.target.error.name} : ${e.target.error.message}`);
}

/* Preload aircrafts database from online data */
function InitAircrafts() {
  $.ajax({
    url: `${OnlineDatabaseUrl}db/aircrafts.json`,
    cache: false,
    timeout: 0,
    dataType: 'json',
  })
    .done((json) => {
      const trans = database.transaction(['Aircrafts'], 'readwrite');
      const store = trans.objectStore('Aircrafts');
      $.each(json, (index, element) => {
        const entry = {
          icao24: index,
          reg: element.r,
          type: element.t,
          flags: element.f,
          desc: element.d,
        };
        const req = store.put(entry);
        // Add some error handling
      });
      console.info('Done preloading aircrafts database.');
    })
    .fail((jqxhr, textStatus, error) => {
      const err = `${textStatus}, ${error}`;
      console.error(`Request aircrafts JSON failed: ${err}`);
    });
}

/* Preload aircraft types database from online data */
function InitTypes() {
  $.ajax({
    url: `${OnlineDatabaseUrl}db/types.json`,
    cache: false,
    timeout: 0,
    dataType: 'json',
  })
    .done((json) => {
      const trans = database.transaction(['Types'], 'readwrite');
      // Preload aircrafts next
      trans.oncomplete = InitAircrafts;
      const store = trans.objectStore('Types');
      $.each(json, (index, element) => {
        const entry = {
          type: index,
          desc: element.desc,
          wtc: element.wtc,
        };
        const req = store.put(entry);
        // Add some error handling
      });
      console.info('Done preloading aircraft types database.');
    })
    .fail((jqxhr, textStatus, error) => {
      const err = `${textStatus}, ${error}`;
      console.error(`Request aircraft types JSON failed: ${err}`);
    });
}

/* Preload aircraft operator database from online data */
function InitOperators() {
  $.ajax({
    url: `${OnlineDatabaseUrl}db/operators.json`,
    cache: false,
    timeout: 0,
    dataType: 'json',
  })
    .done((json) => {
      const trans = database.transaction(['Operators'], 'readwrite');
      // Preload types next
      trans.oncomplete = InitTypes;
      const store = trans.objectStore('Operators');
      $.each(json, (index, element) => {
        const entry = {
          id: index,
          name: element.n,
          country: element.c,
          radio: element.r,
        };
        const req = store.put(entry);
        // Add some error handling
      });
      console.info('Done preloading operator database.');
    })
    .fail((jqxhr, textStatus, error) => {
      const err = `${textStatus}, ${error}`;
      console.error(`Request operators JSON failed: ${err}`);
    });
}

/* Open indexed database */
function Open() {
  let request;
  try {
    request = window.indexedDB.open(dbName, dbVersion);
    /* Causes an error when trying to open with lower version than existing */
  } catch (e) {
    alert(
      'Error opening database!\n'
        + "Your browser may not support indexed database, it's diabled, or you are browsing in private mode.\n"
        + 'Firefox:   about:config => dom.indexedDB.enabled => true\n',
    );
    throw new Error(`Failed to open database!\n${e.message}`);
  }

  const defOpen = $.Deferred();

  request.onsuccess = (e) => {
    database = e.target.result;
    console.info(`Successfully open database: ${dbName}`);
    defOpen.resolve();
  };

  request.onupgradeneeded = (e) => {
    console.info('New database version! Upgrading...');
    database = e.target.result;

    /* Create structure of new database */
    if (e.oldVersion < 1) {
      // Create settings structure
      let store = database.createObjectStore('Settings');

      // Create operators structure
      store = database.createObjectStore('Operators', { keyPath: 'id' });
      store.createIndex('id', 'id', { unique: true });

      // Create aircraft types structure
      store = database.createObjectStore('Types', { keyPath: 'type' });
      store.createIndex('type', 'type', { unique: true });

      // Create aircrafts structure
      store = database.createObjectStore('Aircrafts', { keyPath: 'icao24' });
      store.createIndex('icao24', 'icao24', { unique: true });
    }

    /* Preload database from online data once structure is created */
    e.target.transaction.oncomplete = InitOperators;
  };

  request.onerror = (e) => {
    alert(
      `Failed to open database!\n${e.target.error.name}\n${
        e.target.error.message
      }`,
    );
  };
  return defOpen.promise();
}

/* Get aircraft operator from database */
export function GetOperator(plane) {
  if (
    plane.flight === null
    || isNaN(Number.parseInt(plane.flight.substr(3, 1), 10)) === true
  ) return;
  const trans = database.transaction(['Operators'], 'readonly');
  const store = trans.objectStore('Operators');
  const index = store.index('id');
  const req = index.get(plane.flight.substring(0, 3));

  req.onsuccess = (e) => {
    const { result } = e.target;
    if (result !== undefined) {
      if ('radio' in result) {
        plane.callsign = result.radio;
      }
      if ('name' in result) {
        plane.operator = result.name;
      }
    }
  };
  req.onerror = Onerror;
}

/* Get aircraft type from database */
function GetType(plane) {
  const trans = database.transaction(['Types'], 'readonly');
  const store = trans.objectStore('Types');
  const index = store.index('type');
  const req = index.get(plane.icaotype.toUpperCase());

  req.onsuccess = (e) => {
    const { result } = e.target;
    if (result !== undefined) {
      if ('wtc' in result) {
        plane.wtc = result.wtc;
      }
      if ('desc' in result) {
        plane.species = result.desc;
      }
    }
  };
  req.onerror = Onerror;
}

/* Get aircraft meta data from database */
export function GetAircraftData(plane) {
  if (plane === undefined || plane.icao === undefined) return;

  const trans = database.transaction(['Aircrafts'], 'readonly');
  const store = trans.objectStore('Aircrafts');
  const index = store.index('icao24');
  const req = index.get(plane.icao.toUpperCase());

  req.onsuccess = (e) => {
    const { result } = e.target;
    if (result !== undefined) {
      if ('reg' in result) {
        plane.registration = result.reg;
      }

      if ('type' in result) {
        plane.icaotype = result.type;
        GetType(plane);
      }

      if ('flags' in result) {
        switch (result.flags) {
          default:
          case '00':
            plane.civilmil = false;
            plane.interesting = false;
            break;
          case '01':
            plane.civilmil = false;
            plane.interesting = true;
            break;
          case '10':
            plane.civilmil = true;
            plane.interesting = false;
            break;
          case '11':
            plane.civilmil = true;
            plane.interesting = true;
            break;
        }
      }

      if ('desc' in result) {
        plane.typeDescription = result.desc;
      }
    }
  };
  req.onerror = Onerror;
}

/* Put aircraft meta data into database */
export function PutAircraftData(entry) {
  const trans = database.transaction(['Aircrafts'], 'readwrite');
  const store = trans.objectStore('Aircrafts');
  const req = store.put(entry);
  // Add some error handling

  console.info('Aircraft metadata changed.');
}

/* Get setting key from database */
export function GetSetting(key) {
  if (key === null || key === undefined) return null;
  const d = $.Deferred();
  const trans = database.transaction(['Settings'], 'readonly');
  const store = trans.objectStore('Settings');
  const req = store.get(key);

  req.onsuccess = (e) => {
    if (e.target.result !== undefined) d.resolve(e.target.result);
    else d.reject();
  };
  req.onerror = Onerror;
  return d.promise();
}

/* Store setting key with its value into database */
export function PutSetting(key, value) {
  if (key === null || key === undefined) return;
  if (value === null || value === undefined) return;
  const trans = database.transaction(['Settings'], 'readwrite');
  const store = trans.objectStore('Settings');
  const req = store.put(value, key);
  // Add some error handling
}

/* Delete setting by key from database */
export function DeleteSetting(key) {
  if (key === null || key === undefined) return;
  const trans = database.transaction(['Settings'], 'readwrite');
  const store = trans.objectStore('Settings');
  const req = store.delete(key);
  // Add some error handling
}

/* Export entire database to local ZIP file */
export function ExportDB() {
  const promises = [];
  for (let i = 0; i < database.objectStoreNames.length; i += 1) {
    promises.push(
      $.Deferred((defer) => {
        const objectstore = database.objectStoreNames[i];
        const transaction = database.transaction([objectstore], 'readonly');
        const content = [];
        transaction.oncomplete = () => {
          console.info(`Export ${objectstore} with ${content.length} items`);
          defer.resolve({ name: objectstore, data: content });
        };
        transaction.onerror = (event) => {
          console.error(event);
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
      }).promise(),
    );
  }

  $.when.apply(null, promises).then((...args) => {
    const zip = new JSZip();
    zip.file('dbversion.json', `{"version":${dbVersion.toString()}}`);
    for (let i = 0; i < args.length; i += 1) {
      const serializedData = JSON.stringify(args[i]);
      zip.file(`${args[i].name.toLowerCase()}.json`, serializedData);
    }
    zip
      .generateAsync({
        type: 'blob',
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
        comment: 'Generated by Readsb',
      })
      .then((blob) => {
        saveAs(blob, 'Readsb_DB_Backup.zip');
        alert('Database export done.');
      });
  });
}

/* Import database from local ZIP file */
export function ImportDB(files) {
  if (
    !window.File
    || !window.FileReader
    || !window.FileList
    || !window.ArrayBuffer
  ) {
    alert('The file APIs are not fully supported in this browser.');
    return;
  }
  let json;
  let trans;
  let store;
  JSZip.loadAsync(files[0])
    .then((zip) => {
      /* Read database version */
      zip
        .file('dbversion.json')
        .async('string')
        .then((s) => {
          json = JSON.parse(s);
          if ('version' in json) {
            if (json.version < dbVersion) {
              alert('Imported database is older than existing version!');
            }
          }
        });
      return zip;
    })
    .then((zip) => {
      /* Read settings table */
      zip
        .file('settings.json')
        .async('string')
        .then((s) => {
          json = JSON.parse(s);
          trans = database.transaction(['Settings'], 'readwrite');
          store = trans.objectStore('Settings');
          $.each(json.data, (index, element) => {
            store.put(element.value, element.key);
          });
          console.info('Done importing settings.');
        });
      return zip;
    })
    .then((zip) => {
      /* Read operator table */
      zip
        .file('operators.json')
        .async('string')
        .then((s) => {
          json = JSON.parse(s);
          trans = database.transaction(['Operators'], 'readwrite');
          store = trans.objectStore('Operators');
          $.each(json.data, (index, element) => {
            store.put(element.value);
          });
          console.info('Done importing operators.');
        });
      return zip;
    })
    .then((zip) => {
      /* Read types table */
      zip
        .file('types.json')
        .async('string')
        .then((s) => {
          json = JSON.parse(s);
          trans = database.transaction(['Types'], 'readwrite');
          store = trans.objectStore('Types');
          $.each(json.data, (index, element) => {
            store.put(element.value);
          });
          console.info('Done importing types.');
        });
      return zip;
    })
    .then(
      (zip) => {
        /* Read aircrafts table */
        zip
          .file('aircrafts.json')
          .async('string')
          .then((s) => {
            json = JSON.parse(s);
            trans = database.transaction(['Aircrafts'], 'readwrite');
            store = trans.objectStore('Aircrafts');
            $.each(json.data, (index, element) => {
              store.put(element.value);
            });
            console.info('Done importing aircrafts.');
            alert('Database import done.');
          });
      },
      (e) => {
        console.error(`Import error reading: ${e.message}`);
      },
    );
}

/* Initialize indexed database */
export function DatabaseInit() {
  if (
    DefaultOnlineDatabaseUrl !== undefined
    && DefaultOnlineDatabaseUrl !== null
  ) {
    OnlineDatabaseUrl = DefaultOnlineDatabaseUrl;
  }

  $.ajax({
    url: `${OnlineDatabaseUrl}db/dbversion.json`,
    cache: false,
    timeout: 5000,
    dataType: 'json',
  })
    .done((json) => {
      if ('version' in json) {
        dbVersion = json.version;
      }
      Open().done(Initialize); /* in script.js */
    })
    .fail((jqxhr, textStatus, error) => {
      const err = `${textStatus}, ${error}`;
      console.error(`Request database version JSON failed: ${err}`);
      alert(
        'Loading database version failed.\nNo upgrade, using old database.',
      );
      Open().done(Initialize); /* in script.js */
    });
}
