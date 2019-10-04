// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// leaflet.readsb.d.ts: Extended Typescript definitions for leaflet.
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

/// <reference path="leaflet.d.ts" />
declare namespace L {
    /**
     * Grouped layers type
     */
    export type LayerType = "base" | "overlay";

    /**
     * Grouped layers group identification
     */
    export interface GroupedLayersGroup {
        name: string;
        id: number;
    }

    /**
     * Extended options for layers used by GroupedLayers control.
     */
    export interface ExtLayerOptions extends LayerOptions {
        name: string; // Layer name, for comparison
        type: LayerType; // Layer type of "base" or "overlay"
        title: string; // Layer title, shown in control
        isActive: boolean; // Layer is active and should be added to map on load
        group?: GroupedLayersGroup; // Group information for GroupedLayers control
        apiKey?: string; // API key, e.g. for SkyVector
        dateTime?: string; // Date string, e.g. for SkyVector
    }

    /**
     * Extended WMS layer parameters
     */
    export interface ExtWMSParams extends WMSParams {
        validTime?: number; // DWD Radolan valitity time
    }

    /**
     * Leaflet layer class by default doesn't expose layer options.
     */
    export class ExtLayer extends Layer {
        options: LayerOptions;
    }

    /**
     * Options for Control.GroupedLayers
     */
    export interface GroupedLayersOptions extends ControlOptions {
        collapsed?: boolean;
        position?: ControlPosition;
        autoZIndex?: boolean;
        onClickCallback?: DomEvent.EventHandlerFn;
    }

    /**
     * A collection of grouped layers with specific group name.
     */
    export interface GroupedLayersCollection {
        [key: string]: L.Layer[];
    }

    /**
     * Options for Control.Button
     */
    export interface ButtonOptions extends ControlOptions {
        text?: string;
        position?: ControlPosition;
        callback: DomEvent.EventHandlerFn;
        classes?: string[] | string;
        title?: string;
    }

    /**
     * Extend the leaflet control by our two custom controls.
     */
    export namespace control {
        function button(options?: ButtonOptions): Control.Button;
        function groupedLayers(layers: GroupedLayersCollection, options?: GroupedLayersOptions): Control.GroupedLayers;
    }

    /**
     * Declare our two custom control classes in leaflet.
     */
    export namespace Control {
        /**
         * Class creating custom Button object with specific.
         */
        class Button extends Control {
            constructor(options?: ButtonOptions);
            options: ButtonOptions;
        }
        /**
         * Class creating the GroupedLayers selector.
         */
        class GroupedLayers extends Control {
            constructor(layers: GroupedLayersCollection, options?: GroupedLayersOptions);
            options: GroupedLayersOptions;
            update(): void;
        }
    }

    /**
     * Aircraft marker options.
     */
    export interface AircraftMarkerOptions extends MarkerOptions {
        anchor?: PointExpression;
        scale?: number;
        icao: string,
        imgSize?: [number, number],
        rotation?: number;
        rotateWithView?: boolean;
    }

    /**
     * Class creating an aircraft marker. Extends L.Marker.
     */
    export class AircraftMarker extends Marker {
        constructor(options?: AircraftMarkerOptions);
        SetLatLngScaleRotation(latlng: LatLng, scale: number, rotation: number): void;
        SelectAlertIdent(selected: boolean, alert: boolean, ident: boolean): void;
    }

    export function aircraftMarker(latlng: LatLngExpression, options: AircraftMarkerOptions): AircraftMarker;
}
