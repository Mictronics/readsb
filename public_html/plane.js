// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// plane.js: Class for single plane object.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This code is based on a detached fork of dump1090-fa.
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
// Declare ICAO registration address ranges and Country

import {
  ColorByAlt,
  OutlineADSBColor,
  OutlineMlatColor,
  ShowHoverOverLabels,
} from './config.js';
import { GetAircraftData, GetOperator } from './database.js';
import * as Filter from './filters.js';
import FindIcaoRange from './flags.js';
import './formatter.js';
import { GetBaseMarker, SvgPathToUri } from './markers.js';
import './ol3/ol.js';
import RegistrationFromHexId from './registrations.js';
import {
  MapSettings,
  PlaneIconFeatures,
  PlaneTrailFeatures,
  SelectedAllPlanes,
  SelectedPlane,
  SelectPlaneByHex,
  SitePosition,
  SpecialSquawks,
} from './script.js';

export default class Plane {
  constructor(icao) {
    // Info about the plane
    this.icao = icao;
    this.icaorange = FindIcaoRange(icao);
    this.flight = null;
    this.squawk = null;
    this.selected = false;
    this.category = null;
    this.operator = null;
    this.callsign = null;

    // Basic location information
    this.altitude = null;
    this.alt_baro = null;
    this.alt_geom = null;

    this.speed = null;
    this.gs = null;
    this.ias = null;
    this.tas = null;

    this.track = null;
    this.track_rate = null;
    this.mag_heading = null;
    this.true_heading = null;
    this.mach = null;
    this.roll = null;
    this.nav_altitude = null;
    this.nav_heading = null;
    this.nav_modes = null;
    this.nav_qnh = null;
    this.rc = null;
    this.nac_p = null;
    this.nac_v = null;
    this.nic_baro = null;
    this.sil_type = null;
    this.sil = null;

    this.baro_rate = null;
    this.geom_rate = null;
    this.vert_rate = null;

    this.version = null;

    this.prev_position = null;
    this.prev_position_time = null;
    this.position = null;
    this.position_from_mlat = false;
    this.sitedist = null;

    // Data packet numbers
    this.messages = null;
    this.rssi = null;

    // Track history as a series of line segments
    this.elastic_feature = null;
    this.track_linesegs = [];
    this.HistorySize = 0;

    // When was this last updated (receiver timestamp)
    this.last_message_time = null;
    this.last_position_time = null;

    // When was this last updated (seconds before last update)
    this.seen = null;
    this.seen_pos = null;

    // Display info
    this.visible = true;
    this.marker = null;
    this.markerStyle = null;
    this.markerIcon = null;
    this.markerStaticStyle = null;
    this.markerStaticIcon = null;
    this.markerStyleKey = null;
    this.markerSvgKey = null;

    // start from a computed registration, let the DB override it
    // if it has something else.
    this.registration = RegistrationFromHexId(this.icao);
    this.icaotype = null;
    this.typeDescription = null;
    this.species = null;
    this.wtc = null;
    this.civilmil = null;
    this.interesting = null;
    this.highlight = false;

    // request metadata
    GetAircraftData(this);

    if (this.selected) {
      this.RefreshSelected();
    }
  }

