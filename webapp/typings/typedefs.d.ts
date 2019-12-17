// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// typedef.d.ts: Custom Typescript definitions used in web application.
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

declare namespace READSB {
    /**
     * All app settings.
     */
    export interface IAppSettings {
        ShowAltitudeChart: boolean;
        CenterLat: number;
        CenterLon: number;
        ColorsByAlt: IColorByAlt;
        DisplayUnits: string;
        MapName: string;
        ZoomLevel: number;
        SiteLat: number,
        SiteLon: number,
        ShowSite: boolean,
        ShowSiteCircles: boolean,
        SiteCirclesDistances: number[],
        PageName: string,
        ShowFlags: boolean,
        ShowAdditionalData: boolean,
        ShowAircraftCountInTitle: boolean,
        ShowMessageRateInTitle: boolean,
        OnlineDatabaseUrl: string,
        OutlineADSBColor: string,
        OutlineMlatColor: string,
        FlagPath: string,
        ShowChartBundleLayers: boolean,
        BingMapsAPIKey: string,
        SkyVectorAPIKey: string,
        ShowAdditionalMaps: boolean,
        ShowHoverOverLabels: boolean,
        ShowUSLayers: boolean,
        ShowEULayers: boolean,
        EnableFilter: boolean,
        EnableHighlightFilter: boolean
        AircraftPosition: boolean;
        AircraftTrail: boolean;
        BaseLayer: string;
        OverlayLayers: string[];
        AppLanguage: string;
        HideAircraftsNotInView: boolean;
    }

    /**
     * An SVG shape.
     */
    export interface IShape {
        NoRotate?: boolean;
        Size: L.PointExpression;
        Svg: string;
    }

    /**
     * An SVG shape collection.
     */
    export interface IShapeCollection {
        [key: string]: IShape;
    }

    /**
     * Special squawk definition.
     */
    export interface ISpecialSquawk {
        CssClass: string;
        MarkerColor: string;
        Text: string;
    }

    /**
     * A Unit label.
     */
    interface IUnitLabel {
        [key: string]: string;
    }

    /**
     * TODO: Add descripion.
     */
    export interface IStride {
        Start: number;
        End?: number;
        S1: number;
        S2: number;
        Prefix: string;
        First?: string;
        Last?: string;
        Alphabet?: string;
        Offset?: number;
    }

    /**
     * A numeric ICAO address range.
     */
    export interface INumericMap {
        Start: number;
        First: number;
        Count: number;
        End?: number;
        Template: string;
    }

    /**
     * An ICAO address range for single country.
     */
    export interface IIcaoRange {
        Start: number;
        End: number;
        Country: string;
        FlagImage: string;
    }

    /**
     * Extend table row by visibily variables.
     */
    interface IExtHTMLTableRowElement extends HTMLTableRowElement {
        Visible?: boolean; // True if row is visible in aircraft list.
    }

    /**
     * An aircraft record.
     */
    export interface IAircraft {
        Icao: string;
        IcaoRange: IIcaoRange;
        Flight: string;
        Squawk: string;
        Selected: boolean;
        Category: string;
        Operator: string;
        Callsign: string;
        AddrType: string;

        // Basic location information
        Altitude: number;
        AltBaro: number;
        AltGeom: number;

        Speed: number;
        Gs: number;
        Ias: number;
        Tas: number;

        Track: number;
        TrackRate: number;
        MagHeading: number;
        TrueHeading: number;
        Mach: number;
        Roll: number;
        NavAltitude: number;
        NavHeading: number;
        NavModes: string[];
        NavQnh: number;
        Rc: number;
        NacP: number;
        NacV: number;
        NicBaro: number;
        SilType: string;
        Sil: number;

        BaroRate: number;
        GeomRate: number;
        VertRate: number;

        Version: number;

        Position: L.LatLng;
        PositionFromMlat: boolean;
        SiteDist: number;

        // Data packet numbers
        Messages: number;
        Rssi: number;

        // Track history as a series of line segments
        HistorySize: number;

        // When was this last updated (seconds before last update)
        Seen: number;
        SeenPos: number;

        // Display info
        Visible: boolean;
        TableRow: IExtHTMLTableRowElement;

