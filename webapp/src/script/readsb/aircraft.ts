// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// aircraft.ts: Class for single aircraft object.
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
    export class ReadsbAircraft implements IAircraft {
        // Info about the aircraft
        public Icao: string = null;
        public IcaoRange: IIcaoRange = null;
        public Flight: string = null;
        public Squawk: string = null;
        public Selected: boolean = false;
        public Category: string = null;
        public Operator: string = null;
        public Callsign: string = null;
        public AddrType: string = null;
        // Basic location information
        public Altitude: number = null;
        public AltBaro: number = null;
        public AltGeom: number = null;
        public Speed: number = null;
        public Gs: number = null;
        public Ias: number = null;
        public Tas: number = null;
        public Track: number = null;
        public TrackRate: number = null;
        public MagHeading: number = null;
        public TrueHeading: number = null;
        public Mach: number = null;
        public Roll: number = null;
        public NavAltitude: number = null;
        public NavHeading: number = null;
        public NavModes: string[] = null;
        public NavQnh: number = null;
        public Rc: number = null;
        public NacP: number = null;
        public NacV: number = null;
        public NicBaro: number = null;
        public SilType: string = null;
        public Sil: number = null;
        public BaroRate: number = null;
        public GeomRate: number = null;
        public VertRate: number = null;
        public Version: number = null;
        public Position: L.LatLng = null;
        public PositionFromMlat: boolean = false;
        public SiteDist: number = null;
        public Alert: boolean = false;
        public SPIdent: boolean = false;
        // Data packet numbers
        public Messages: number = null;
        public Rssi: number = null;
        // Track history as a series of line segments
        public HistorySize: number = 0;
        // When was this last updated (seconds before last update)
        public Seen: number = null;
        public SeenPos: number = null;
        // Display info
        public Visible: boolean = true;
        public TableRow: HTMLTableRowElement = null;
        // Start from a computed registration, let the DB override it
        // if it has something else.
        public Registration: string = null;
        public IcaoType: string = null;
        public TypeDescription: string = null;
        public Species: string = null;
        public Wtc: string = null;
        public CivilMil: boolean = null;
        public Interesting: boolean = null;
        public Highlight: boolean = false;
        // Sorting information
        public SortPos: number = 0;
        public SortValue: number = 0;
        // When was this last updated (receiver timestamp)
        private LastMessageTime: number = null;
        private LastPositionTime: number = null;
        private PrevPosition: L.LatLng = null;
        private PrevPositionTime: number = null;
        private Marker: L.AircraftMarker = null;
        private MarkerIcon: L.Icon = null;
        private MarkerIconHash: number;
        private TrackLayer: L.FeatureGroup = null;
        private TrackLinesegs: ITrackSegment[] = [];

        constructor(icao: string) {
            this.Icao = icao;
            this.IcaoRange = FindIcaoRange(this.Icao);
            this.Registration = Registration.FromHexId(this.Icao);
            // Request metadata
            Database.GetAircraftData(this.Icao, this.GetAircraftDataCallback.bind(this));
        }

        /**
         * Type of aircraft data source.
         */
        get DataSource(): string {
            // MLAT
            if (this.PositionFromMlat) {
                return "mlat";
            }
            // Not MLAT, but position reported - ADSB or variants
            if (this.Position !== null) {
                return this.AddrType;
            }
            // Otherwise Mode S
            return "mode_s";
        }

        get IsFiltered(): boolean {
            let isFiltered = true;

            if (!AppSettings.EnableFilter) {
                this.Highlight = false;
                return false;
            }

            this.Highlight = false;
            for (const f of AircraftFilterCollection) {
                isFiltered = f.IsFiltered(this);
                if (isFiltered === true) {
                    break; // At least one filter matches, filter out this aircraft
                }
            }
            if (AppSettings.EnableHighlightFilter) {
                if (isFiltered === false) {
                    this.Highlight = true;
                }
                isFiltered = false;
            }
            return isFiltered;
        }

        get FlightAwareLink(): string {
            if (this.Flight !== null && this.Flight !== "") {
                return `<a target="_blank" href="https://flightaware.com/live/flight/${this.Flight.trim()}">${this.Flight.trim()}</a>`;
            }
            return "";
        }

        /**
         * TODO: Add description.
         * @param receiverTimestamp
         * @param lastTimestamp
         */
        public UpdateTick(receiverTimestamp: number, lastTimestamp: number) {
            // recompute seen and seen_pos
            this.Seen = receiverTimestamp - this.LastMessageTime;
            this.SeenPos = (this.LastPositionTime === null ? null : receiverTimestamp - this.LastPositionTime);

            // If no packet in over 58 seconds, clear the aircraft.
            if (this.Seen > 58) {
                if (this.Visible) {
                    this.ClearMarker();
                    this.ClearLines();
                    this.Visible = false;
                    if (AircraftCollection.Selected === this.Icao) {
                        Body.SelectAircraftByHex(null, false);
                    }
                }
            } else {
                if (this.Position !== null && (this.Selected || this.SeenPos < 60)) {
                    this.Visible = true;
                    if (this.UpdateTrack(receiverTimestamp, lastTimestamp)) {
                        this.UpdateLines();
                        this.UpdateMarker(true);
                    } else {
                        this.UpdateMarker(false); // didn't move
                    }
                } else {
                    this.ClearMarker();
                    this.Visible = false;
                }
            }
        }

        /**
         * Destroy all object references when aircraft is deleted from list.
         */
        public Destroy() {
            // Remove entry from aircraft list DOM tree.
            this.TableRow.parentNode.removeChild(this.TableRow);
            this.TableRow = null;
            this.ClearMarker();
            this.ClearLines();
            this.TrackLinesegs = null;
            this.Position = null;
            this.PrevPosition = null;
        }

        /**
         * Update this aircraft with data fetched from readsb backend service.
         * @param receiverTimestamp Timestamp when data was created.
         * @param data Aircraft data.
         */
        public UpdateData(receiverTimestamp: number, data: IJsonData) {
            // Update all of our data
            this.Messages = data.messages;
            this.Rssi = data.rssi;
            this.LastMessageTime = receiverTimestamp - data.seen;

            // Map simple fields from JSON to aircraft class properties
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

            // fields with more complex behaviour
            if ("type" in data) {
                this.AddrType = data.type;
            } else {
                this.AddrType = "adsb_icao";
            }

            // don't expire callsigns
            if ("flight" in data) {
                this.Flight = data.flight;
            }

            if ("lat" in data && "lon" in data) {
                this.Position = new L.LatLng(data.lat, data.lon);
                this.LastPositionTime = receiverTimestamp - data.seen_pos;

                if (AppSettings.SiteLat !== null && AppSettings.SiteLon !== null) {
                    this.SiteDist = LMap.GetDistance(L.latLng(AppSettings.SiteLat, AppSettings.SiteLon), this.Position);
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
                    Database.GetOperator(this.Flight, this.GetOperatorCallback.bind(this));
                }
            }

            if (typeof data.squawk !== "undefined") {
                this.Squawk = data.squawk;
            }
            if (typeof data.category !== "undefined") {
                this.Category = data.category;
            }

            // Pick an altitude
            if ("alt_baro" in data) {
                this.Altitude = data.alt_baro;
            } else if ("alt_geom" in data) {
                this.Altitude = data.alt_geom;
            } else {
                this.Altitude = null;
            }

            // Pick a selected altitude
            if ("nav_altitude_fms" in data) {
                this.NavAltitude = data.nav_altitude_fms;
            } else if ("nav_altitude_mcp" in data) {
                this.NavAltitude = data.nav_altitude_mcp;
            } else {
                this.NavAltitude = null;
            }

            // Pick vertical rate from either baro or geom rate
            // geometric rate is generally more reliable (smoothed etc)
            if ("geom_rate" in data) {
                this.VertRate = data.geom_rate;
            } else if ("baro_rate" in data) {
                this.VertRate = data.baro_rate;
            } else {
                this.VertRate = null;
            }

            // Pick a speed
            if ("gs" in data) {
                this.Speed = data.gs;
            } else if ("tas" in data) {
                this.Speed = data.tas;
            } else if ("ias" in data) {
                this.Speed = data.ias;
            } else {
                this.Speed = null;
            }
        }

        /**
         * Appends data to the running track so we can get a visual tail on the plane.
         * @param receiverTimestamp
         * @param lastTimestamp
         */
        public UpdateTrack(receiverTimestamp: number, lastTimestamp: number) {
            if (!this.Position) {
                return false;
            }
            if (
                this.PrevPosition
                && this.Position.equals(this.PrevPosition)
            ) {
                return false;
            }

            const projHere = this.Position;
            let projPrev;
            let prevTime;
            if (this.PrevPosition === null) {
                projPrev = projHere;
                prevTime = this.LastPositionTime;
            } else {
                projPrev = this.PrevPosition;
                prevTime = this.PrevPositionTime;
            }

            this.PrevPosition = this.Position;
            this.PrevPositionTime = this.LastPositionTime;

            if (this.TrackLinesegs.length === 0) {
                // Brand new track
                const newseg: ITrackSegment = {
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

            // Determine if track data are intermittent/stale
            // Time difference between two position updates should not be much
            // greater than the difference between data inputs
            // MLAT data are given some more leeway
            const timeDifference = this.LastPositionTime - prevTime - (receiverTimestamp - lastTimestamp);
            const staleTimeout = this.PositionFromMlat ? 30 : 5;
            let estTrack = timeDifference > staleTimeout;

            // Also check if the position was already stale when it was exported by readsb
            // Makes stale check more accurate for history points spaced 30 seconds apart
            estTrack = estTrack || receiverTimestamp - this.LastPositionTime > staleTimeout;

            if (estTrack) {
                if (!lastseg.Estimated) {
                    // >5s gap in data, create a new estimated segment
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
                } else {
                    // Keep appending to the existing dashed line; keep every point
                    lastseg.Line.addLatLng(projPrev);
                    lastseg.UpdateTime = prevTime;
                    this.HistorySize += 1;
                }

                return true;
            }

            if (lastseg.Estimated) {
                // We are back to good data (we got two points close in time), switch back to
                // solid lines.
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

            if (
                (lastseg.Ground && !isNaN(this.Altitude))
                || (!lastseg.Ground && isNaN(this.Altitude))
                || this.Altitude !== lastseg.Altitude
            ) {
                // Create a new segment as the ground state changed.
                // assume the state changed halfway between the two points
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
            // Add more data to the existing track.
            // We only retain some historical points, at 5+ second intervals,
            // plus the most recent point
            if (prevTime - lastseg.UpdateTime >= 5) {
                // enough time has elapsed; retain the last point and add a new one
                lastseg.Line.addLatLng(projPrev);
                lastseg.UpdateTime = prevTime;
                this.HistorySize += 1;
            }
            return true;
        }

        /**
         * Create or move aircraft marker on map.
         * @param moved True if marker exists and just moved.
         */
        public UpdateMarker(moved: boolean) {
            const mapBounds = LMap.MapViewBounds;
            let hideOutOfBounds = false;
            if (this.Position !== null) {
                hideOutOfBounds = !mapBounds.contains(this.Position) && AppSettings.HideAircraftsNotInView;
            }

            if (!this.Visible || this.Position === null || this.IsFiltered || hideOutOfBounds) {
                this.ClearMarker();
                return;
            }

            const scaleFactor = Math.max(
                0.2,
                Math.min(1.2, 0.2 * 1.25 ** AppSettings.ZoomLevel),
            );

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
            } else {
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
                LMap.AircraftPositions.addLayer(this.Marker);
            }

            this.Marker.SelectAlertIdent(this.Selected && !AircraftCollection.SelectAll, this.Alert, this.SPIdent);

        }

        /**
         * Update aircraft tail line.
         * FIXME Not working as in dump1090.
         */
        public UpdateLines() {
            if (!this.Selected || !this.Visible || this.TrackLinesegs.length === 0) {
                return;
            }

            if (this.TrackLayer === null) {
                this.TrackLayer = L.featureGroup();
            }

            for (const seg of this.TrackLinesegs) {
                seg.Line.addTo(this.TrackLayer);
            }

            this.TrackLayer.addTo(LMap.AircraftTrails);
        }

        /**
         * Remove aircraft trails from map and this aircraft.
         */
        public ClearLines() {
            if (this.TrackLayer !== null) {
                LMap.AircraftTrails.removeLayer(this.TrackLayer);
                this.TrackLayer.clearLayers();
            }
        }

        /**
         * Update marker icon.
         */
        private UpdateIcon() {
            const col = this.GetMarkerColor();
            const outline = this.PositionFromMlat
                ? AppSettings.OutlineMlatColor
                : AppSettings.OutlineADSBColor;
            const baseMarker = GetBaseMarker(
                this.Category,
                this.IcaoType,
                this.Species,
                this.Wtc,
            );

            const iconHash = this.StringHashCode(`${col}|${outline}|${baseMarker.Svg}`);

            if (this.MarkerIcon === null || this.MarkerIconHash !== iconHash) {
                const icon = L.icon({
                    iconSize: baseMarker.Size,
                    iconUrl: SvgPathToUri(baseMarker.Svg, outline, col, ""),
                    tooltipAnchor: [0, -25],
                });

                this.MarkerIcon = icon;
                this.MarkerIconHash = iconHash;
            }
            return baseMarker.NoRotate || false;
        }

        /**
         * Create tooltip for marker.
         */
        private CreateToolTip(): string {
            let tip;
            let vsi = "";
            if (this.VertRate > 256) {
                vsi = i18next.t("list.climbing");
            } else if (this.VertRate < -256) {
                vsi = i18next.t("list.descending");
            } else {
                vsi = i18next.t("list.level");
            }

            const altText = Math.round(
                Format.ConvertAltitude(
                    this.Altitude,
                    AppSettings.DisplayUnits,
                ),
            ) + Format.GetUnitLabel("altitude", AppSettings.DisplayUnits);

            if (AppSettings.ShowAdditionalData) {
                tip = this.TypeDescription
                    ? this.TypeDescription
                    : i18next.t("list.unknownAircraftType");
                tip = `${tip} [${
                    this.Species ? this.Species : "?"
                    }]`;

                tip = `${tip}\n(${
                    this.Flight
                        ? this.Flight.trim()
                        : i18next.t("list.unknownFlight")
                    })`;
                tip = `${tip} #${this.Icao.toUpperCase()}`;

                if (isNaN(this.Altitude)) {
                    tip = `${tip} ${i18next.t("list.ground")}\n`;
                } else {
                    tip = `${tip}\n${this.Altitude ? altText : "?"}`;
                    tip = `${tip} ${i18next.t("filter.and")} ${vsi}\n`;
                }

                tip = `${tip} ${
                    this.Operator ? this.Operator : ""
                    }`;
            } else {
                tip = `${i18next.t("list.icao")}: ${this.Icao}`;
                tip = `${tip}\n${i18next.t("list.ident")}:  ${
                    this.Flight ? this.Flight : "?"
                    }`;
                tip = `${tip}\n${i18next.t("list.type")}: ${
                    this.IcaoType ? this.IcaoType : "?"
                    }`;
                tip = `${tip}\n${i18next.t("list.registration")}:  ${
                    this.Registration
                        ? this.Registration
                        : "?"
                    }`;
                tip = `${tip}\n${i18next.t("list.altitude")}:  ${
                    this.Altitude ? altText : "?"
                    }`;
            }
            return tip;
        }

        /**
         * Clear aircraft marker.
         */
        private ClearMarker() {
            if (this.Marker && LMap.AircraftPositions.hasLayer(this.Marker)) {
                LMap.AircraftPositions.removeLayer(this.Marker);
                // Remove reference to SVG string.
                this.MarkerIcon.options.iconUrl = null;
                // Remove reference to icon object.
                this.MarkerIcon = null;
                // Remove reference to marker object.
                this.Marker = null;
            }
        }

        /**
         * Update operator details from database.
         * @param result Result from indexedDB query.
         */
        private GetOperatorCallback(result: any) {
            if (result !== undefined) {
                if ("radio" in result) {
                    this.Callsign = result.radio;
                }
                if ("name" in result) {
                    this.Operator = result.name;
                }
            }
        }

        /**
         * Update aircraft details from database.
         * @param result Result from indexedDB query.
         */
        private GetAircraftDataCallback(result: any) {
            if (result !== undefined) {
                if ("reg" in result) {
                    this.Registration = result.reg;
                }

                if ("type" in result) {
                    this.IcaoType = result.type;
                    Database.GetType(this.IcaoType, this.GetAircraftTypeCallback.bind(this));
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

        /**
         * Update aircraft type details from database.
         * @param result Result from indexedDB query.
         */
        private GetAircraftTypeCallback(result: any) {
            if (result !== undefined) {
                if ("wtc" in result) {
                    this.Wtc = result.wtc;
                }
                if ("desc" in result) {
                    this.Species = result.desc;
                }
            }
        }

        private GetMarkerColor() {
            // Emergency squawks override everything else
            const specSquawk = AircraftCollection.IsSpecialSquawk(this.Squawk);
            if (specSquawk !== null) {
                return specSquawk.MarkerColor;
            }

            const colorsByAlt = AppSettings.ColorsByAlt;
            let h;
            let s;
            let l;

            const colorArr = this.GetAltitudeColor();

            [h, s, l] = colorArr;

            // If we have not seen a recent position update, change color
            if (this.SeenPos > 15) {
                h += colorsByAlt.Stale.h;
                s += colorsByAlt.Stale.s;
                l += colorsByAlt.Stale.l;
            }

            // If this marker is selected, change color
            if (this.Selected) {
                h += colorsByAlt.Selected.h;
                s += colorsByAlt.Selected.s;
                l += colorsByAlt.Selected.l;
            }

            // If this marker is a mlat position, change color
            if (this.PositionFromMlat) {
                h += colorsByAlt.Mlat.h;
                s += colorsByAlt.Mlat.s;
                l += colorsByAlt.Mlat.l;
            }

            if (h < 0) {
                h = (h % 360) + 360;
            } else if (h >= 360) {
                h %= 360;
            }

            if (s < 5) {
                s = 5;
            } else if (s > 95) {
                s = 95;
            }

            if (l < 5) {
                l = 5;
            } else if (l > 95) {
                l = 95;
            }
            return `hsl(${Math.round(h / 5) * 5},${Math.round(s / 5) * 5}%,${Math.round(l / 5) * 5}%)`;
        }

        /**
         * Get color depending on altitude.
         * @param altitude Altitude number or ground string.
         */
        private GetAltitudeColor(altitude?: number): number[] {
            let h;
            let s;
            let l;

            if (altitude === undefined) {
                // Round altitude to next full 100.
                // This prevents changes in marker color on small changes in altitude
                // and therefore reduces periodical creation of marker icons.
                altitude = Math.ceil((this.Altitude + 1) / 100) * 100;
            }

            if (altitude === null) {
                ({ h } = AppSettings.ColorsByAlt.Unknown);
                ({ s } = AppSettings.ColorsByAlt.Unknown);
                ({ l } = AppSettings.ColorsByAlt.Unknown);
            } else if (isNaN(altitude)) {
                ({ h } = AppSettings.ColorsByAlt.Ground);
                ({ s } = AppSettings.ColorsByAlt.Ground);
                ({ l } = AppSettings.ColorsByAlt.Ground);
            } else {
                ({ s } = AppSettings.ColorsByAlt.Air);
                ({ l } = AppSettings.ColorsByAlt.Air);

                // find the pair of points the current altitude lies between,
                // and interpolate the hue between those points
                const hpoints = AppSettings.ColorsByAlt.Air.h;
                h = hpoints[0].val;
                for (let i = hpoints.length - 1; i >= 0; i -= 1) {
                    if (altitude > hpoints[i].alt) {
                        if (i === hpoints.length - 1) {
                            h = hpoints[i].val;
                        } else {
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
            } else if (h >= 360) {
                h %= 360;
            }

            if (s < 5) {
                s = 5;
            } else if (s > 95) {
                s = 95;
            }

            if (l < 5) {
                l = 5;
            } else if (l > 95) {
                l = 95;
            }

            return [h, s, l];
        }

        /**
         * Returns a hash code for a string.
         * (Compatible to Java's String.hashCode())
         *
         * The hash code for a string object is computed as
         *     s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]
         * using number arithmetic, where s[i] is the i th character
         * of the given string, n is the length of the string,
         * and ^ indicates exponentiation.
         * (The hash value of the empty string is zero.)
         *
         * @param s String to hash.
         * @return Hash code value for the given string.
         */
        private StringHashCode(s: string): number {
            let h = 0;
            for (let i = 0; i < s.length; i++) {
                // tslint:disable-next-line: no-bitwise
                h = Math.imul(31, h) + s.charCodeAt(i) | 0;
            }
            return h;
        }
    }
}
