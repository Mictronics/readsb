// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// aircraftHistory.ts: Aircraft history background worker.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
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
    let AircraftTraceCollector: MessagePort = null; // Message port to trace collector worker
    const PositionHistoryBuffer: IHistoryData[] = [];

    /**
     * Handle incoming messages from web frontend or trace collector worker.
     */
    self.onmessage = (ev: MessageEvent) => {
        const msg = ev.data;
        switch (msg.type) {
            case "Port":
                AircraftTraceCollector = msg.data;
                AircraftTraceCollector.onmessage = (evt: MessageEvent) => {
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

    /**
     * Start loading aircraft history from readsb backend.
     * @param historySize Size of aircraft history.
     */
    function StartLoadHistory(historySize: number) {
        let loaded = 0;
        if (historySize > 0) {
            for (let i = 0; i < historySize; i++) {
                fetch(`../../data/history_${i}.json`, {
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
                    .then((data: IHistoryData) => {
                        if (loaded < 0) {
                            return;
                        }
                        PositionHistoryBuffer.push(data); // don't care for order, will sort later
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

    /**
     * Forward history data to aircraft trace collector.
     */
    function DoneLoadHistory() {
        if (PositionHistoryBuffer.length > 0) {
            // Sort history by timestamp
            PositionHistoryBuffer.sort((x, y) => x.now - y.now);
            // Process history
            for (const h of PositionHistoryBuffer) {
                h.aircraft.forEach((ac: IJsonData, i: number) => {
                    if (("lat" in ac) && ("lon" in ac) && ("alt_baro" in ac)) {
                        const pos = new Array(ac.lat, ac.lon, ac.alt_baro);
                        const msg = {type: "Update", data: [ac.hex, pos, h.now] };
                        AircraftTraceCollector.postMessage(msg);
                    }
                });
            }
        }
        // Job done, self terminated.
        self.close();
    }
}