  // Appends data to the running track so we can get a visual tail on the plane
  // Only useful for a long running browser session.
  UpdateTrack(receiverTimestamp, lastTimestamp) {
    if (!this.position) {
      return false;
    }
    if (
      this.prev_position
      && this.position[0] === this.prev_position[0]
      && this.position[1] === this.prev_position[1]
    ) {
      return false;
    }

    const projHere = ol.proj.fromLonLat(this.position);
    let projPrev;
    let prevTime;
    if (this.prev_position === null) {
      projPrev = projHere;
      prevTime = this.last_position_time;
    } else {
      projPrev = ol.proj.fromLonLat(this.prev_position);
      prevTime = this.prev_position_time;
    }

    this.prev_position = this.position;
    this.prev_position_time = this.last_position_time;

    if (this.track_linesegs.length === 0) {
      // Brand new track
      const newseg = {
        fixed: new ol.geom.LineString([projHere]),
        feature: null,
        update_time: this.last_position_time,
        estimated: false,
        ground: this.altitude === 'ground',
        altitude: this.altitude,
      };
      this.track_linesegs.push(newseg);
      this.HistorySize += 1;
      return true;
    }

    let lastseg = this.track_linesegs[this.track_linesegs.length - 1];

    // Determine if track data are intermittent/stale
    // Time difference between two position updates should not be much
    // greater than the difference between data inputs
    // MLAT data are given some more leeway
    const timeDifference = this.last_position_time - prevTime - (receiverTimestamp - lastTimestamp);
    const staleTimeout = this.position_from_mlat ? 30 : 5;
    let estTrack = timeDifference > staleTimeout;

    // Also check if the position was already stale when it was exported by readsb
    // Makes stale check more accurate for history points spaced 30 seconds apart
    estTrack = estTrack || receiverTimestamp - this.last_position_time > staleTimeout;

    if (estTrack) {
      if (!lastseg.estimated) {
        // >5s gap in data, create a new estimated segment
        lastseg.fixed.appendCoordinate(projPrev);
        this.track_linesegs.push({
          fixed: new ol.geom.LineString([projPrev]),
          feature: null,
          update_time: prevTime,
          altitude: 0,
          estimated: true,
        });
        this.HistorySize += 2;
      } else {
        // Keep appending to the existing dashed line; keep every point
        lastseg.fixed.appendCoordinate(projPrev);
        lastseg.update_time = prevTime;
        this.HistorySize += 1;
      }

      return true;
    }

    if (lastseg.estimated) {
      // We are back to good data (we got two points close in time), switch back to
      // solid lines.
      lastseg.fixed.appendCoordinate(projPrev);
      lastseg = {
        fixed: new ol.geom.LineString([projPrev]),
        feature: null,
        update_time: prevTime,
        estimated: false,
        ground: this.altitude === 'ground',
        altitude: this.altitude,
      };
      this.track_linesegs.push(lastseg);
      this.HistorySize += 2;
      return true;
    }

    if (
      (lastseg.ground && this.altitude !== 'ground')
      || (!lastseg.ground && this.altitude === 'ground')
      || this.altitude !== lastseg.altitude
    ) {
      // Create a new segment as the ground state changed.
      // assume the state changed halfway between the two points
      // FIXME needs reimplementing post-google

      lastseg.fixed.appendCoordinate(projPrev);
      this.track_linesegs.push({
        fixed: new ol.geom.LineString([projPrev]),
        feature: null,
        update_time: prevTime,
        estimated: false,
        altitude: this.altitude,
        ground: this.altitude === 'ground',
      });
      this.HistorySize += 2;
      return true;
    }

    // Add more data to the existing track.
    // We only retain some historical points, at 5+ second intervals,
    // plus the most recent point
    if (prevTime - lastseg.update_time >= 5) {
      // enough time has elapsed; retain the last point and add a new one
      lastseg.fixed.appendCoordinate(projPrev);
      lastseg.update_time = prevTime;
      this.HistorySize += 1;
    }

    return true;
  }

  GetIsFiltered() {
    if (!Filter.IsFilterEnabled()) {
      this.highlight = false;
      return false;
    }

    let isFiltered = true;
    this.highlight = false;

    for (let i = 0; i < Filter.AircraftFilterHandlers.length; i += 1) {
      isFiltered = Filter.AircraftFilterHandlers[i].IsFiltered(this);
      if (isFiltered === true) {
        break; // At least one filter matches, filter out this aircraft
      }
    }

    if (Filter.IsHighlightEnabled()) {
      if (isFiltered === false) {
        this.highlight = true;
      }
      isFiltered = false;
    }
    return isFiltered;
  }

  // This is to remove the line from the screen if we deselect the plane
  ClearLines() {
    for (let i = this.track_linesegs.length - 1; i >= 0; i -= 1) {
      const seg = this.track_linesegs[i];
      if (seg.feature !== null) {
        PlaneTrailFeatures.remove(seg.feature);
        seg.feature = null;
      }
    }

    if (this.elastic_feature !== null) {
      PlaneTrailFeatures.remove(this.elastic_feature);
      this.elastic_feature = null;
    }
  }

  GetDataSource() {
    // MLAT
    if (this.position_from_mlat) {
      return 'mlat';
    }

    // Not MLAT, but position reported - ADSB or variants
    if (this.position !== null) {
      return this.addrtype;
    }

    // Otherwise Mode S
    return 'mode_s';
  }

