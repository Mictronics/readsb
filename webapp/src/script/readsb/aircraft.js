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
            this.PrevPosition = null;
            this.PrevPositionTime = null;
            this.Marker = null;
            this.MarkerIcon = null;
            this.TrackLayer = null;
            this.TrackLinesegs = [];
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
            if (this.Seen > 58) {
                if (this.Visible) {
                    this.ClearMarker();
                    this.ClearLines();
                    this.Visible = false;
                    if (READSB.AircraftCollection.Selected === this.Icao) {
                        READSB.Body.SelectAircraftByHex(null, false);
                    }
                }
            }
            else {
                if (this.Position !== null && (this.Selected || this.SeenPos < 60)) {
                    this.Visible = true;
                    if (this.UpdateTrack(receiverTimestamp, lastTimestamp)) {
                        this.UpdateLines();
                        this.UpdateMarker(true);
                    }
                    else {
                        this.UpdateMarker(false);
                    }
                }
                else {
                    this.ClearMarker();
                    this.Visible = false;
                }
            }
        }
        Destroy() {
            this.TableRow.parentNode.removeChild(this.TableRow);
            this.TableRow = null;
            this.ClearMarker();
            this.ClearLines();
            this.TrackLinesegs = null;
            this.Position = null;
            this.PrevPosition = null;
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
                if ((this.Callsign === null) && (this.Operator === null)) {
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
        UpdateTrack(receiverTimestamp, lastTimestamp) {
            if (!this.Position) {
                return false;
            }
            if (this.PrevPosition
                && this.Position.equals(this.PrevPosition)) {
                return false;
            }
            const projHere = this.Position;
            let projPrev;
            let prevTime;
            if (this.PrevPosition === null) {
                projPrev = projHere;
                prevTime = this.LastPositionTime;
            }
            else {
                projPrev = this.PrevPosition;
                prevTime = this.PrevPositionTime;
            }
            this.PrevPosition = this.Position;
            this.PrevPositionTime = this.LastPositionTime;
            if (this.TrackLinesegs.length === 0) {
                const newseg = {
                    Altitude: this.Altitude,
                    Estimated: false,
                    Ground: isNaN(this.Altitude),
                    Line: L.polyline([projHere], {
                        color: this.GetMarkerColor(),
                        dashArray: "",
                        weight: 1.5,
                    }),
                    UpdateTime: this.LastPositionTime,
                };
                this.TrackLinesegs.push(newseg);
                this.HistorySize += 1;
                return true;
            }
            let lastseg = this.TrackLinesegs[this.TrackLinesegs.length - 1];
            const timeDifference = this.LastPositionTime - prevTime - (receiverTimestamp - lastTimestamp);
            const staleTimeout = this.PositionFromMlat ? 30 : 5;
            let estTrack = timeDifference > staleTimeout;
            estTrack = estTrack || receiverTimestamp - this.LastPositionTime > staleTimeout;
            if (estTrack) {
                if (!lastseg.Estimated) {
                    lastseg.Line.addLatLng(projPrev);
                    this.TrackLinesegs.push({
                        Altitude: 0,
                        Estimated: true,
                        Ground: isNaN(this.Altitude),
                        Line: L.polyline([projPrev], {
                            color: "#a08080",
                            dashArray: "3 3",
                            weight: 1.5,
                        }),
                        UpdateTime: prevTime,
                    });
                    this.HistorySize += 2;
                }
                else {
                    lastseg.Line.addLatLng(projPrev);
                    lastseg.UpdateTime = prevTime;
                    this.HistorySize += 1;
                }
                return true;
            }
            if (lastseg.Estimated) {
                lastseg.Line.addLatLng(projPrev);
                lastseg = {
                    Altitude: this.Altitude,
                    Estimated: false,
                    Ground: isNaN(this.Altitude),
                    Line: L.polyline([projPrev], {
                        color: this.GetMarkerColor(),
                        dashArray: "",
                        weight: 1.5,
                    }),
                    UpdateTime: prevTime,
                };
                this.TrackLinesegs.push(lastseg);
                this.HistorySize += 2;
                return true;
            }
            if ((lastseg.Ground && !isNaN(this.Altitude))
                || (!lastseg.Ground && isNaN(this.Altitude))
                || this.Altitude !== lastseg.Altitude) {
                lastseg.Line.addLatLng(projPrev);
                this.TrackLinesegs.push({
                    Altitude: this.Altitude,
                    Estimated: false,
                    Ground: isNaN(this.Altitude),
                    Line: L.polyline([projPrev], {
                        color: this.GetMarkerColor(),
                        dashArray: "",
                        weight: 1.5,
                    }),
                    UpdateTime: prevTime,
                });
                this.HistorySize += 2;
                return true;
            }
            if (prevTime - lastseg.UpdateTime >= 5) {
                lastseg.Line.addLatLng(projPrev);
                lastseg.UpdateTime = prevTime;
                this.HistorySize += 1;
            }
            return true;
        }
        UpdateMarker(moved) {
            const mapBounds = READSB.LMap.MapViewBounds;
            if (!this.Visible || this.Position === null || this.IsFiltered || !mapBounds.contains(this.Position)) {
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
        UpdateLines() {
            if (!this.Selected || !this.Visible || this.TrackLinesegs.length === 0) {
                return;
            }
            if (this.TrackLayer === null) {
                this.TrackLayer = L.featureGroup();
            }
            for (const seg of this.TrackLinesegs) {
                seg.Line.addTo(this.TrackLayer);
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
            const outline = this.PositionFromMlat
                ? READSB.AppSettings.OutlineMlatColor
                : READSB.AppSettings.OutlineADSBColor;
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
                vsi = i18next.t("list.climbing");
            }
            else if (this.VertRate < -256) {
                vsi = i18next.t("list.descending");
            }
            else {
                vsi = i18next.t("list.level");
            }
            const altText = Math.round(READSB.Format.ConvertAltitude(this.Altitude, READSB.AppSettings.DisplayUnits)) + READSB.Format.GetUnitLabel("altitude", READSB.AppSettings.DisplayUnits);
            if (READSB.AppSettings.ShowAdditionalData) {
                tip = this.TypeDescription
                    ? this.TypeDescription
                    : i18next.t("list.unknownAircraftType");
                tip = `${tip} [${this.Species ? this.Species : "?"}]`;
                tip = `${tip}\n(${this.Flight
                    ? this.Flight.trim()
                    : i18next.t("list.unknownFlight")})`;
                tip = `${tip} #${this.Icao.toUpperCase()}`;
                tip = `${tip}\n${this.Altitude ? altText : "?"}`;
                tip = `${tip} ${i18next.t("filter.and")} ${vsi}\n`;
                tip = `${tip} ${this.Operator ? this.Operator : ""}`;
            }
            else {
                tip = `${i18next.t("list.icao")}: ${this.Icao}`;
                tip = `${tip}\n${i18next.t("list.ident")}:  ${this.Flight ? this.Flight : "?"}`;
                tip = `${tip}\n${i18next.t("list.type")}: ${this.IcaoType ? this.IcaoType : "?"}`;
                tip = `${tip}\n${i18next.t("list.registration")}:  ${this.Registration
                    ? this.Registration
                    : "?"}`;
                tip = `${tip}\n${i18next.t("list.altitude")}:  ${this.Altitude ? altText : "?"}`;
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
            const colorsByAlt = READSB.AppSettings.ColorsByAlt;
            let h;
            let s;
            let l;
            const colorArr = this.GetAltitudeColor();
            [h, s, l] = colorArr;
            if (this.SeenPos > 15) {
                h += colorsByAlt.Stale.h;
                s += colorsByAlt.Stale.s;
                l += colorsByAlt.Stale.l;
            }
            if (this.Selected) {
                h += colorsByAlt.Selected.h;
                s += colorsByAlt.Selected.s;
                l += colorsByAlt.Selected.l;
            }
            if (this.PositionFromMlat) {
                h += colorsByAlt.Mlat.h;
                s += colorsByAlt.Mlat.s;
                l += colorsByAlt.Mlat.l;
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
                ({ h } = READSB.AppSettings.ColorsByAlt.Unknown);
                ({ s } = READSB.AppSettings.ColorsByAlt.Unknown);
                ({ l } = READSB.AppSettings.ColorsByAlt.Unknown);
            }
            else if (isNaN(altitude)) {
                ({ h } = READSB.AppSettings.ColorsByAlt.Ground);
                ({ s } = READSB.AppSettings.ColorsByAlt.Ground);
                ({ l } = READSB.AppSettings.ColorsByAlt.Ground);
            }
            else {
                ({ s } = READSB.AppSettings.ColorsByAlt.Air);
                ({ l } = READSB.AppSettings.ColorsByAlt.Air);
                const hpoints = READSB.AppSettings.ColorsByAlt.Air.h;
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