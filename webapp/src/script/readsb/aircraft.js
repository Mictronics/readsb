"use strict";
var READSB;
(function (READSB) {
    class ReadsbAircraft {
        constructor(icao) {
            this.Icao = null;
            this.IcaoRange = null;
            this.Flight = null;
            this.Squawk = null;
            this.Selected = false;
            this.Category = null;
            this.Operator = null;
            this.Callsign = null;
            this.AddrType = null;
            this.Altitude = null;
            this.AltBaro = null;
            this.AltGeom = null;
            this.Speed = null;
            this.Gs = null;
            this.Ias = null;
            this.Tas = null;
            this.Track = null;
            this.TrackRate = null;
            this.MagHeading = null;
            this.TrueHeading = null;
            this.Mach = null;
            this.Roll = null;
            this.NavAltitude = null;
            this.NavHeading = null;
            this.NavModes = null;
            this.NavQnh = null;
            this.Rc = null;
            this.NacP = null;
            this.NacV = null;
            this.NicBaro = null;
            this.SilType = null;
            this.Sil = null;
            this.BaroRate = null;
            this.GeomRate = null;
            this.VertRate = null;
            this.Version = null;
            this.Position = null;
            this.PositionFromMlat = false;
            this.SiteDist = null;
            this.Alert = false;
            this.SPIdent = false;
            this.Messages = null;
            this.Rssi = null;
            this.HistorySize = 0;
            this.Seen = null;
            this.SeenPos = null;
            this.Visible = true;
            this.TableRow = null;
            this.Registration = null;
            this.IcaoType = null;
            this.TypeDescription = null;
            this.Species = null;
            this.Wtc = null;
            this.CivilMil = null;
            this.Interesting = null;
            this.Highlight = false;
            this.SortPos = 0;
            this.SortValue = 0;
            this.LastMessageTime = null;
            this.LastPositionTime = null;
            this.Marker = null;
            this.MarkerIcon = null;
            this.TrackLayer = null;
            this.OperatorChecked = false;
            this.Icao = icao;
            this.IcaoRange = READSB.FindIcaoRange(this.Icao);
            this.Registration = READSB.Registration.FromHexId(this.Icao);
            READSB.Database.GetAircraftData(this.Icao, this.GetAircraftDataCallback.bind(this));
        }
        get DataSource() {
            if (this.PositionFromMlat) {
                return "mlat";
            }
            if (this.Position !== null) {
                return this.AddrType;
            }
            return "mode_s";
        }
        get IsFiltered() {
            let isFiltered = true;
            if (!READSB.AppSettings.EnableFilter) {
                this.Highlight = false;
                return false;
            }
            this.Highlight = false;
            for (const f of READSB.AircraftFilterCollection) {
                isFiltered = f.IsFiltered(this);
                if (isFiltered === true) {
                    break;
                }
            }
            if (READSB.AppSettings.EnableHighlightFilter) {
                if (isFiltered === false) {
                    this.Highlight = true;
                }
                isFiltered = false;
            }
            return isFiltered;
        }
        get FlightAwareLink() {
            if (this.Flight !== null && this.Flight !== "") {
                return `<a target="_blank" href="https://flightaware.com/live/flight/${this.Flight.trim()}">${this.Flight.trim()}</a>`;
            }
            return "";
        }
        UpdateTick(receiverTimestamp, lastTimestamp) {
            this.Seen = receiverTimestamp - this.LastMessageTime;
            this.SeenPos = (this.LastPositionTime === null ? null : receiverTimestamp - this.LastPositionTime);
            const mapBounds = READSB.LMap.MapViewBounds;
            let hideOutOfBounds = false;
            if (this.Position !== null) {
                hideOutOfBounds = !mapBounds.contains(this.Position) && READSB.AppSettings.HideAircraftsNotInView;
            }
            if (this.IsFiltered || this.Seen > 58 || hideOutOfBounds) {
                this.ClearMarker();
                this.ClearLines();
                this.Visible = false;
                this.TableRow.Visible = false;
                if (READSB.AircraftCollection.Selected === this.Icao) {
                    READSB.Body.SelectAircraftByHex(null, false);
                }
            }
            else {
                this.TableRow.Visible = true;
                if (this.Position !== null && this.SeenPos < 60) {
                    this.Visible = true;
                    this.UpdateMarker(true);
                }
                else {
                    this.ClearMarker();
                    this.ClearLines();
                    this.Visible = false;
                }
            }
        }
        Destroy() {
            if (this.TableRow.parentNode !== null) {
                this.TableRow.parentNode.removeChild(this.TableRow);
            }
            const range = document.createRange();
            range.selectNodeContents(this.TableRow);
            range.deleteContents();
            this.TableRow.removeEventListener("click", READSB.Body.OnAircraftListRowClick.bind(READSB.Body, ""));
            this.TableRow.removeEventListener("dblclick", READSB.Body.OnAircraftListRowDoubleClick.bind(READSB.Body, ""));
            this.TableRow.remove();
            this.ClearMarker();
            this.ClearLines();
            this.Position = null;
        }
        UpdateData(receiverTimestamp, data) {
            this.Messages = data.messages;
            this.Rssi = data.rssi;
            this.LastMessageTime = receiverTimestamp - data.seen;
            ("alt_baro" in data) ? this.AltBaro = data.alt_baro : this.AltBaro = null;
            ("alt_geom" in data) ? this.AltGeom = data.alt_geom : this.AltGeom = null;
            ("baro_rate" in data) ? this.BaroRate = data.baro_rate : this.BaroRate = null;
            ("category" in data) ? this.Category = data.category : this.Category = null;
            ("geom_rate" in data) ? this.GeomRate = data.geom_rate : this.GeomRate = null;
            ("gs" in data) ? this.Gs = data.gs : this.Gs = null;
            ("ias" in data) ? this.Ias = data.ias : this.Ias = null;
            ("mach" in data) ? this.Mach = data.mach : this.Mach = null;
            ("mag_heading" in data) ? this.MagHeading = data.mag_heading : this.MagHeading = null;
            ("nac_p" in data) ? this.NacP = data.nac_p : this.NacP = null;
            ("nac_v" in data) ? this.NacV = data.nac_v : this.NacV = null;
            ("nav_heading" in data) ? this.NavHeading = data.nav_heading : this.NavHeading = null;
            ("nav_modes" in data) ? this.NavModes = data.nav_modes : this.NavModes = null;
            ("nav_qnh" in data) ? this.NavQnh = data.nav_qnh : this.NavQnh = null;
            ("nic_baro" in data) ? this.NicBaro = data.nic_baro : this.NicBaro = null;
            ("rc" in data) ? this.Rc = data.rc : this.Rc = null;
            ("roll" in data) ? this.Roll = data.roll : this.Roll = null;
            ("sil" in data) ? this.Sil = data.sil : this.Sil = null;
            ("sil_type" in data) ? this.SilType = data.sil_type : this.SilType = null;
            ("squawk" in data) ? this.Squawk = data.squawk : this.Squawk = null;
            ("tas" in data) ? this.Tas = data.tas : this.Tas = null;
            ("track" in data) ? this.Track = data.track : this.Track = null;
            ("track_rate" in data) ? this.TrackRate = data.track_rate : this.TrackRate = null;
            ("true_heading" in data) ? this.TrueHeading = data.true_heading : this.TrueHeading = null;
            ("version" in data) ? this.Version = data.version : this.Version = null;
            ("alert" in data) ? this.Alert = !!data.alert : this.Alert = false;
            ("spi" in data) ? this.SPIdent = !!data.spi : this.SPIdent = false;
            if ("type" in data) {
                this.AddrType = data.type;
            }
            else {
                this.AddrType = "adsb_icao";
            }
            if ("flight" in data) {
                this.Flight = data.flight;
            }
            if ("lat" in data && "lon" in data) {
                this.Position = new L.LatLng(data.lat, data.lon);
                this.LastPositionTime = receiverTimestamp - data.seen_pos;
                if (READSB.AppSettings.SiteLat !== null && READSB.AppSettings.SiteLon !== null) {
                    this.SiteDist = READSB.LMap.GetDistance(L.latLng(READSB.AppSettings.SiteLat, READSB.AppSettings.SiteLon), this.Position);
                }
                this.PositionFromMlat = false;
                if (typeof data.mlat !== "undefined") {
                    for (const mlat of data.mlat) {
                        if (mlat === "lat" || mlat === "lon") {
                            this.PositionFromMlat = true;
                            break;
                        }
                    }
                }
            }
            if (typeof data.flight !== "undefined") {
                this.Flight = data.flight;
                if (this.OperatorChecked === false && this.Callsign === null && this.Operator === null) {
                    READSB.Database.GetOperator(this.Flight, this.GetOperatorCallback.bind(this));
                }
            }
            if (typeof data.squawk !== "undefined") {
                this.Squawk = data.squawk;
            }
            if (typeof data.category !== "undefined") {
                this.Category = data.category;
            }
            if ("alt_baro" in data) {
                this.Altitude = data.alt_baro;
            }
            else if ("alt_geom" in data) {
                this.Altitude = data.alt_geom;
            }
            else {
                this.Altitude = null;
            }
            if ("nav_altitude_fms" in data) {
                this.NavAltitude = data.nav_altitude_fms;
            }
            else if ("nav_altitude_mcp" in data) {
                this.NavAltitude = data.nav_altitude_mcp;
            }
            else {
                this.NavAltitude = null;
            }
            if ("geom_rate" in data) {
                this.VertRate = data.geom_rate;
            }
            else if ("baro_rate" in data) {
                this.VertRate = data.baro_rate;
            }
            else {
                this.VertRate = null;
            }
            if ("gs" in data) {
                this.Speed = data.gs;
            }
            else if ("tas" in data) {
                this.Speed = data.tas;
            }
            else if ("ias" in data) {
                this.Speed = data.ias;
            }
            else {
                this.Speed = null;
            }
        }
        UpdateMarker(moved) {
            if (!this.Visible || this.Position === null || this.IsFiltered) {
                this.ClearMarker();
                return;
            }
            const scaleFactor = Math.max(0.2, Math.min(1.2, 0.2 * Math.pow(1.25, READSB.AppSettings.ZoomLevel)));
            let rotation = this.Track;
            if (rotation === null) {
                rotation = this.TrueHeading;
            }
            if (rotation === null) {
                rotation = this.MagHeading;
            }
            if (rotation === null) {
                rotation = 0;
            }
            if (this.UpdateIcon()) {
                rotation = 0;
            }
            const tip = this.CreateToolTip();
            if (this.Marker !== null) {
                if (moved) {
                    this.Marker.setIcon(this.MarkerIcon);
                    this.Marker.SetLatLngScaleRotation(this.Position, scaleFactor, rotation);
                    this.Marker.setTooltipContent(tip);
                }
            }
            else {
                this.Marker = L.aircraftMarker(this.Position, {
                    draggable: false,
                    icao: this.Icao,
                    icon: this.MarkerIcon,
                    keyboard: false,
                    rotation,
                    scale: scaleFactor,
                });
                this.Marker.bindTooltip(tip, {
                    direction: "right",
                    interactive: false,
                    opacity: 0.80,
                });
                READSB.LMap.AircraftPositions.addLayer(this.Marker);
            }
            this.Marker.SelectAlertIdent(this.Selected && !READSB.AircraftCollection.SelectAll, this.Alert, this.SPIdent);
        }
        UpdateTrace(trace) {
            if (!this.Selected || !this.Visible) {
                return;
            }
            if (this.TrackLayer === null) {
                this.TrackLayer = L.featureGroup();
            }
            this.TrackLayer.clearLayers();
            let hsl;
            let color;
            let l;
            let dashArray;
            for (let i = 1; i < trace.length; i++) {
                hsl = this.GetAltitudeColor(trace[i][2]);
                color = `hsl(${Math.round(hsl[0] / 5) * 5},${Math.round(hsl[1] / 5) * 5}%,${Math.round(hsl[2] / 5) * 5}%)`;
                if (trace[i][3]) {
                    dashArray = "3 3";
                }
                else {
                    dashArray = "";
                }
                l = L.polyline([L.latLng(trace[i - 1][0], trace[i - 1][1]), L.latLng(trace[i][0], trace[i][1])], {
                    color,
                    dashArray,
                    weight: 1.5,
                });
                l.addTo(this.TrackLayer);
            }
            this.TrackLayer.addTo(READSB.LMap.AircraftTrails);
        }
        ClearLines() {
            if (this.TrackLayer !== null) {
                READSB.LMap.AircraftTrails.removeLayer(this.TrackLayer);
                this.TrackLayer.clearLayers();
            }
        }
        UpdateIcon() {
            const col = this.GetMarkerColor();
            const outline = "#000000";
            const baseMarker = READSB.GetBaseMarker(this.Category, this.IcaoType, this.Species, this.Wtc);
            const iconHash = this.StringHashCode(`${col}|${outline}|${baseMarker.Svg}`);
            if (this.MarkerIcon === null || this.MarkerIconHash !== iconHash) {
                const icon = L.icon({
                    iconSize: baseMarker.Size,
                    iconUrl: READSB.SvgPathToUri(baseMarker.Svg, outline, col, ""),
                    tooltipAnchor: [0, -25],
                });
                this.MarkerIcon = icon;
                this.MarkerIconHash = iconHash;
            }
            return baseMarker.NoRotate || false;
        }
        CreateToolTip() {
            let tip;
            let vsi = "";
            if (this.VertRate > 256) {
                vsi = READSB.Strings.Climbing;
            }
            else if (this.VertRate < -256) {
                vsi = READSB.Strings.Descending;
            }
            else {
                vsi = READSB.Strings.Level;
            }
            let altText;
            if (this.Altitude === null) {
                altText = "?";
            }
            else if (isNaN(this.Altitude)) {
                altText = READSB.Strings.Ground;
            }
            else {
                altText = Math.round(READSB.Format.ConvertAltitude(this.Altitude, READSB.AppSettings.DisplayUnits)) + READSB.Strings.AltitudeUnit;
            }
            const icao24 = this.Icao.toUpperCase();
            const desc = this.TypeDescription ? this.TypeDescription : READSB.Strings.UnknownAircraftType;
            const species = this.Species ? this.Species : "";
            const flight = this.Flight ? this.Flight.trim() : READSB.Strings.UnknownFlight;
            const operator = this.Operator ? this.Operator : "";
            const registration = this.Registration ? this.Registration : "";
            const type = this.IcaoType ? this.IcaoType : "";
            if (READSB.AppSettings.ShowAdditionalData) {
                tip = `${type} ${species}\n${flight} #${icao24} ${altText} ${vsi}\n${operator}`;
            }
            else {
                tip = `#${icao24}\n${flight}\n${type}\n${registration}\n${altText}`;
            }
            return tip;
        }
        ClearMarker() {
            if (this.Marker && READSB.LMap.AircraftPositions.hasLayer(this.Marker)) {
                READSB.LMap.AircraftPositions.removeLayer(this.Marker);
                this.MarkerIcon.options.iconUrl = null;
                this.MarkerIcon = null;
                this.Marker = null;
            }
        }
        GetOperatorCallback(result) {
            if (result !== undefined) {
                if ("radio" in result) {
                    this.Callsign = result.radio;
                }
                if ("name" in result) {
                    this.Operator = result.name;
                }
            }
            this.OperatorChecked = true;
        }
        GetAircraftDataCallback(result) {
            if (result !== undefined) {
                if ("reg" in result) {
                    this.Registration = result.reg;
                }
                if ("type" in result) {
                    this.IcaoType = result.type;
                    READSB.Database.GetType(this.IcaoType, this.GetAircraftTypeCallback.bind(this));
                }
                if ("flags" in result) {
                    switch (result.flags) {
                        default:
                        case "00":
                            this.CivilMil = false;
                            this.Interesting = false;
                            break;
                        case "01":
                            this.CivilMil = false;
                            this.Interesting = true;
                            break;
                        case "10":
                            this.CivilMil = true;
                            this.Interesting = false;
                            break;
                        case "11":
                            this.CivilMil = true;
                            this.Interesting = true;
                            break;
                    }
                }
                if ("desc" in result) {
                    this.TypeDescription = result.desc;
                }
            }
        }
        GetAircraftTypeCallback(result) {
            if (result !== undefined) {
                if ("wtc" in result) {
                    this.Wtc = result.wtc;
                }
                if ("desc" in result) {
                    this.Species = result.desc;
                }
            }
        }
        GetMarkerColor() {
            const specSquawk = READSB.AircraftCollection.IsSpecialSquawk(this.Squawk);
            if (specSquawk !== null) {
                return specSquawk.MarkerColor;
            }
            let h;
            let s;
            let l;
            const colorArr = this.GetAltitudeColor();
            [h, s, l] = colorArr;
            if (this.SeenPos > 15) {
                h += 0;
                s += -10;
                l += 30;
            }
            if (this.Selected) {
                h += 0;
                s += -10;
                l += 20;
            }
            if (this.PositionFromMlat) {
                h += 0;
                s += -10;
                l += -10;
            }
            if (h < 0) {
                h = (h % 360) + 360;
            }
            else if (h >= 360) {
                h %= 360;
            }
            if (s < 5) {
                s = 5;
            }
            else if (s > 95) {
                s = 95;
            }
            if (l < 5) {
                l = 5;
            }
            else if (l > 95) {
                l = 95;
            }
            return `hsl(${Math.round(h / 5) * 5},${Math.round(s / 5) * 5}%,${Math.round(l / 5) * 5}%)`;
        }
        GetAltitudeColor(altitude) {
            let h;
            let s;
            let l;
            if (altitude === undefined) {
                altitude = Math.ceil((this.Altitude + 1) / 100) * 100;
            }
            if (altitude === null) {
                h = 0;
                s = 0;
                l = 40;
            }
            else if (isNaN(altitude)) {
                h = 120;
                s = 100;
                l = 30;
            }
            else {
                s = 85;
                l = 50;
                const hpoints = [
                    { alt: 2000, val: 20 },
                    { alt: 10000, val: 140 },
                    { alt: 40000, val: 300 },
                ];
                h = hpoints[0].val;
                for (let i = hpoints.length - 1; i >= 0; i -= 1) {
                    if (altitude > hpoints[i].alt) {
                        if (i === hpoints.length - 1) {
                            h = hpoints[i].val;
                        }
                        else {
                            h = hpoints[i].val
                                + ((hpoints[i + 1].val - hpoints[i].val)
                                    * (altitude - hpoints[i].alt))
                                    / (hpoints[i + 1].alt - hpoints[i].alt);
                        }
                        break;
                    }
                }
            }
            if (h < 0) {
                h = (h % 360) + 360;
            }
            else if (h >= 360) {
                h %= 360;
            }
            if (s < 5) {
                s = 5;
            }
            else if (s > 95) {
                s = 95;
            }
            if (l < 5) {
                l = 5;
            }
            else if (l > 95) {
                l = 95;
            }
            return [h, s, l];
        }
        StringHashCode(s) {
            let h = 0;
            for (let i = 0; i < s.length; i++) {
                h = Math.imul(31, h) + s.charCodeAt(i) | 0;
            }
            return h;
        }
    }
    READSB.ReadsbAircraft = ReadsbAircraft;
})(READSB || (READSB = {}));
//# sourceMappingURL=aircraft.js.map