  GetMarkerColor() {
    // Emergency squawks override everything else
    if (this.squawk in SpecialSquawks) return SpecialSquawks[this.squawk].markerColor;

    let h;
    let s;
    let l;

    const colorArr = this.GetAltitudeColor();

    [h, s, l] = colorArr;

    // If we have not seen a recent position update, change color
    if (this.seen_pos > 15) {
      h += ColorByAlt.stale.h;
      s += ColorByAlt.stale.s;
      l += ColorByAlt.stale.l;
    }

    // If this marker is selected, change color
    if (this.selected && !SelectedAllPlanes) {
      h += ColorByAlt.selected.h;
      s += ColorByAlt.selected.s;
      l += ColorByAlt.selected.l;
    }

    // If this marker is a mlat position, change color
    if (this.position_from_mlat) {
      h += ColorByAlt.mlat.h;
      s += ColorByAlt.mlat.s;
      l += ColorByAlt.mlat.l;
    }

    if (h < 0) {
      h = (h % 360) + 360;
    } else if (h >= 360) {
      h %= 360;
    }

    if (s < 5) s = 5;
    else if (s > 95) s = 95;

    if (l < 5) l = 5;
    else if (l > 95) l = 95;
    return `hsl(${Math.round(h / 5) * 5},${Math.round(s / 5) * 5}%,${Math.round(
      l / 5,
    ) * 5}%)`;
  }

  GetAltitudeColor(altitude) {
    let h;
    let s;
    let l;

    if (typeof altitude === 'undefined') {
      ({ altitude } = this);
    }

    if (altitude === null) {
      ({ h } = ColorByAlt.unknown);
      ({ s } = ColorByAlt.unknown);
      ({ l } = ColorByAlt.unknown);
    } else if (altitude === 'ground') {
      ({ h } = ColorByAlt.ground);
      ({ s } = ColorByAlt.ground);
      ({ l } = ColorByAlt.ground);
    } else {
      ({ s } = ColorByAlt.air);
      ({ l } = ColorByAlt.air);

      // find the pair of points the current altitude lies between,
      // and interpolate the hue between those points
      const hpoints = ColorByAlt.air.h;
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

    if (s < 5) s = 5;
    else if (s > 95) s = 95;

    if (l < 5) l = 5;
    else if (l > 95) l = 95;

    return [h, s, l];
  }

  UpdateIcon() {
    const scaleFactor = Math.max(
      0.2,
      Math.min(1.2, 0.15 * 1.25 ** MapSettings.ZoomLvl),
    ).toFixed(1);

    const col = this.GetMarkerColor();
    const opacity = 1.0;
    const outline = this.position_from_mlat
      ? OutlineMlatColor
      : OutlineADSBColor;
    const addStroke = this.selected && !SelectedAllPlanes
      ? ' stroke="black" stroke-width="1px"'
      : '';
    const baseMarker = GetBaseMarker(
      this.category,
      this.icaotype,
      this.species,
      this.wtc,
    );
    let rotation = this.track;
    if (rotation === null) {
      rotation = this.true_heading;
    }
    if (rotation === null) {
      rotation = this.mag_heading;
    }
    if (rotation === null) {
      rotation = 0;
    }
    // var transparentBorderWidth = (32 / baseMarker.scale / scaleFactor).toFixed(1);

    const svgKey = `${col}!${outline}!${baseMarker.svg}!${addStroke}!${scaleFactor}`;
    const styleKey = `${opacity}!${rotation}`;

    if (
      this.markerStyle === null
      || this.markerIcon === null
      || this.markerSvgKey !== svgKey
    ) {
      // console.log(this.icao + " new icon and style " + this.markerSvgKey + " -> " + svgKey);

      const icon = new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 1.2 * scaleFactor,
        imgSize: baseMarker.size,
        src: SvgPathToUri(baseMarker.svg, outline, col, addStroke),
        rotation: baseMarker.noRotate ? 0 : (rotation * Math.PI) / 180.0,
        opacity,
        rotateWithView: !baseMarker.noRotate,
      });

      this.markerIcon = icon;
      this.markerStyle = new ol.style.Style({
        image: this.markerIcon,
      });
      this.markerStaticIcon = null;
      this.markerStaticStyle = new ol.style.Style({});

      this.markerStyleKey = styleKey;
      this.markerSvgKey = svgKey;

      if (this.marker !== null) {
        this.marker.setStyle(this.markerStyle);
        this.markerStatic.setStyle(this.markerStaticStyle);
      }
    }

