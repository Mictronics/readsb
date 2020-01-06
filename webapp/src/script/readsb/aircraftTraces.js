"use strict";
var READSB;
(function (READSB) {
    class AircraftTrace {
        constructor(pos, receiverTimestamp) {
            this.TracePositions = [];
            this.PrevPosition = null;
            this.PrevPrevPosition = [];
            this.PrevAltitude = 0;
            this.PrevPositionTime = 0;
            if (pos !== undefined && receiverTimestamp !== undefined) {
                this.AddPosition(pos, receiverTimestamp);
            }
        }
        Destroy() {
            this.TracePositions = [];
        }
        AddPosition(pos, receiverTimestamp) {
            if (this.Equals(pos, this.PrevPosition)) {
                return;
            }
            this.TracePositions.sort((x, y) => x[4] - y[4]);
            let prevTime;
            if (this.PrevPosition === null) {
                prevTime = receiverTimestamp;
                this.PrevAltitude = pos[2];
            }
            else {
                prevTime = this.PrevPositionTime;
            }
            let m;
            let n;
            let a;
            if (this.TracePositions.length > 1) {
                m = (this.PrevPosition[0] - this.PrevPrevPosition[0]) / (this.PrevPosition[1] - this.PrevPrevPosition[1]);
                n = this.PrevPosition[0] - (m * this.PrevPosition[1]);
                a = Math.abs((m * pos[1] + n) - pos[0]);
            }
            this.PrevPrevPosition = this.PrevPosition;
            this.PrevPosition = pos;
            this.PrevPositionTime = receiverTimestamp;
            const newseg = new Array(pos[0], pos[1], pos[2], 0, receiverTimestamp);
            if (this.TracePositions.length === 0) {
                this.TracePositions.push(newseg);
                return;
            }
            const lastseg = this.TracePositions[this.TracePositions.length - 1];
            const timeDifference = receiverTimestamp - prevTime;
            const estTrack = timeDifference > 31;
            if (estTrack && !lastseg[3]) {
                newseg[3] = 1;
                this.TracePositions.push(newseg);
                return;
            }
            if (!estTrack && lastseg[3]) {
                newseg[3] = 0;
                this.TracePositions.push(newseg);
                return;
            }
            if (a > 0.1) {
                return;
            }
            else if (a > 0.00023 || Math.abs(pos[2] - this.PrevAltitude) > 100 || receiverTimestamp - prevTime > 29) {
                newseg[3] = lastseg[3];
            }
            else {
                if (this.TracePositions.length > 1) {
                    this.TracePositions.pop();
                }
            }
            this.TracePositions.push(newseg);
            this.PrevAltitude = pos[2];
        }
        get Trace() {
            return this.TracePositions;
        }
        get LastTimeStamp() {
            return this.PrevPositionTime;
        }
        Equals(p1, p2, maxMargin) {
            if (!p1 || !p2) {
                return false;
            }
            const margin = Math.max(Math.abs(p1[0] - p2[0]), Math.abs(p1[1] - p2[1]));
            return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
        }
    }
    let AircraftHistoryWorker = null;
    const Worker = self;
    const AircraftTraceCollection = new Map();
    self.onmessage = (ev) => {
        const msg = ev.data;
        switch (msg.type) {
            case "Port":
                AircraftHistoryWorker = msg.data;
                AircraftHistoryWorker.onmessage = (evt) => {
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
    function UpdateTrace(icao, pos, receiverTimestamp) {
        let trace;
        if (!AircraftTraceCollection.has(icao)) {
            trace = new AircraftTrace(pos, receiverTimestamp);
            AircraftTraceCollection.set(icao, trace);
        }
        else {
            trace = AircraftTraceCollection.get(icao);
            trace.AddPosition(pos, receiverTimestamp);
        }
    }
    function DestroyTrace(icao) {
        if (AircraftTraceCollection.has(icao)) {
            const trace = AircraftTraceCollection.get(icao);
            trace.Destroy();
            AircraftTraceCollection.delete(icao);
        }
    }
    function Clean(now) {
        for (const [icao, trace] of AircraftTraceCollection.entries()) {
            if (now - trace.LastTimeStamp > 300) {
                AircraftTraceCollection.delete(icao);
            }
        }
    }
    function GetTrace(icao) {
        if (AircraftTraceCollection.has(icao)) {
            Worker.postMessage({ type: "Trace", data: [icao, AircraftTraceCollection.get(icao).Trace] });
        }
    }
})(READSB || (READSB = {}));
//# sourceMappingURL=aircraftTraces.js.map