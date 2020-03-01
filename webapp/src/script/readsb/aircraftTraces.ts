// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// aircraftTraces.ts: Aircraft trace collector background worker.
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
    /**
     * Holding trace data for a single aircraft.
     */
    class AircraftTrace {
        private TracePositions: number[][];
        private PrevPosition: number[];
        private PrevPrevPosition: number[];
        private PrevAltitude: number;
        private PrevPositionTime: number;

        constructor(pos?: number[], receiverTimestamp?: number) {
            this.TracePositions = [];
            this.PrevPosition = null;
            this.PrevPrevPosition = [];
            this.PrevAltitude = 0;
            this.PrevPositionTime = 0;
            if (pos !== undefined && receiverTimestamp !== undefined) {
                this.AddPosition(pos, receiverTimestamp);
            }
        }

        /**
         * Clean trace positions.
         */
        public Destroy() {
            this.TracePositions = [];
        }

        /**
         * Add new position to trace.
         * @param pos Position as [lat, lng, alt].
         * @param receiverTimestamp Actual receiver timestamp.
         */
        public AddPosition(pos: number[], receiverTimestamp: number) {
            if (this.Equals(pos, this.PrevPosition)) {
                return;
            }

            this.TracePositions.sort((x, y) => x[4] - y[4]);

            let prevTime;
            if (this.PrevPosition === null) {
                prevTime = receiverTimestamp;
                this.PrevAltitude = pos[2];
            } else {
                prevTime = this.PrevPositionTime;
            }

            let m;
            let n;
            let a;
            // Checking actual and previous two coordinates on a line
            if (this.TracePositions.length > 1) {
                // Methode 1
                m = (this.PrevPosition[0] - this.PrevPrevPosition[0]) / (this.PrevPosition[1] - this.PrevPrevPosition[1]);
                n = this.PrevPosition[0] - (m * this.PrevPosition[1]);
                a = Math.abs((m * pos[1] + n) - pos[0]);
                // Methode 2
                /*
                const b = this.PrevPrevPosition[1] * (this.PrevPosition[0] - pos[0]) +
                    this.PrevPosition[1] * (pos[0] - this.PrevPrevPosition[0]) +
                    pos[1] * (this.PrevPrevPosition[0] - this.PrevPosition[0]);
                */
            }

            this.PrevPrevPosition = this.PrevPosition;
            this.PrevPosition = pos;
            this.PrevPositionTime = receiverTimestamp;

            const newseg: number[] = new Array(
                pos[0], // Latitude
                pos[1], // Longitude
                pos[2], // Altitude
                0, // Estimated, 1 if true
                receiverTimestamp, // Position timestamp
            );

            if (this.TracePositions.length === 0) {
                this.TracePositions.push(newseg);
                return;
            }

            const lastseg = this.TracePositions[this.TracePositions.length - 1];
            const timeDifference = receiverTimestamp - prevTime;
            const estTrack = timeDifference > 31;

            if (estTrack && !lastseg[3]) {
                // Next segment is estimated, previous was not.
                newseg[3] = 1;
                this.TracePositions.push(newseg);
                return;
            }

            if (!estTrack && lastseg[3]) {
                // Got new position, so no longer estimated.
                newseg[3] = 0;
                this.TracePositions.push(newseg);
                return;
            }

            if (a > 0.1) {
                // Skip actual position in case there is a abnormal high deviation >11km to previous one.
                return;
            } else if (a > 0.00023 || Math.abs(pos[2] - this.PrevAltitude) > 100 || receiverTimestamp - prevTime > 29) {
                // Set new position in case:
                // Position devation from line of more than ~25m or
                // Altitude change of more than 100ft or
                // last position was set more than 30 seconds ago
                newseg[3] = lastseg[3];
            } else {
                // Remove last position, will be replaced with actual one
                // But keep the one we saw the aircraft very first time.
                if (this.TracePositions.length > 1) {
                    this.TracePositions.pop();
                }
            }
            // Keep end of trace at actual aircraft position
            this.TracePositions.push(newseg);
            this.PrevAltitude = pos[2];
        }

        /**
         * Get trace data for this aircraft.
         */
        get Trace(): number[][] {
            return this.TracePositions;
        }

        get LastTimeStamp(): number {
            return this.PrevPositionTime;
        }

        /**
         * Check if two positions are equal within some error margin.
         * @param p1 Position new
         * @param p2 Position last
         * @param maxMargin Error margin
         */
        private Equals(p1: number[], p2: number[], maxMargin?: number) {
            if (!p1 || !p2) {
                return false;
            }

            const margin = Math.max(
                Math.abs(p1[0] - p2[0]),
                Math.abs(p1[1] - p2[1]));

            return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
        }
    }

    let AircraftHistoryWorker: MessagePort = null; // Message port to histroy worker
    const Worker: Worker = self as any; // See https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-390359040
    const AircraftTraceCollection = new Map<string, AircraftTrace>();

    /**
     * Handle incoming messages from web frontend or history worker.
     */
    self.onmessage = (ev: MessageEvent) => {
        const msg = ev.data;
        switch (msg.type) {
            case "Port":
                AircraftHistoryWorker = msg.data;
                AircraftHistoryWorker.onmessage = (evt: MessageEvent) => {
                    if (evt.data.type === "Update") {
                        UpdateTrace(evt.data.data[0], evt.data.data[1], evt.data.data[2]);
                    }
                };
                break;
            case "Update":
                UpdateTrace(msg.data[0], msg.data[1], msg.data[2]);
                break;
            case "Destroy":
                DestroyTrace(msg.data);
                break;
            case "Clean":
                Clean(msg.data);
                break;
            case "Get":
                GetTrace(msg.data);
                break;
            default:
                break;
        }
    };

    /**
     * Update trace for specific aircraft in collection with new position.
     * @param icao Aicraft address.
     * @param pos Aircraft position.
     * @param receiverTimestamp  Actual receiver timestamp.
     */
    function UpdateTrace(icao: string, pos: number[], receiverTimestamp: number) {
        let trace;
        if (!AircraftTraceCollection.has(icao)) {
            trace = new AircraftTrace(pos, receiverTimestamp);
            AircraftTraceCollection.set(icao, trace);
        } else {
            trace = AircraftTraceCollection.get(icao);
            trace.AddPosition(pos, receiverTimestamp);
        }
    }

    /**
     * Remove trace from collection for specific aircraft.
     * @param icao Aircraft address.
     */
    function DestroyTrace(icao: string) {
        if (AircraftTraceCollection.has(icao)) {
            const trace = AircraftTraceCollection.get(icao);
            trace.Destroy();
            AircraftTraceCollection.delete(icao);

        }
    }

    /**
     * Clean trace collection from entries older than 300s.
     * @param now Now timestamp from receiver.
     */
    function Clean(now: number) {
        for (const [icao, trace] of AircraftTraceCollection.entries()) {
            if (now - trace.LastTimeStamp > 300) {
                AircraftTraceCollection.delete(icao);
            }
        }
    }

    /**
     * Get trace data for specific aircraft.
     * @param icao Aircraft address.
     */
    function GetTrace(icao: string) {
        if (AircraftTraceCollection.has(icao)) {
            // We can't use Transferable Objects here because we loose the trace in this worker then.
            Worker.postMessage({type: "Trace", data: [icao, AircraftTraceCollection.get(icao).Trace]});
        }
    }
}
