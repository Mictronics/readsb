"use strict";
var READSB;
(function (READSB) {
    let AircraftTraceCollector = null;
    const PositionHistoryBuffer = [];
    self.onmessage = (ev) => {
        const msg = ev.data;
        switch (msg.type) {
            case "Port":
                AircraftTraceCollector = msg.data;
                AircraftTraceCollector.onmessage = (evt) => {
                    console.info(`TraceCollector: ${evt.data}`);
                };
                break;
            case "HistorySize":
                StartLoadHistory(msg.data);
                break;
            default:
                break;
        }
    };
    function StartLoadHistory(historySize) {
        let loaded = 0;
        if (historySize > 0) {
            for (let i = 0; i < historySize; i++) {
                fetch(`../../data/history_${i}.json`, {
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
                    .then((data) => {
                    if (loaded < 0) {
                        return;
                    }
                    PositionHistoryBuffer.push(data);
                    loaded++;
                    if (loaded >= historySize) {
                        loaded = -1;
                        DoneLoadHistory();
                    }
                })
                    .catch((error) => {
                    if (loaded < 0) {
                        return;
                    }
                    console.error(`Failed to load history chunk: ${error.message}`);
                    loaded = -1;
                    DoneLoadHistory();
                });
            }
        }
    }
    function DoneLoadHistory() {
        if (PositionHistoryBuffer.length > 0) {
            PositionHistoryBuffer.sort((x, y) => x.now - y.now);
            for (const h of PositionHistoryBuffer) {
                h.aircraft.forEach((ac, i) => {
                    if (("lat" in ac) && ("lon" in ac) && ("alt_baro" in ac)) {
                        const pos = new Array(ac.lat, ac.lon, ac.alt_baro);
                        const msg = { type: "Update", data: [ac.hex, pos, h.now] };
                        AircraftTraceCollector.postMessage(msg);
                    }
                });
            }
        }
        self.close();
    }
})(READSB || (READSB = {}));
//# sourceMappingURL=aircraftHistory.js.map