        // start from a computed registration, let the DB override it
        // if it has something else.
        Registration: string;
        IcaoType: string;
        TypeDescription: string;
        Species: string;
        Wtc: string;
        CivilMil: boolean;
        Interesting: boolean;
        Highlight: boolean;

        // Sorting information
        SortPos: number;
        SortValue: number;

        DataSource: string;
        IsFiltered: boolean;
        FlightAwareLink: string;

        Destroy(): void;
        UpdateTick(receiverTimestamp: number, lastTimestamp: number): void;
        UpdateData(receiverTimestamp: number, data: IJsonData): void;
        UpdateTrack(receiverTimestamp: number, lastTimestamp: number): void;
        UpdateMarker(moved: boolean): void;
        UpdateLines(): void;
        ClearLines(): void;
    }

    /**
     * One segment of an aircraft track.
     */
    interface ITrackSegment {
        Altitude: number;
        Estimated: boolean;
        Line: L.Polyline;
        Ground: boolean;
        UpdateTime: number;
    }

    /**
     * A data record for an single aircraft we receive from readsb backend service.
     * Not in camel-case to match with JSON records from readsb and stay compatible with dump1090-fa.
     */
    export interface IJsonData {
        alt_baro?: number;
        alt_geom?: number;
        gs?: number;
        ias?: number;
        tas?: number;
        track?: number;
        track_rate?: number;
        mag_heading?: number;
        true_heading?: number;
        mach?: number;
        roll?: number;
        nav_heading?: number;
        nav_modes?: string[];
        nac_p?: number;
        nac_v?: number;
        nic_baro?: number;
        sil_type?: string;
        sil?: number;
        nav_qnh?: number;
        baro_rate?: number;
        geom_rate?: number;
        rc?: number;
        squawk?: string;
        category?: string;
        version?: number;
        type?: string;
        hex?: string;
        flight?: string;
        lat?: number;
        lon?: number;
        messages?: number;
        rssi?: number;
        seen?: number;
        emergency?: string;
        mlat?: string[];
        tisb?: string[];
        seen_pos?: number;
        nav_altitude_fms?: number;
        nav_altitude_mcp?: number;
        alert?: number;
        spi?: number;
    }

    /**
     * A JSON record of aircraft history data.
     */
    export interface IHistoryData {
        now: number;
        messages: number;
        aircraft: IJsonData[];
    }

    /**
     * A complete JSON record of incoming aircraft data.
     */
    export interface IAircraftData {
        now: number;
        messages: number;
        aircraft: IJsonData[];
    }

    /**
     * Aircraft message count history.
     */
    interface IMessageCountHistory {
        time: number;
        messages: number;
    }

    /**
     * The coloring of aircraft by altitude
     */
    export interface IColorByAlt {
        Unknown: { h: number, s: number, l: number };
        Ground: { h: number, s: number, l: number };
        Air: {
            h: Array<{ alt: number, val: number }>,
            s: number,
            l: number,
        };
        Selected: { h: number, s: number, l: number };
        Stale: { h: number, s: number, l: number };
        Mlat: { h: number, s: number, l: number };
        IsDefault?: boolean;
    }

    /**
     * Describes an aircraft filter.
     */
    export interface IAircraftFilter {
        IsActive: boolean;
        Value1: any;
        Value2: any;
        Type: eAircraftFilterType;
        MatchType: eFilterMatchType;
        Label: string;
        I18n: string;
        MinValue?: number;
        MaxValue?: number;
        DecimalPlaces?: number;
        InputWidth?: eInputWidth;
        Condition: eCondition;
        FilterConditions: eCondition[];
        EnumValues?: any[];
        Validate?(): void;
        IsFiltered?(aircraft: IAircraft): boolean;
    }

    /**
     * Aircraft database entry.
     */
    export interface IAircraftDatabase {
        [key: string]: {
            d: string;
            f: string;
            r: string;
            t: string;
        };
    }

    /**
     * Operator database entry.
     */
    export interface IOperatorDatabase {
        [key: string]: {
            n: string;
            c: string;
            r: string;
        };
    }

    /**
     * Aircraft type database entry.
     */
    export interface ITypeDatabase {
        [key: string]: {
            desc: string;
            wtc: string;
        };
    }

    /**
     * Structure of receiver.json
     */
    export interface IReceiverJson {
        version: string;
        refresh: number;
        history: number;
        lat: number;
        lon: number;
    }
}