    if (this.markerStyleKey !== styleKey) {
      // console.log(this.icao + " new rotation");
      this.markerIcon.setRotation((rotation * Math.PI) / 180.0);
      this.markerIcon.setOpacity(opacity);
      if (this.staticIcon) {
        this.staticIcon.setOpacity(opacity);
      }
      this.markerStyleKey = styleKey;
    }

    return true;
  }

  // Update our data
  UpdateData(receiverTimestamp, data) {
    // Update all of our data
    this.messages = data.messages;
    this.rssi = data.rssi;
    this.last_message_time = receiverTimestamp - data.seen;

    // simple fields

    const fields = [
      'alt_baro',
      'alt_geom',
      'gs',
      'ias',
      'tas',
      'track',
      'track_rate',
      'mag_heading',
      'true_heading',
      'mach',
      'roll',
      'nav_heading',
      'nav_modes',
      'nac_p',
      'nac_v',
      'nic_baro',
      'sil_type',
      'sil',
      'nav_qnh',
      'baro_rate',
      'geom_rate',
      'rc',
      'squawk',
      'category',
      'version',
    ];

    for (let i = 0; i < fields.length; i += 1) {
      if (fields[i] in data) {
        this[fields[i]] = data[fields[i]];
      } else {
        this[fields[i]] = null;
      }
    }

    // fields with more complex behaviour

    if ('type' in data) this.addrtype = data.type;
    else this.addrtype = 'adsb_icao';

    // don't expire callsigns
    if ('flight' in data) this.flight = data.flight;

    if ('lat' in data && 'lon' in data) {
      this.position = [data.lon, data.lat];
      this.last_position_time = receiverTimestamp - data.seen_pos;

      if (SitePosition() !== null) {
        this.sitedist = ol.sphere.getDistance(
          SitePosition(),
          this.position,
          6378137,
        );
      }

      this.position_from_mlat = false;
      if (typeof data.mlat !== 'undefined') {
        for (let i = 0; i < data.mlat.length; i += 1) {
          if (data.mlat[i] === 'lat' || data.mlat[i] === 'lon') {
            this.position_from_mlat = true;
            break;
          }
        }
      }
    }
    if (typeof data.flight !== 'undefined') {
      this.flight = data.flight;
      if (this.callsign === null && this.operator === null) {
        GetOperator(this);
      }
    }

    if (typeof data.squawk !== 'undefined') this.squawk = data.squawk;
    if (typeof data.category !== 'undefined') this.category = data.category;

    // Pick an altitude
    if ('alt_baro' in data) {
      this.altitude = data.alt_baro;
    } else if ('alt_geom' in data) {
      this.altitude = data.alt_geom;
    } else {
      this.altitude = null;
    }

    // Pick a selected altitude
    if ('nav_altitude_fms' in data) {
      this.nav_altitude = data.nav_altitude_fms;
    } else if ('nav_altitude_mcp' in data) {
      this.nav_altitude = data.nav_altitude_mcp;
    } else {
      this.nav_altitude = null;
    }

    // Pick vertical rate from either baro or geom rate
    // geometric rate is generally more reliable (smoothed etc)
    if ('geom_rate' in data) {
      this.vert_rate = data.geom_rate;
    } else if ('baro_rate' in data) {
      this.vert_rate = data.baro_rate;
    } else {
      this.vert_rate = null;
    }

    // Pick a speed
    if ('gs' in data) {
      this.speed = data.gs;
    } else if ('tas' in data) {
      this.speed = data.tas;
    } else if ('ias' in data) {
      this.speed = data.ias;
    } else {
      this.speed = null;
    }
  }

  UpdateTick(receiverTimestamp, lastTimestamp) {
    // recompute seen and seen_pos
    this.seen = receiverTimestamp - this.last_message_time;
    this.seen_pos = this.last_position_time === null
      ? null
      : receiverTimestamp - this.last_position_time;

    // If no packet in over 58 seconds, clear the plane.
    if (this.seen > 58) {
      if (this.visible) {
        // console.log("hiding " + this.icao);
        this.ClearMarker();
        this.visible = false;
        if (SelectedPlane === this.icao) SelectPlaneByHex(null, false);
      }
    } else if (
      this.position !== null
      && (this.selected || this.seen_pos < 60)
    ) {
      this.visible = true;
      if (this.UpdateTrack(receiverTimestamp, lastTimestamp)) {
        this.UpdateLines();
        this.UpdateMarker(true);
      } else {
        this.UpdateMarker(false); // didn't move
      }
    } else {
      this.ClearMarker();
      this.visible = false;
    }
  }

  ClearMarker() {
    if (this.marker) {
      PlaneIconFeatures.remove(this.marker);
      PlaneIconFeatures.remove(this.markerStatic);
      this.marker = null;
      this.markerStatic = null;
    }
  }

  // Update our marker on the map
  UpdateMarker(moved) {
    if (!this.visible || this.position === null || this.GetIsFiltered()) {
      this.ClearMarker();
      return;
    }

    this.UpdateIcon();
    if (this.marker) {
      if (moved) {
        this.marker.setGeometry(
          new ol.geom.Point(ol.proj.fromLonLat(this.position)),
        );
        this.markerStatic.setGeometry(
          new ol.geom.Point(ol.proj.fromLonLat(this.position)),
        );
      }
    } else {
      if (ShowHoverOverLabels) {
        const myPopUpName = '~';
        this.marker = new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat(this.position)),
          name: myPopUpName,
        });
      } else {
        this.marker = new ol.Feature(
          new ol.geom.Point(ol.proj.fromLonLat(this.position)),
        );
      }
      this.marker.hex = this.icao;
      this.marker.setStyle(this.markerStyle);
      PlaneIconFeatures.push(this.marker);

      this.markerStatic = new ol.Feature(
        new ol.geom.Point(ol.proj.fromLonLat(this.position)),
      );
      this.markerStatic.hex = this.icao;
      this.markerStatic.setStyle(this.markerStaticStyle);
      PlaneIconFeatures.push(this.markerStatic);
    }
  }

  // return the styling of the lines based on altitude
  AltitudeLines(altitude) {
    const colorArr = this.GetAltitudeColor(altitude);
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: `hsl(${(colorArr[0] / 5).toFixed(0) * 5},${(
          colorArr[1] / 5
        ).toFixed(0) * 5}%,${(colorArr[2] / 5).toFixed(0) * 5}%)`,
        width: 2,
      }),
    });
  }

  // Update our planes tail line,
  UpdateLines() {
    if (!this.selected) return;

    if (this.track_linesegs.length === 0) return;

    const estimateStyle = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#a08080',
        width: 1.5,
        lineDash: [3, 3],
      }),
    });

    // find the old elastic band so we can replace it in place
    // (which should be faster than remove-and-add when PlaneTrailFeatures is large)
    let oldElastic = -1;
    if (this.elastic_feature !== null) {
      oldElastic = PlaneTrailFeatures.getArray().indexOf(this.elastic_feature);
    }

    // create the new elastic band feature
    const lastseg = this.track_linesegs[this.track_linesegs.length - 1];
    const lastfixed = lastseg.fixed.getCoordinateAt(1.0);
    const geom = new ol.geom.LineString([
      lastfixed,
      ol.proj.fromLonLat(this.position),
    ]);
    this.elastic_feature = new ol.Feature(geom);
    if (lastseg.estimated) {
      this.elastic_feature.setStyle(estimateStyle);
    } else {
      this.elastic_feature.setStyle(this.AltitudeLines(lastseg.altitude));
    }
    if (oldElastic < 0) {
      PlaneTrailFeatures.push(this.elastic_feature);
    } else {
      PlaneTrailFeatures.setAt(oldElastic, this.elastic_feature);
    }

    // create any missing fixed line features
    for (let i = 0; i < this.track_linesegs.length; i += 1) {
      const seg = this.track_linesegs[i];
      if (seg.feature === null) {
        seg.feature = new ol.Feature(seg.fixed);
        if (seg.estimated) {
          seg.feature.setStyle(estimateStyle);
        } else {
          seg.feature.setStyle(this.AltitudeLines(seg.altitude));
        }

        PlaneTrailFeatures.push(seg.feature);
      }
    }
  }

  Destroy() {
    this.ClearLines();
    this.ClearMarker();
  }
} // End Plane class
