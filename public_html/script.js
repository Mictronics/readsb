// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// script.js: Main web application functions.
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
  ShowHoverOverLabels,
  DefaultCenterLat,
  DefaultCenterLon,
  DefaultDisplayUnits,
  DefaultZoomLvl,
  FlagPath,
  PlaneCountInTitle,
  MessageRateInTitle,
  PageName,
  ShowAdditionalData,
  ShowFlags,
  SiteCircles,
  SiteCirclesDistances,
  SiteLat,
  SiteLon,
  SiteShow,
} from './config.js';
import {
  DatabaseInit,
  ExportDB,
  ImportDB,
  GetSetting,
  PutSetting,
  GetAircraftData,
  PutAircraftData,
} from './database.js';
import {
  InitializeFilters,
  RefreshFilterList,
  RestoreSessionFilters,
} from './filters.js';
import {
  ConvertAltitude,
  FormatAltitudeBrief,
  FormatAltitudeLong,
  FormatDataSource,
  FormatDistanceBrief,
  FormatDistanceLong,
  FormatDistanceShort,
  FormatLatLong,
  FormatNacP,
  FormatNacV,
  FormatSpeedBrief,
  FormatSpeedLong,
  FormatTrackBrief,
  FormatTrackLong,
  FormatVerticalRateBrief,
  FormatVerticalRateLong,
  GetUnitLabel,
} from './formatter.js';
import CreateBaseLayers from './layers.js';
import Plane from './plane.js';
import './ol3/ol.js';
import MapControls from './ol3/ol-controls.js';
import './ol3/ol3-layerswitcher.js';

// Define our global variables
let EditAircraftDialog = null;
let OLMap = null;
const StaticFeatures = new ol.Collection();
const SiteCircleFeatures = new ol.Collection();
export const PlaneIconFeatures = new ol.Collection();
export const PlaneTrailFeatures = new ol.Collection();
const Planes = {};
let PlanesOrdered = [];
let selectedPlane = null;
export const SelectedPlane = () => selectedPlane;
let selectedAllPlanes = false;
export const SelectedAllPlanes = () => selectedAllPlanes;
let FollowSelected = false;
const infoBoxOriginalPosition = {};
let customAltitudeColors = true;

// Set the name of the hidden property and the change event for visibility
let hidden;
if (typeof document.hidden !== 'undefined') {
  // Opera 12.10 and Firefox 18 and later support
  hidden = 'hidden';
} else if (typeof document.msHidden !== 'undefined') {
  hidden = 'msHidden';
} else if (typeof document.webkitHidden !== 'undefined') {
  hidden = 'webkitHidden';
}

export const SpecialSquawks = {
  7500: {
    cssClass: 'squawk7500',
    markerColor: 'rgb(255, 85, 85)',
    text: 'Aircraft Hijacking',
  },
  7600: {
    cssClass: 'squawk7600',
    markerColor: 'rgb(0, 255, 255)',
    text: 'Radio Failure',
  },
  7700: {
    cssClass: 'squawk7700',
    markerColor: 'rgb(255, 255, 0)',
    text: 'General Emergency',
  },
  '0020': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(227, 200, 0)',
    text: 'Rettungshubschrauber',
  },
  '0023': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(0, 80, 239)',
    text: 'Bundespolizei',
  },
  '0025': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(243, 156, 18)',
    text: 'Absetzluftfahrzeug',
  },
  '0027': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(243, 156, 18)',
    text: 'Kunstflug',
  },
  '0030': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(243, 156, 18)',
    text: 'Vermessung',
  },
  '0031': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(243, 156, 18)',
    text: 'Open Skies',
  },
  '0033': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(0, 138, 0)',
    text: 'VFR Militär 550ftAGL <FL100',
  },
  '0034': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(243, 156, 18)',
    text: 'SAR Einsatz',
  },
  '0036': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(0, 80, 239)',
    text: 'Polizei Einsatz',
  },
  '0037': {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(0, 80, 239)',
    text: 'Polizei BIV',
  },
  1600: {
    cssClass: 'squawkSpecialDE',
    markerColor: 'rgb(0, 138, 0)',
    text: 'Militär Tieflug <500ft',
  },
};

let ReadsbVersion = 'unknown version';
let RefreshInterval = 1000;

let PlaneRowTemplate = null;

let TrackedAircraft = 0;
let TrackedAircraftPositions = 0;
let TrackedAircraftUnknown = 0;
let TrackedHistorySize = 0;

let sitePosition = null;
export const SitePosition = () => sitePosition;
let siteShow = SiteShow;
let siteLat = SiteLon;
let siteLon = SiteLat;
let defaultCenterLat = DefaultCenterLat;
let defaultCenterLon = DefaultCenterLon;

// Current map settings
export const MapSettings = {
  CenterLat: defaultCenterLat,
  CenterLon: defaultCenterLon,
  ZoomLvl: DefaultZoomLvl,
  MapType: 'osm',
  VisibleLayers: {
    layer_site_pos: true,
    layer_ac_trail: true,
    layer_ac_positions: true,
  },
  DisplayUnits: DefaultDisplayUnits,
  AltitudeChart: true,
};

let LastReceiverTimestamp = 0;
let StaleReceiverCount = 0;
let FetchPending = null;

let MessageCountHistory = [];
let MessageRate = 0;

const NBSP = '\u00a0';

let layers;

function SetSelectedInfoBlockVisibility() {
  let selected = false;
  const mapIsVisible = $('#map_container').is(':visible');
  const planeSelected = typeof selectedPlane !== 'undefined'
    && selectedPlane !== null
    && selectedPlane !== 'ICAO';

  selected = Planes[selectedPlane];

  if (planeSelected && mapIsVisible && selected && selected.visible) {
    $('#selected_infoblock').show();
  } else {
    $('#selected_infoblock').hide();
  }
}

function UpdateMapSize() {
  OLMap.updateSize();
}

function ShowColumn(table, columnId, visible) {
  const index = $(columnId).index();
  if (index >= 0) {
    const cells = $(table).find(`td:nth-child(${(index + 1).toString()})`);
    if (visible) {
      cells.show();
    } else {
      cells.hide();
    }
  }
}

function SetColumnVisibility() {
  const mapIsVisible = $('#map_container').is(':visible');
  const infoTable = $('#tableinfo');

  ShowColumn(infoTable, '#registration', !mapIsVisible);
  ShowColumn(infoTable, '#aircraft_type', !mapIsVisible);
  ShowColumn(infoTable, '#vert_rate', !mapIsVisible);
  ShowColumn(infoTable, '#rssi', !mapIsVisible);
  ShowColumn(infoTable, '#lat', !mapIsVisible);
  ShowColumn(infoTable, '#lon', !mapIsVisible);
  ShowColumn(infoTable, '#data_source', !mapIsVisible);
}

function ShowMap() {
  $('#map_container').show();
  $('#toggle_sidebar_control').show();
  $('#splitter').show();
  $('#show_map_button').hide();
  $('#sidebar_container').width('500px');
  $('#accordion').accordion('option', 'active', false);
  SetColumnVisibility();
  SetSelectedInfoBlockVisibility();
  UpdateMapSize();
}

// Page Title update function
export function RefreshPageTitle() {
  if (!PlaneCountInTitle && !MessageRateInTitle) {
    document.title = PageName;
    return;
  }

  let subtitle = '';

  if (PlaneCountInTitle) {
    subtitle += `${TrackedAircraftPositions}/${TrackedAircraft}`;
  }

  if (MessageRateInTitle) {
    if (subtitle) subtitle += ' | ';
    subtitle += `${MessageRate.toFixed(1)}/s`;
  }

  document.title = `${PageName} - ${subtitle}`;
}

function GetFlightAwareIdentLink(ident) {
  if (ident !== null && ident !== '') {
    return `<a target="_blank" href="https://flightaware.com/live/flight/${ident.trim()}">${ident.trim()}</a>`;
  }

  return '';
}

// Refresh the detail window about the plane
export function RefreshSelected() {
  if (MessageCountHistory.length > 1) {
    const messageTimeDelta = MessageCountHistory[MessageCountHistory.length - 1].time
      - MessageCountHistory[0].time;
    const messageCountDelta = MessageCountHistory[MessageCountHistory.length - 1].messages
      - MessageCountHistory[0].messages;
    if (messageTimeDelta > 0) {
      MessageRate = messageCountDelta / messageTimeDelta;
    }
  } else {
    MessageRate = null;
  }

  RefreshPageTitle();

  let selected = false;
  if (
    typeof selectedPlane !== 'undefined'
    && selectedPlane !== 'ICAO'
    && selectedPlane !== null
  ) {
    selected = Planes[selectedPlane];
  }

  $('#readsb_version').text(ReadsbVersion);
  $('#readsb_total_ac').text(`${TrackedAircraft}/${TrackedAircraftUnknown}`);
  $('#readsb_total_ac_positions').text(TrackedAircraftPositions);
  $('#readsb_total_history').text(TrackedHistorySize);

  if (MessageRate !== null) {
    $('#readsb_message_rate').text(MessageRate.toFixed(1));
  } else {
    $('#readsb_message_rate').text('n/a');
  }

  SetSelectedInfoBlockVisibility();

  if (!selected) {
    return;
  }

  if (selected.flight !== null && selected.flight !== '') {
    $('#selected_flightid').html(GetFlightAwareIdentLink(selected.flight));
  } else {
    $('#selected_flightid').text('n/a');
  }

  if (selected.operator !== null) {
    $('#selected_operator').text(selected.operator);
    $('#infoblock_operator').removeClass('hidden');
  } else {
    $('#infoblock_operator').addClass('hidden');
  }

  if (selected.callsign !== null && selected.callsign !== '') {
    $('#selected_callsign').text(selected.callsign);
    $('#infoblock_callsign').removeClass('hidden');
  } else {
    $('#infoblock_callsign').addClass('hidden');
  }

  if (selected.registration !== null) {
    $('#selected_registration').text(selected.registration);
  } else {
    $('#selected_registration').text('');
  }

  if (selected.icaotype !== null) {
    $('#selected_icaotype').text(selected.icaotype);
  } else {
    $('#selected_icaotype').text('');
  }

  if (selected.typeDescription !== null) {
    $('#selected_desc').text(selected.typeDescription);
    $('#selected_icaotype').text('');
  } else {
    $('#selected_desc').text('');
  }

  const emerg = document.getElementById('selected_emergency');
  if (selected.squawk in SpecialSquawks) {
    emerg.className = SpecialSquawks[selected.squawk].cssClass;
    emerg.textContent = `${NBSP}Squawking: ${
      SpecialSquawks[selected.squawk].text
    }${NBSP}`;
  } else {
    emerg.className = 'hidden';
  }

  $('#selected_altitude').text(
    FormatAltitudeLong(
      selected.altitude,
      selected.vert_rate,
      MapSettings.DisplayUnits,
    ),
  );

  if (selected.squawk === null || selected.squawk === '0000') {
    $('#selected_squawk').text('n/a');
  } else {
    $('#selected_squawk').text(selected.squawk);
  }

  $('#selected_icao')
    .text(selected.icao.toUpperCase())
    .attr('href', `https://www.planespotters.net/search?q=${selected.icao}`);

  $('#selected_speed_gs').text(
    FormatSpeedLong(selected.gs, MapSettings.DisplayUnits),
  );
  $('#selected_vertical_rate').text(
    FormatVerticalRateLong(selected.vert_rate, MapSettings.DisplayUnits),
  );
  $('#selected_track').text(FormatTrackLong(selected.track));

  if (selected.seen <= 1) {
    $('#selected_seen').text('now');
  } else {
    $('#selected_seen').text(`${selected.seen.toFixed(1)}s`);
  }

  if (selected.civilmil !== null) {
    if (selected.civilmil === true) {
      $('#selected_civilmil').text('Military');
    } else {
      $('#selected_civilmil').text('Civil');
    }
  } else {
    $('#selected_civilmil').text('Country of');
  }

  if (
    (selected.interesting !== null && selected.interesting === true)
    || selected.highlight === true
  ) {
    $('#infoblock_head').addClass('interesting');
  } else {
    $('#infoblock_head').removeClass('interesting');
  }

  $('#selected_country').text(selected.icaorange.Country);
  if (ShowFlags && selected.icaorange.FlagImage !== null) {
    $('#selected_flag').removeClass('hidden');
    $('#selected_flag img').attr(
      'src',
      FlagPath + selected.icaorange.FlagImage,
    );
    $('#selected_flag img').attr('title', selected.icaorange.Country);
  } else {
    $('#selected_flag').addClass('hidden');
  }

  if (selected.position === null) {
    $('#selected_position').text('n/a');
    $('#selected_follow').addClass('hidden');
  } else {
    if (selected.seen_pos > 1) {
      $('#selected_position').text(FormatLatLong(selected.position));
    } else {
      $('#selected_position').text(FormatLatLong(selected.position));
    }

    $('#selected_follow').removeClass('hidden');
    if (FollowSelected) {
      $('#selected_follow').css('font-weight', 'bold');
      OLMap.getView().setCenter(ol.proj.fromLonLat(selected.position));
    } else {
      $('#selected_follow').css('font-weight', 'normal');
    }
  }

  $('#selected_source').text(FormatDataSource(selected.GetDataSource()));

  $('#selected_sitedist').text(
    FormatDistanceLong(selected.sitedist, MapSettings.DisplayUnits),
  );
  $('#selected_rssi').text(`${selected.rssi.toFixed(1)} dBFS`);
  $('#selected_message_count').text(selected.messages);

  $('#selected_altitude_geom').text(
    FormatAltitudeLong(
      selected.alt_geom,
      selected.geom_rate,
      MapSettings.DisplayUnits,
    ),
  );
  $('#selected_heading_mag').text(FormatTrackLong(selected.mag_heading));
  $('#selected_heading_true').text(FormatTrackLong(selected.true_heading));
  $('#selected_speed_ias').text(
    FormatSpeedLong(selected.ias, MapSettings.DisplayUnits),
  );
  $('#selected_speed_tas').text(
    FormatSpeedLong(selected.tas, MapSettings.DisplayUnits),
  );

  if (selected.mach === null) {
    $('#selected_speed_mach').text('n/a');
  } else {
    $('#selected_speed_mach').text(selected.mach.toFixed(3));
  }

  if (selected.roll === null) {
    $('#selected_roll').text('n/a');
  } else {
    $('#selected_roll').text(selected.roll.toFixed(1));
  }

  if (selected.track_rate === null) {
    $('#selected_track_rate').text('n/a');
  } else {
    $('#selected_track_rate').text(selected.track_rate.toFixed(2));
  }

  $('#selected_geom_rate').text(
    FormatVerticalRateLong(selected.geom_rate, MapSettings.DisplayUnits),
  );

  if (selected.nav_qnh === null) {
    $('#selected_nav_qnh').text('n/a');
  } else {
    $('#selected_nav_qnh').text(`${selected.nav_qnh.toFixed(1)} hPa`);
  }
  $('#selected_nav_altitude').text(
    FormatAltitudeLong(selected.nav_altitude, 0, MapSettings.DisplayUnits),
  );
  $('#selected_nav_heading').text(FormatTrackLong(selected.nav_heading));
  if (selected.nav_modes === null) {
    $('#selected_nav_modes').text('n/a');
  } else {
    $('#selected_nav_modes').text(selected.nav_modes.join());
  }
  if (selected.nic_baro === null) {
    $('#selected_nicbaro').text('n/a');
  } else if (selected.nic_baro === 1) {
    $('#selected_nicbaro').text('cross-checked');
  } else {
    $('#selected_nicbaro').text('not cross-checked');
  }

  $('#selected_nacp').text(FormatNacP(selected.nac_p));
  $('#selected_nacv').text(FormatNacV(selected.nac_v));
  if (selected.rc === null) {
    $('#selected_rc').text('n/a');
  } else if (selected.rc === 0) {
    $('#selected_rc').text('Unknown');
  } else {
    $('#selected_rc').text(
      FormatDistanceShort(selected.rc, MapSettings.DisplayUnits),
    );
  }

  if (selected.sil === null || selected.sil_type === null) {
    $('#selected_sil').text('n/a');
  } else {
    let sampleRate = '';
    let silDesc = '';
    if (selected.sil_type === 'perhour') {
      sampleRate = ' per flight hour';
    } else if (selected.sil_type === 'persample') {
      sampleRate = ' per sample';
    }

    switch (selected.sil) {
      case 0:
        silDesc = '&gt; 1×10<sup>-3</sup>';
        break;
      case 1:
        silDesc = '≤ 1×10<sup>-3</sup>';
        break;
      case 2:
        silDesc = '≤ 1×10<sup>-5</sup>';
        break;
      case 3:
        silDesc = '≤ 1×10<sup>-7</sup>';
        break;
      default:
        silDesc = 'n/a';
        sampleRate = '';
        break;
    }
    $('#selected_sil').html(silDesc + sampleRate);
  }

  if (selected.version === null) {
    $('#selected_adsb_version').text('none');
  } else if (selected.version === 0) {
    $('#selected_adsb_version').text('v0 (DO-260)');
  } else if (selected.version === 1) {
    $('#selected_adsb_version').text('v1 (DO-260A)');
  } else if (selected.version === 2) {
    $('#selected_adsb_version').text('v2 (DO-260B)');
  } else {
    $('#selected_adsb_version').text(`v${selected.version}`);
  }

  // Wind speed and direction
  if (
    selected.gs !== null
    && selected.tas !== null
    && selected.track !== null
    && selected.mag_heading !== null
  ) {
    selected.track = (selected.track || 0) * 1 || 0;
    selected.mag_heading = (selected.mag_heading || 0) * 1 || 0;
    selected.tas = (selected.tas || 0) * 1 || 0;
    selected.gs = (selected.gs || 0) * 1 || 0;
    const trk = (Math.PI / 180) * selected.track;
    const hdg = (Math.PI / 180) * selected.mag_heading;
    const ws = Math.round(
      Math.sqrt(
        Math.pow(selected.tas - selected.gs, 2)
          + 4
            * selected.tas
            * selected.gs
            * Math.pow(Math.sin((hdg - trk) / 2), 2),
      ),
    );
    let wd = trk
      + Math.atan2(
        selected.tas * Math.sin(hdg - trk),
        selected.tas * Math.cos(hdg - trk) - selected.gs,
      );
    if (wd < 0) {
      wd += 2 * Math.PI;
    }
    if (wd > 2 * Math.PI) {
      wd -= 2 * Math.PI;
    }
    wd = Math.round((180 / Math.PI) * wd);
    $('#selected_wind_speed').text(
      FormatSpeedLong(ws, MapSettings.DisplayUnits),
    );
    $('#selected_wind_direction').text(FormatTrackLong(wd));

    $('#wind_arrow').show();
    const C = Math.PI / 180;
    const arrowx1 = 20 - 12 * Math.sin(C * wd);
    const arrowx2 = 20 + 12 * Math.sin(C * wd);
    const arrowy1 = 20 + 12 * Math.cos(C * wd);
    const arrowy2 = 20 - 12 * Math.cos(C * wd);
    $('#wind_arrow').attr('x1', arrowx1);
    $('#wind_arrow').attr('x2', arrowx2);
    $('#wind_arrow').attr('y1', arrowy1);
    $('#wind_arrow').attr('y2', arrowy2);
  } else {
    $('#wind_arrow').hide();
    $('#selected_wind_speed').text('n/a');
    $('#selected_wind_direction').text('n/a');
  }
}

// deselect all the planes
export function DeselectAllPlanes() {
  Object.keys(Planes).forEach((key) => {
    Planes[key].selected = false;
    Planes[key].ClearLines();
    Planes[key].UpdateMarker(false);
    $(Planes[key].tr).removeClass('selected');
  });

  $('#selectall_checkbox').removeClass('settingsCheckboxChecked');
  selectedPlane = null;
  selectedAllPlanes = false;
  RefreshSelected();
}

export function SelectPlaneByHex(hex, autofollow) {
  // console.log("select: " + hex);
  // If SelectedPlane has something in it, clear out the selected
  if (selectedAllPlanes) {
    DeselectAllPlanes();
  }

  if (selectedPlane !== null) {
    Planes[selectedPlane].selected = false;
    Planes[selectedPlane].ClearLines();
    Planes[selectedPlane].UpdateMarker(false);
    $(Planes[selectedPlane].tr).removeClass('selected');
  }

  // If we are clicking the same plane, we are deselecting it.
  // (unless it was a doubleclick..)
  if (selectedPlane === hex && !autofollow) {
    hex = null;
  }

  if (hex !== null) {
    // Assign the new selected
    selectedPlane = hex;
    Planes[selectedPlane].selected = true;
    Planes[selectedPlane].UpdateLines();
    Planes[selectedPlane].UpdateMarker(false);
    $(Planes[selectedPlane].tr).addClass('selected');
  } else {
    selectedPlane = null;
  }

  if (selectedPlane !== null && autofollow) {
    FollowSelected = true;
    if (OLMap.getView().getZoom() < 8) OLMap.getView().setZoom(8);
  } else {
    FollowSelected = false;
  }

  RefreshSelected();
}

function getExtent(x, y, width, height) {
  return {
    xMin: x,
    yMin: y,
    xMax: x + width - 1,
    yMax: y + height - 1,
  };
}

function isPointInsideExtent(x, y, extent) {
  return (
    x >= extent.xMin && x <= extent.xMax && y >= extent.yMin && y <= extent.yMax
  );
}

// Reposition selected plane info box if it overlaps plane marker
function adjustSelectedInfoBlockPosition() {
  if (
    typeof Planes === 'undefined'
    || typeof selectedPlane === 'undefined'
    || Planes === null
  ) {
    return;
  }

  const selected = Planes[selectedPlane];

  if (
    selected === undefined
    || selected === null
    || selected.marker === undefined
    || selected.marker === null
  ) {
    return;
  }

  try {
    // Get marker position
    const { marker } = selected;
    const markerCoordinates = selected.marker.getGeometry().getCoordinates();
    const markerPosition = OLMap.getPixelFromCoordinate(markerCoordinates);

    // Get info box position and size
    const infoBox = $('#selected_infoblock');
    let infoBoxPosition = infoBox.position();
    if (typeof infoBoxOriginalPosition.top === 'undefined') {
      infoBoxOriginalPosition.top = infoBoxPosition.top;
      infoBoxOriginalPosition.left = infoBoxPosition.left;
    } else {
      infoBox.css('left', infoBoxOriginalPosition.left);
      infoBox.css('top', infoBoxOriginalPosition.top);
      infoBoxPosition = infoBox.position();
    }
    const infoBoxExtent = getExtent(
      infoBoxPosition.left,
      infoBoxPosition.top,
      infoBox.outerWidth(),
      infoBox.outerHeight(),
    );

    // Get map size
    const mapCanvas = $('#map_canvas');
    const mapExtent = getExtent(0, 0, mapCanvas.width(), mapCanvas.height());

    // Check for overlap
    if (
      isPointInsideExtent(markerPosition[0], markerPosition[1], infoBoxExtent)
    ) {
      // Array of possible new positions for info box
      const candidatePositions = [];
      candidatePositions.push({ x: 40, y: 60 });
      candidatePositions.push({ x: 40, y: markerPosition[1] + 80 });

      // Find new position
      for (let i = 0; i < candidatePositions.length; i += 1) {
        const candidatePosition = candidatePositions[i];
        const candidateExtent = getExtent(
          candidatePosition.x,
          candidatePosition.y,
          infoBox.outerWidth(),
          infoBox.outerHeight(),
        );

        if (
          !isPointInsideExtent(
            markerPosition[0],
            markerPosition[1],
            candidateExtent,
          )
          && isPointInsideExtent(
            candidatePosition.x,
            candidatePosition.y,
            mapExtent,
          )
        ) {
          // Found a new position that doesn't overlap marker - move box to that position
          infoBox.css('left', candidatePosition.x);
          infoBox.css('top', candidatePosition.y);
          return;
        }
      }
    }
  } catch (e) {
    // empty
  }
}

function TableRowClick(h, evt) {
  if (evt.srcElement instanceof HTMLAnchorElement) {
    evt.stopPropagation();
    return;
  }

  if (!$('#map_container').is(':visible')) {
    ShowMap();
  }
  SelectPlaneByHex(h, false);
  adjustSelectedInfoBlockPosition();
  evt.preventDefault();
}

function TableRowDoubleClick(h, evt) {
  if (!$('#map_container').is(':visible')) {
    ShowMap();
  }
  SelectPlaneByHex(h, true);
  adjustSelectedInfoBlockPosition();
  evt.preventDefault();
}

function processReceiverUpdate(data) {
  // Loop through all the planes in the data packet
  const { now } = data;
  const acs = data.aircraft;

  // Detect stats reset
  if (
    MessageCountHistory.length > 0
    && MessageCountHistory[MessageCountHistory.length - 1].messages > data.messages
  ) {
    MessageCountHistory = [
      {
        time: MessageCountHistory[MessageCountHistory.length - 1].time,
        messages: 0,
      },
    ];
  }

  // Note the message count in the history
  MessageCountHistory.push({ time: now, messages: data.messages });
  // .. and clean up any old values
  if (now - MessageCountHistory[0].time > 30) {
    MessageCountHistory.shift();
  }

  for (let j = 0; j < acs.length; j += 1) {
    const ac = acs[j];
    const { hex } = ac;
    const { squawk } = ac;
    let plane = null;

    if (hex === '000000') {
      continue; // Skip invalid ICAO24
    }

    // Do we already have this plane object in Planes?
    // If not make it.

    if (Planes[hex]) {
      plane = Planes[hex];
    } else {
      plane = new Plane(hex);
      plane.tr = PlaneRowTemplate.cloneNode(true);

      if (hex[0] === '~') {
        // Non-ICAO address
        plane.tr.cells[0].textContent = hex.substring(1);
        $(plane.tr).css('font-style', 'italic');
      } else {
        plane.tr.cells[0].textContent = hex;
      }

      // set flag image if available
      if (ShowFlags && plane.icaorange.FlagImage !== null) {
        $('img', plane.tr.cells[1]).attr(
          'src',
          FlagPath + plane.icaorange.FlagImage,
        );
        $('img', plane.tr.cells[1]).attr('title', plane.icaorange.Country);
      } else {
        $('img', plane.tr.cells[1]).css('display', 'none');
      }

      plane.tr.addEventListener('click', TableRowClick.bind(undefined, hex));

      plane.tr.addEventListener(
        'dblclick',
        TableRowDoubleClick.bind(undefined, hex),
      );

      Planes[hex] = plane;
      PlanesOrdered.push(plane);
    }

    // Call the function update
    plane.UpdateData(now, ac);
  }
}

// on refreshes, try to find new planes and mark them as selected
function SelectNewPlanes() {
  if (selectedAllPlanes) {
    Object.keys(Planes).forEach((key) => {
      if (!Planes[key].visible || Planes[key].GetIsFiltered()) {
        Planes[key].selected = false;
        Planes[key].ClearLines();
        Planes[key].UpdateMarker(false);
      } else if (Planes[key].selected !== true) {
        Planes[key].selected = true;
        Planes[key].UpdateLines();
        Planes[key].UpdateMarker(false);
      }
    });
  }
}

// Make a LineString with 'points'-number points
// that is a closed circle on the sphere such that the
// great circle distance from 'center' to each point is
// 'radius' meters
function MakeGeodesicCircle(center, radius, points) {
  const angularDistance = radius / 6378137.0;
  const lon1 = (center[0] * Math.PI) / 180.0;
  const lat1 = (center[1] * Math.PI) / 180.0;
  let geom = null;
  for (let i = 0; i <= points; i += 1) {
    const bearing = (i * 2 * Math.PI) / points;

    let lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance)
        + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    let lon2 = lon1
      + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      );

    lat2 = (lat2 * 180.0) / Math.PI;
    lon2 = (lon2 * 180.0) / Math.PI;
    if (geom === null) {
      geom = new ol.geom.LineString([lon2, lat2], 'XY');
    } else {
      geom.appendCoordinate([lon2, lat2]);
    }
  }
  return geom;
}

//
// ---- table sorting ----
//

let sortId = '';
let sortCompare = null;
let sortExtract = null;
let sortAscending = true;

function compareAlpha(xa, ya) {
  if (xa === ya) return 0;
  if (xa < ya) return -1;
  return 1;
}

function compareNumeric(xf, yf) {
  if (Math.abs(xf - yf) < 1e-9) return 0;

  return xf - yf;
}

function sortFunction(x, y) {
  const xv = x.SortValue;
  const yv = y.SortValue;

  // Put aircrafts marked interesting always on top of the list
  if (x.interesting === true) return -1;
  if (y.interesting === true) return 1;

  // Put aircrafts with special squawks on to of the list
  if (x.squawk in SpecialSquawks) return -1;
  if (y.squawk in SpecialSquawks) return 1;

  // always sort missing values at the end, regardless of
  // ascending/descending sort
  if (xv === null && yv === null) return x.SortPosition - y.SortPosition;
  if (xv === null) return 1;
  if (yv === null) return -1;

  const c = sortAscending ? sortCompare(xv, yv) : sortCompare(yv, xv);
  if (c !== 0) return c;

  return x.SortPosition - y.SortPosition;
}

function ResortTable() {
  // number the existing rows so we can do a stable sort
  // regardless of whether sort() is stable or not.
  // Also extract the sort comparison value.
  for (let i = 0; i < PlanesOrdered.length; i += 1) {
    PlanesOrdered[i].SortPosition = i;
    PlanesOrdered[i].SortValue = sortExtract(PlanesOrdered[i]);
  }

  PlanesOrdered.sort(sortFunction);

  const tbody = document.getElementById('tableinfo').tBodies[0];
  for (let i = 0; i < PlanesOrdered.length; i += 1) {
    tbody.appendChild(PlanesOrdered[i].tr);
  }
}

function SortBy(id, sc, se) {
  if (id === sortId) {
    sortAscending = !sortAscending;
    PlanesOrdered.reverse(); // this correctly flips the order of rows that compare equal
  } else {
    sortAscending = true;
  }

  sortId = id;
  sortCompare = sc;
  sortExtract = se;

  ResortTable();
}

function sortByICAO() {
  SortBy('icao', compareAlpha, x => x.icao);
}
function sortByFlight() {
  SortBy('flight', compareAlpha, x => x.flight);
}
function sortByRegistration() {
  SortBy('registration', compareAlpha, x => x.registration);
}
function sortByAircraftType() {
  SortBy('icaotype', compareAlpha, x => x.icaotype);
}
function sortBySquawk() {
  SortBy('squawk', compareAlpha, x => x.squawk);
}
function sortByAltitude() {
  SortBy('altitude', compareNumeric, x => (x.altitude === 'ground' ? -1e9 : x.altitude));
}
function sortBySpeed() {
  SortBy('speed', compareNumeric, x => x.speed);
}
function sortByVerticalRate() {
  SortBy('vert_rate', compareNumeric, x => x.vert_rate);
}
function sortByDistance() {
  SortBy('sitedist', compareNumeric, x => x.sitedist);
}
function sortByTrack() {
  SortBy('track', compareNumeric, x => x.track);
}
function sortByMsgs() {
  SortBy('msgs', compareNumeric, x => x.messages);
}
function sortBySeen() {
  SortBy('seen', compareNumeric, x => x.seen);
}
function sortByCountry() {
  SortBy('country', compareAlpha, x => x.icaorange.Country);
}
function sortByRssi() {
  SortBy('rssi', compareNumeric, x => x.rssi);
}
function sortByLatitude() {
  SortBy('lat', compareNumeric, x => (x.position !== null ? x.position[1] : null));
}
function sortByLongitude() {
  SortBy('lon', compareNumeric, x => (x.position !== null ? x.position[0] : null));
}
function sortByDataSource() {
  SortBy('data_source', compareAlpha, x => x.GetDataSource());
}
function sortByCivilMil() {
  SortBy('civilmil', compareAlpha, x => x.civilmil);
}

function CreateSiteCircleFeatures() {
  // CleaInitializeMapcles first
  SiteCircleFeatures.forEach((circleFeature) => {
    StaticFeatures.remove(circleFeature);
  });
  SiteCircleFeatures.clear();

  const circleStyle = distance => new ol.style.Style({
    fill: null,
    stroke: new ol.style.Stroke({
      color: '#000000',
      width: 1,
    }),
    text: new ol.style.Text({
      font: '10px Helvetica Neue, sans-serif',
      fill: new ol.style.Fill({ color: '#000' }),
      offsetY: -8,
      text: FormatDistanceLong(distance, MapSettings.DisplayUnits, 0),
    }),
  });

  let conversionFactor = 1000.0;
  if (MapSettings.DisplayUnits === 'nautical') {
    conversionFactor = 1852.0;
  } else if (MapSettings.DisplayUnits === 'imperial') {
    conversionFactor = 1609.0;
  }

  for (let i = 0; i < SiteCirclesDistances.length; i += 1) {
    const distance = SiteCirclesDistances[i] * conversionFactor;
    const circle = MakeGeodesicCircle(sitePosition, distance, 360);
    circle.transform('EPSG:4326', 'EPSG:3857');
    const feature = new ol.Feature(circle);
    feature.setStyle(circleStyle(distance));
    StaticFeatures.push(feature);
    SiteCircleFeatures.push(feature);
  }
}

// Initalizes the map and starts up our timers to call various functions
function InitializeMap() {
  // Set SitePosition, initialize sorting
  if (
    siteShow
    && typeof siteLat !== 'undefined'
    && typeof siteLon !== 'undefined'
  ) {
    sitePosition = [siteLon, siteLat];
    sortByDistance();
  } else {
    sitePosition = null;
    PlaneRowTemplate.cells[10].style.display = 'none'; // hide distance column
    document.getElementById('distance').style.display = 'none'; // hide distance header
    sortByAltitude();
  }

  // Maybe hide flag info
  if (!ShowFlags) {
    PlaneRowTemplate.cells[1].style.display = 'none'; // hide flag column
    document.getElementById('flag').style.display = 'none'; // hide flag header
    document.getElementById('infoblock_country').style.display = 'none'; // hide country row
  }

  $('#alt_chart_checkbox').checkboxradio({ icon: false });
  $('#alt_chart_checkbox')
    .prop('checked', MapSettings.AltitudeChart)
    .checkboxradio('refresh');
  $('#alt_chart_checkbox').on('change', () => {
    let showAltChart = $('#alt_chart_checkbox').prop('checked');
    MapSettings.AltitudeChart = showAltChart;
    PutSetting('MapSettings', MapSettings);
    // if you're using custom colors always hide the chart
    if (customAltitudeColors === true) {
      showAltChart = false;
      $('#altitude_chart_checkbox').hide();
    }
    if (showAltChart) {
      $('#altitude_chart').show();
    } else {
      $('#altitude_chart').hide();
    }
  });
  $('#alt_chart_checkbox').trigger('change');

  // Initialize OL3

  layers = CreateBaseLayers();

  const iconsLayer = new ol.layer.Vector({
    name: 'ac_positions',
    type: 'overlay',
    title: 'Aircraft positions',
    source: new ol.source.Vector({
      features: PlaneIconFeatures,
    }),
  });

  layers.push(
    new ol.layer.Group({
      title: 'Overlays',
      layers: [
        new ol.layer.Vector({
          name: 'site_pos',
          type: 'overlay',
          title: 'Site position and range rings',
          source: new ol.source.Vector({
            features: StaticFeatures,
          }),
        }),

        new ol.layer.Vector({
          name: 'ac_trail',
          type: 'overlay',
          title: 'Selected aircraft trail',
          source: new ol.source.Vector({
            features: PlaneTrailFeatures,
          }),
        }),

        iconsLayer,
      ],
    }),
  );

  let foundType = false;

  layers.forEach((layergroup, index) => {
    ol.control.LayerSwitcher.forEachRecursive(layergroup, (lyr) => {
      if (!lyr.get('name')) return;

      if (lyr.get('type') === 'base') {
        if (MapSettings.MapType === lyr.get('name')) {
          foundType = true;
          lyr.setVisible(true);
        } else {
          lyr.setVisible(false);
        }

        lyr.on('change:visible', (evt) => {
          if (evt.target.getVisible()) {
            MapSettings.MapType = evt.target.get('name');
            PutSetting('MapSettings', MapSettings);
          }
        });
      } else if (lyr.get('type') === 'overlay') {
        const n = `layer_${lyr.get('name')}`;
        const visible = MapSettings.VisibleLayers[n];
        if (visible !== undefined) {
          // javascript, why must you taunt me with gratuitous type problems
          lyr.setVisible(visible);
        }

        lyr.on('change:visible', (evt) => {
          const m = `layer_${evt.target.get('name')}`;
          MapSettings.VisibleLayers[m] = evt.target.getVisible();
          PutSetting('MapSettings', MapSettings);
        });
      }
    });
  });

  if (!foundType) {
    layers.forEach((layergroup, index) => {
      ol.control.LayerSwitcher.forEachRecursive(layergroup, (lyr) => {
        if (foundType) return;
        if (lyr.get('type') === 'base') {
          lyr.setVisible(true);
          foundType = true;
        }
      });
    });
  }

  OLMap = new ol.Map({
    target: 'map_canvas',
    layers,
    view: new ol.View({
      center: ol.proj.fromLonLat([
        MapSettings.CenterLon,
        MapSettings.CenterLat,
      ]),
      zoom: MapSettings.ZoomLvl,
    }),
    controls: [
      new ol.control.Zoom(),
      new ol.control.Rotate(),
      new ol.control.Attribution({ collapsed: false }),
      new ol.control.ScaleLine({ units: MapSettings.DisplayUnits }),
      new LayerSwitcher(),
      new MapControls(),
    ],
    loadTilesWhileAnimating: true,
    loadTilesWhileInteracting: true,
  });

  // Listeners for newly created Map
  OLMap.getView().on('change:center', (event) => {
    const center = ol.proj.toLonLat(
      OLMap.getView().getCenter(),
      OLMap.getView().getProjection(),
    );
    [MapSettings.CenterLon, MapSettings.CenterLat] = center;
    PutSetting('MapSettings', MapSettings);

    if (FollowSelected) {
      // On manual navigation, disable follow
      const selected = Planes[selectedPlane];
      if (
        typeof selected === 'undefined'
        || (Math.abs(center[0] - selected.position[0]) > 0.0001
          && Math.abs(center[1] - selected.position[1]) > 0.0001)
      ) {
        FollowSelected = false;
        RefreshSelected();
      }
    }
  });

  OLMap.getView().on('change:resolution', (event) => {
    MapSettings.ZoomLvl = OLMap.getView().getZoom();
    PutSetting('MapSettings', MapSettings);
    Object.keys(Planes).forEach((key) => {
      Planes[key].UpdateMarker(false);
    });
  });

  OLMap.on(['click', 'dblclick'], (evt) => {
    const hex = evt.map.forEachFeatureAtPixel(
      evt.pixel,
      (feature, layer) => feature.hex,
      { hitTolerance: 3 },
      layer => layer === iconsLayer,
      null,
    );
    if (hex) {
      SelectPlaneByHex(hex, evt.type === 'dblclick');
      adjustSelectedInfoBlockPosition();
      evt.stopPropagation();
    } else {
      DeselectAllPlanes();
      evt.stopPropagation();
    }
  });

  if (ShowHoverOverLabels) {
    const overlay = new ol.Overlay({
      element: document.getElementById('popinfo'),
      positioning: 'bottom-left',
    });
    overlay.setMap(OLMap);

    // trap mouse moving over
    OLMap.on('pointermove', (evt) => {
      const feature = OLMap.forEachFeatureAtPixel(
        evt.pixel,
        (feat, layer) => {
          overlay.setPosition(evt.coordinate);
          let popname = feat.get('name');
          if (popname === '~') {
            let vsi = '';
            if (Planes[feat.hex].vert_rate > 256) {
              vsi = 'climbing';
            } else if (Planes[feat.hex].vert_rate < -256) {
              vsi = 'descending';
            } else vsi = 'level';
            const altText = Math.round(
              ConvertAltitude(
                Planes[feat.hex].altitude,
                MapSettings.DisplayUnits,
              ),
            )
              + NBSP
              + GetUnitLabel('altitude', MapSettings.DisplayUnits);

            if (ShowAdditionalData) {
              popname = Planes[feat.hex].typeDescription
                ? Planes[feat.hex].typeDescription
                : 'Unknown aircraft type';
              popname = `${popname} [${
                Planes[feat.hex].species ? Planes[feat.hex].species : '?'
              }]`;

              popname = `${popname}\n(${
                Planes[feat.hex].flight
                  ? Planes[feat.hex].flight.trim()
                  : 'No Call'
              })`;
              popname = `${popname} #${feat.hex.toUpperCase()}`;

              popname = `${popname}\n${
                Planes[feat.hex].altitude ? altText : '?'
              }`;
              popname = `${popname} and ${vsi}`;

              popname = `${popname} ${
                Planes[feat.hex].operator ? Planes[feat.hex].operator : ''
              }`;
            } else {
              popname = `ICAO: ${Planes[feat.hex].icao}`;
              popname = `${popname}\nFlt:  ${
                Planes[feat.hex].flight ? Planes[feat.hex].flight : '?'
              }`;
              popname = `${popname}\nType: ${
                Planes[feat.hex].icaotype ? Planes[feat.hex].icaotype : '?'
              }`;
              popname = `${popname}\nReg:  ${
                Planes[feat.hex].registration
                  ? Planes[feat.hex].registration
                  : '?'
              }`;
              popname = `${popname}\nAlt:  ${
                Planes[feat.hex].altitude ? altText : '?'
              }`;
            }
            overlay.getElement().innerHTML = popname || '';
            return feat;
          }
          return null;
        },
        { hitTolerance: 3 },
        layer => layer === iconsLayer,
      );

      overlay.getElement().style.display = feature ? '' : 'none'; // EAK--> Needs GMAP/INDEX.HTML
      document.body.style.cursor = feature ? 'pointer' : '';
    });
  } else {
    const overlay = new ol.Overlay({
      element: document.getElementById('popinfo'),
      positioning: 'bottom-left',
    });
    overlay.setMap(OLMap);
  }

  // Add home marker if requested
  if (sitePosition) {
    const markerStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 7,
        snapToPixel: false,
        fill: new ol.style.Fill({ color: 'black' }),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    });

    const feature = new ol.Feature(
      new ol.geom.Point(ol.proj.fromLonLat(sitePosition)),
    );
    feature.setStyle(markerStyle);
    StaticFeatures.push(feature);

    if (SiteCircles) {
      CreateSiteCircleFeatures();
    }
  }

  // Add terrain-limit rings. To enable this:
  //
  //  create a panorama for your receiver location on heywhatsthat.com
  //
  //  note the "view" value from the URL at the top of the panorama
  //    i.e. the XXXX in http://www.heywhatsthat.com/?view=XXXX
  //
  // fetch a json file from the API for the altitudes you want to see:
  //
  //  wget -O /usr/share/readsb/html/upintheair.json \
  //    'http://www.heywhatsthat.com/api/upintheair.json?id=XXXX&refraction=0.25&alts=3048,9144'
  //
  // NB: altitudes are in _meters_, you can specify a list of altitudes

  // kick off an ajax request that will add the rings when it's done
  const request = $.ajax({
    url: 'upintheair.json',
    timeout: 5000,
    cache: true,
    dataType: 'json',
  });
  request.done((data) => {
    const ringStyle = new ol.style.Style({
      fill: null,
      stroke: new ol.style.Stroke({
        color: '#000000',
        width: 1,
      }),
    });

    for (let i = 0; i < data.rings.length; i += 1) {
      const geom = new ol.geom.LineString();
      const { points } = data.rings[i];
      if (points.length > 0) {
        for (let j = 0; j < points.length; j += 1) {
          geom.appendCoordinate([points[j][1], points[j][0]]);
        }
        geom.appendCoordinate([points[0][1], points[0][0]]);
        geom.transform('EPSG:4326', 'EPSG:3857');

        const feature = new ol.Feature(geom);
        feature.setStyle(ringStyle);
        StaticFeatures.push(feature);
      }
    }
  });

  request.fail((jqxhr, status, error) => {
    // no rings available, do nothing
  });
}

// Refreshes the larger table of all the planes
export function RefreshTableInfo() {
  TrackedAircraft = 0;
  TrackedAircraftPositions = 0;
  TrackedAircraftUnknown = 0;
  TrackedHistorySize = 0;

  $('.altitudeUnit').text(GetUnitLabel('altitude', MapSettings.DisplayUnits));
  $('.speedUnit').text(GetUnitLabel('speed', MapSettings.DisplayUnits));
  $('.distanceUnit').text(GetUnitLabel('distance', MapSettings.DisplayUnits));
  $('.verticalRateUnit').text(
    GetUnitLabel('verticalRate', MapSettings.DisplayUnits),
  );

  for (let i = 0; i < PlanesOrdered.length; i += 1) {
    const tableplane = PlanesOrdered[i];
    TrackedHistorySize += tableplane.HistorySize;
    if (tableplane.seen >= 58 || tableplane.GetIsFiltered()) {
      tableplane.tr.className = 'plane_table_row hidden';
    } else {
      TrackedAircraft += 1;
      if (tableplane.civilmil === null) {
        TrackedAircraftUnknown += 1;
      }
      let classes = 'plane_table_row';

      if (tableplane.position !== null && tableplane.seen_pos < 60) {
        TrackedAircraftPositions += 1;
        if (tableplane.position_from_mlat) classes += ' mlat';
        else classes += ' vPosition';
      }
      if (tableplane.interesting === true || tableplane.highlight === true) {
        classes += ' interesting';
      }

      if (tableplane.icao === selectedPlane) classes += ' selected';

      if (tableplane.squawk in SpecialSquawks) {
        classes = `${classes} ${SpecialSquawks[tableplane.squawk].cssClass}`;
      }

      // ICAO doesn't change
      if (tableplane.flight) {
        tableplane.tr.cells[2].innerHTML = tableplane.flight;
        if (tableplane.operator !== null) {
          tableplane.tr.cells[2].title = tableplane.operator;
        }
      } else {
        tableplane.tr.cells[2].innerHTML = '';
      }

      let v = '';
      if (tableplane.version === 0) {
        v = ' v0 (DO-260)';
      } else if (tableplane.version === 1) {
        v = ' v1 (DO-260A)';
      } else if (tableplane.version === 2) {
        v = ' v2 (DO-260B)';
      }

      tableplane.tr.cells[3].textContent = tableplane.registration !== null ? tableplane.registration : '';
      if (tableplane.civilmil !== null && tableplane.civilmil === true) {
        tableplane.tr.cells[4].textContent = 'Mil';
      } else if (
        tableplane.civilmil !== null
        && tableplane.civilmil === false
      ) {
        tableplane.tr.cells[4].textContent = 'Civ';
      } else {
        tableplane.tr.cells[4].textContent = '';
      }
      tableplane.tr.cells[5].textContent = tableplane.icaotype !== null ? tableplane.icaotype : '';
      tableplane.tr.cells[6].textContent = tableplane.squawk !== null ? tableplane.squawk : '';
      tableplane.tr.cells[7].innerHTML = FormatAltitudeBrief(
        tableplane.altitude,
        tableplane.vert_rate,
        MapSettings.DisplayUnits,
      );
      tableplane.tr.cells[8].textContent = FormatSpeedBrief(
        tableplane.speed,
        MapSettings.DisplayUnits,
      );
      tableplane.tr.cells[9].textContent = FormatVerticalRateBrief(
        tableplane.vert_rate,
        MapSettings.DisplayUnits,
      );
      tableplane.tr.cells[10].textContent = FormatDistanceBrief(
        tableplane.sitedist,
        MapSettings.DisplayUnits,
      );
      tableplane.tr.cells[11].textContent = FormatTrackBrief(tableplane.track);
      tableplane.tr.cells[12].textContent = tableplane.messages;
      tableplane.tr.cells[13].textContent = tableplane.seen.toFixed(0);
      tableplane.tr.cells[14].textContent = tableplane.rssi !== null ? tableplane.rssi : '';
      tableplane.tr.cells[15].textContent = tableplane.position !== null ? tableplane.position[1].toFixed(4) : '';
      tableplane.tr.cells[16].textContent = tableplane.position !== null ? tableplane.position[0].toFixed(4) : '';
      tableplane.tr.cells[17].textContent = FormatDataSource(tableplane.GetDataSource()) + v;
      tableplane.tr.className = classes;
    }
  }
  ResortTable();
}

function fetchData() {
  if (FetchPending !== null && FetchPending.state() === 'pending') {
    // don't double up on fetches, let the last one resolve
    return;
  }

  FetchPending = $.ajax({
    url: 'data/aircraft.json',
    timeout: 5000,
    cache: false,
    dataType: 'json',
  });
  FetchPending.done((data) => {
    const { now } = data;

    processReceiverUpdate(data);

    // update timestamps, visibility, history track for all planes - not only those updated
    for (let i = 0; i < PlanesOrdered.length; i += 1) {
      const plane = PlanesOrdered[i];
      plane.UpdateTick(now, LastReceiverTimestamp);
    }

    SelectNewPlanes();
    RefreshTableInfo();
    RefreshSelected();

    // Check for stale receiver data
    if (LastReceiverTimestamp === now) {
      StaleReceiverCount += 1;
      if (StaleReceiverCount > 5) {
        $('#update_error_detail').text(
          "The data from readsb hasn't been updated in a while. Maybe readsb is no longer running?",
        );
        $('#update_error').css('display', 'block');
      }
    } else {
      StaleReceiverCount = 0;
      LastReceiverTimestamp = now;
      $('#update_error').css('display', 'none');
    }
  });

  FetchPending.fail((jqxhr, status, error) => {
    $('#update_error_detail').text(
      `AJAX call failed (${status}${
        error ? `: ${error}` : ''
      }). Maybe readsb is no longer running?`,
    );
    $('#update_error').css('display', 'block');
  });
}

// This looks for planes to reap out of the master Planes variable
function Reaper() {
  // Look for planes where we have seen no messages for >300 seconds
  const newPlanes = [];
  for (let i = 0; i < PlanesOrdered.length; i += 1) {
    const plane = PlanesOrdered[i];
    if (plane.seen > 300) {
      // Reap it.
      if (selectedPlane === plane.icao) {
        // Invalid selected plane when it gets deleted from list.
        selectedPlane = null;
      }
      plane.tr.parentNode.removeChild(plane.tr);
      plane.tr = null;
      delete Planes[plane.icao];
      plane.Destroy();
    } else {
      // Keep it.
      newPlanes.push(plane);
    }
  }

  PlanesOrdered = newPlanes;
  RefreshTableInfo();
  RefreshSelected();
}

// loop through the planes and mark them as selected to show the paths for all planes
export function SelectAllPlanes() {
  // if all planes are already selected, deselect them all
  if (selectedAllPlanes) {
    DeselectAllPlanes();
  } else {
    // If SelectedPlane has something in it, clear out the selected
    if (selectedPlane !== null) {
      Planes[selectedPlane].selected = false;
      Planes[selectedPlane].ClearLines();
      Planes[selectedPlane].UpdateMarker(false);
      $(Planes[selectedPlane].tr).removeClass('selected');
    }

    selectedPlane = null;
    selectedAllPlanes = true;

    Object.keys(Planes).forEach((key) => {
      if (Planes[key].visible && !Planes[key].GetIsFiltered()) {
        Planes[key].selected = true;
        Planes[key].UpdateLines();
        Planes[key].UpdateMarker(false);
      }
    });
  }

  $('#selectall_checkbox').addClass('settingsCheckboxChecked');

  RefreshSelected();
}

export function ToggleFollowSelected() {
  FollowSelected = !FollowSelected;
  if (FollowSelected && OLMap.getView().getZoom() < 8) {
    OLMap.getView().setZoom(8);
  }
  RefreshSelected();
}

export function ResetMap() {
  // Reset map settings
  MapSettings.CenterLat = defaultCenterLat;
  MapSettings.CenterLon = defaultCenterLon;
  MapSettings.ZoomLvl = DefaultZoomLvl;
  PutSetting('MapSettings', MapSettings);

  // Set and refresh
  OLMap.getView().setZoom(MapSettings.ZoomLvl);
  OLMap.getView().setCenter(
    ol.proj.fromLonLat([MapSettings.CenterLon, MapSettings.CenterLat]),
  );

  SelectPlaneByHex(null, false);
}

export function ToggleSidebarVisibility(e) {
  e.preventDefault();
  $('#sidebar_container').hide();
  $('#toggle_sidebar_button').removeClass('show_sidebar');
  $('#toggle_sidebar_button').addClass('hide_sidebar');
  UpdateMapSize();
}

export function ExpandSidebar(e) {
  e.preventDefault();
  if ($('#sidebar_container').is(':visible') === false) {
    $('#sidebar_container').show();
    $('#toggle_sidebar_button').addClass('show_sidebar');
    $('#toggle_sidebar_button').removeClass('hide_sidebar');
    UpdateMapSize();
    return;
  }

  $('#map_container').hide();
  $('#toggle_sidebar_control').hide();
  $('#splitter').hide();
  $('#show_map_button').show();
  $('#accordion').accordion('option', 'active', 0);
  $('#sidebar_container').width('100%');
  SetColumnVisibility();
  SetSelectedInfoBlockVisibility();
  UpdateMapSize();
}

function OnDisplayUnitsChanged(e) {
  const displayUnits = e.target.value;
  MapSettings.DisplayUnits = displayUnits;
  PutSetting('MapSettings', MapSettings);

  // Refresh filter list
  RefreshFilterList();

  // Refresh data
  RefreshTableInfo();
  RefreshSelected();

  // Redraw range rings
  if (sitePosition !== null && sitePosition !== undefined && SiteCircles) {
    CreateSiteCircleFeatures();
  }

  // Reset map scale line units
  OLMap.getControls().forEach((control) => {
    if (control instanceof ol.control.ScaleLine) {
      control.setUnits(displayUnits);
    }
  });

  if (displayUnits === 'metric') {
    $('#altitude_chart_button').addClass('altitudeMeters');
  } else {
    $('#altitude_chart_button').removeClass('altitudeMeters');
  }
}

function InitializeUnitsSelector() {
  // Get display unit preferences from local storage
  if (MapSettings.DisplayUnits === null) {
    MapSettings.DisplayUnits = 'nautical';
    PutSetting('MapSettings', MapSettings);
  }

  // Initialize drop-down
  const unitsSelector = $('#units_selector');
  unitsSelector.selectmenu({
    width: 150,
  });
  unitsSelector.val(MapSettings.DisplayUnits);
  unitsSelector.selectmenu('refresh');
  unitsSelector.on('selectmenuclose', OnDisplayUnitsChanged);

  if (MapSettings.DisplayUnits === 'metric') {
    $('#altitude_chart_button').addClass('altitudeMeters');
  } else {
    $('#altitude_chart_button').removeClass('altitudeMeters');
  }
}

function GetEditAircraftData() {
  if (selectedPlane === null || selectedPlane === undefined) return;
  const selected = Planes[selectedPlane];
  $('#edit_icao24').val(selected.icao.toUpperCase());

  if (selected.registration !== null) {
    if (selected.registration.startsWith('#')) {
      $('#edit_reg').val(selected.registration.substr(2).toUpperCase());
    } else {
      $('#edit_reg').val(selected.registration.toUpperCase());
    }
  }

  if (selected.icaotype !== null) {
    $('#edit_type').val(selected.icaotype.toUpperCase());
  }
  if (selected.typeDescription !== null) {
    $('#edit_desc').val(selected.typeDescription);
  }

  if (selected.interesting !== null && selected.interesting) {
    $('#edit_interesting').prop('checked', true);
  } else {
    $('#edit_interesting').prop('checked', false);
  }

  if (selected.civilmil !== null && selected.civilmil) {
    $('#edit_civilmil').prop('checked', true);
  } else {
    $('#edit_civilmil').prop('checked', false);
  }
}

function EditAircraftData() {
  const i24 = $('#edit_icao24')
    .val()
    .trim()
    .substr(0, 6)
    .toUpperCase();
  const r = $('#edit_reg')
    .val()
    .trim()
    .substr(0, 10)
    .toUpperCase();
  const t = $('#edit_type')
    .val()
    .trim()
    .substr(0, 4)
    .toUpperCase();
  const d = $('#edit_desc')
    .val()
    .trim()
    .substr(0, 50);
  const civ = $('#edit_civilmil').prop('checked');
  const int = $('#edit_interesting').prop('checked');

  let f = '00';
  if (civ && !int) f = '10';
  if (!civ && int) f = '01';
  if (civ && int) f = '11';

  const entry = {
    icao24: i24,
    reg: r,
    type: t,
    flags: f,
    desc: d,
  };
  PutAircraftData(entry);
  EditAircraftDialog.dialog('close');
  GetAircraftData(Planes[selectedPlane]);
  RefreshTableInfo();
  RefreshSelected();
}

const CurrentHistoryFetch = null;
let PositionHistoryBuffer = [];
let PositionHistorySize = 0;

function EndLoadHistory() {
  $('#loader').addClass('hidden');

  console.info('Done loading history');

  if (PositionHistoryBuffer.length > 0) {
    let now;
    let last = 0;

    // Sort history by timestamp
    console.info('Sorting history');
    PositionHistoryBuffer.sort((x, y) => x.now - y.now);

    // Process history
    for (let h = 0; h < PositionHistoryBuffer.length; h += 1) {
      ({ now } = PositionHistoryBuffer[h]);
      console.info(
        `Applying history ${h}/${PositionHistoryBuffer.length} at: ${now}`,
      );
      processReceiverUpdate(PositionHistoryBuffer[h]);

      // update track
      console.info(`Updating tracks at: ${now}`);
      for (let i = 0; i < PlanesOrdered.length; i += 1) {
        const plane = PlanesOrdered[i];
        plane.UpdateTrack(now, last);
      }

      last = now;
    }

    // Final pass to update all planes to their latest state
    console.info('Final history cleanup pass');
    for (let j = 0; j < PlanesOrdered.length; j += 1) {
      const plane = PlanesOrdered[j];
      plane.UpdateTick(now, last);
    }

    LastReceiverTimestamp = last;
  }

  PositionHistoryBuffer = null;

  console.info('Completing init');

  RestoreSessionFilters();

  RefreshTableInfo();
  RefreshSelected();
  Reaper();

  // Setup our timer to poll from the server.
  window.setInterval(fetchData, RefreshInterval);
  window.setInterval(Reaper, 60000);

  // And kick off one refresh immediately.
  fetchData();
}

function LoadHistoryItems() {
  let loaded = 0;
  for (let i = 0; i < PositionHistorySize; i += 1) {
    $.ajax({
      url: `data/history_${i}.json`,
      timeout: 5000,
      cache: false,
      dataType: 'json',
    })
      .done((data) => {
        if (loaded < 0) return;
        PositionHistoryBuffer.push(data); // don't care for order, will sort later
        loaded += 1;
        console.info(`Loaded ${loaded} history chunks`);
        $('#loader_progress').attr('value', loaded);
        if (loaded >= PositionHistorySize) {
          loaded = -1;
          EndLoadHistory();
        }
      })
      .fail((jqxhr, status, error) => {
        if (loaded < 0) return;
        console.error('Failed to load history chunk');
        loaded = -1;
        EndLoadHistory();
      });
  }
}

function StartLoadHistory() {
  if (PositionHistorySize > 0 && window.location.hash !== '#nohistory') {
    $('#loader_progress').attr('max', PositionHistorySize);
    console.info(`Starting to load history (${PositionHistorySize} items)`);
    LoadHistoryItems();
  } else {
    EndLoadHistory();
  }
}

export function Initialize() {
  // Set page basics
  document.title = PageName;
  $('#infoblock_name').text(PageName);

  PlaneRowTemplate = document.getElementById('plane_row_template');

  $('#loader').removeClass('hidden');

  // Set up map/sidebar splitter
  $('#sidebar_container').resizable({ handles: { w: '#splitter' } });

  // Set up aircraft information panel
  $('#selected_infoblock').draggable({ containment: 'parent' });
  $('#selected_infoblock').draggable({
    cancel: '#toggle-follow-icon, #infoblock_head, #edit-aircraft-button',
  });

  // Set up event handlers for buttons
  $('#show_map_button').click(ShowMap);

  // Set initial element visibility
  $('#show_map_button').hide();
  SetColumnVisibility();

  // Force map to redraw if sidebar container is resized - use a timer to debounce
  let mapResizeTimeout;
  $('#sidebar_container').on('resize', () => {
    clearTimeout(mapResizeTimeout);
    mapResizeTimeout = setTimeout(UpdateMapSize, 10);
  });

  // check if the altitude color values are default to enable the altitude filter
  if (
    ColorByAlt.air.h.length === 3
    && ColorByAlt.air.h[0].alt === 2000
    && ColorByAlt.air.h[0].val === 20
    && ColorByAlt.air.h[1].alt === 10000
    && ColorByAlt.air.h[1].val === 140
    && ColorByAlt.air.h[2].alt === 40000
    && ColorByAlt.air.h[2].val === 300
  ) {
    customAltitudeColors = false;
  }

  // Get receiver metadata, reconfigure using it, then continue
  // with initialization
  $.ajax({
    url: 'data/receiver.json',
    timeout: 5000,
    cache: false,
    dataType: 'json',
  })

    .done((data) => {
      if (typeof data.lat !== 'undefined') {
        siteShow = true;
        siteLat = data.lat;
        siteLon = data.lon;
        defaultCenterLat = data.lat;
        defaultCenterLon = data.lon;
      }

      ReadsbVersion = data.version;
      RefreshInterval = data.refresh;
      PositionHistorySize = data.history;
    })

    .always(() => {
      GetSetting('MapSettings')
        .done((result) => {
          if (result.CenterLat !== null && result.CenterLat !== undefined) {
            MapSettings.CenterLat = result.CenterLat;
          }
          if (result.CenterLon !== null && result.CenterLon !== undefined) {
            MapSettings.CenterLon = result.CenterLon;
          }
          if (result.ZoomLvl !== null && result.ZoomLvl !== undefined) {
            MapSettings.ZoomLvl = result.ZoomLvl;
          }
          if (result.MapType !== null && result.MapType !== undefined) {
            MapSettings.MapType = result.MapType;
          }
          if (
            result.VisibleLayers !== null
            && result.VisibleLayers !== undefined
          ) {
            MapSettings.VisibleLayers = result.VisibleLayers;
          }
          if (
            result.DisplayUnits !== null
            && result.DisplayUnits !== undefined
          ) {
            MapSettings.DisplayUnits = result.DisplayUnits;
          }
          if (
            result.AltitudeChart !== null
            && result.AltitudeChart !== undefined
          ) {
            MapSettings.AltitudeChart = result.AltitudeChart;
          }
          console.info('MapSettings loaded.');
        })
        .fail(() => {
          MapSettings.CenterLat = defaultCenterLat;
          MapSettings.CenterLon = defaultCenterLon;
          MapSettings.ZoomLvl = DefaultZoomLvl;
          MapSettings.MapType = 'osm';
          MapSettings.VisibleLayers = {
            layer_site_pos: true,
            layer_ac_trail: true,
            layer_ac_positions: true,
          };
          MapSettings.DisplayUnits = DefaultDisplayUnits;
          MapSettings.AltitudeChart = true;
          PutSetting('MapSettings', MapSettings);
          console.info('MapSettings initialized.');
        })
        .always(() => {
          /* Do main initialization after we got the map settings from database */
          InitializeUnitsSelector();
          InitializeFilters();
          InitializeMap();
          StartLoadHistory();
        });
    });
}

// Initilize web application GUI
$(() => {
  $('#accordion').accordion({
    collapsible: true,
    active: 0,
    heightStyle: 'content',
  });
  $('#filter_selector').selectmenu({
    width: 150,
  });
  $('#filter_add_button').button();
  $(document).tooltip({
    position: { my: 'right center', at: 'left center' },
  });

  $('#toggle-follow-icon').on('click', ToggleFollowSelected);

  const dc = $('#dialog-confirm').dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Ok() {
        $(this).dialog('close');
        $('#edit_icao24').attr('readonly', false);
        $('#edit_icao24').focus();
      },
    },
  });

  $('#edit_icao24').on('click', () => {
    dc.dialog('open');
  });

  let form = null;
  EditAircraftDialog = $('#editdialog_form').dialog({
    autoOpen: false,
    height: 400,
    width: 350,
    modal: true,
    buttons: {
      'Save changes': EditAircraftData,
      Cancel() {
        EditAircraftDialog.dialog('close');
      },
    },
    close() {
      form[0].reset();
      $('#edit_icao24').attr('readonly', true);
    },
  });

  form = EditAircraftDialog.find('form').on('submit', (event) => {
    event.preventDefault();
    EditAircraftData();
  });

  $('#edit-aircraft-button').on('click', () => {
    GetEditAircraftData();
    EditAircraftDialog.dialog('open');
    $('#edit_reg').focus();
  });

  $('#exportDbButton').on('click', (event) => {
    event.preventDefault();
    ExportDB();
  });

  $('#importDbButton').on('change', (event) => {
    event.preventDefault();
    ImportDB(event.target.files);
    event.target.value = null;
  });

  $('#icao').on('click', sortByICAO);
  $('#flag').on('click', sortByCountry);
  $('#flight').on('click', sortByFlight);
  $('#registration').on('click', sortByRegistration);
  $('#civil_mil').on('click', sortByCivilMil);
  $('#aircraft_type').on('click', sortByAircraftType);
  $('#squawk').on('click', sortBySquawk);
  $('#altitude').on('click', sortByAltitude);
  $('#speed').on('click', sortBySpeed);
  $('#vert_rate').on('click', sortByVerticalRate);
  $('#distance').on('click', sortByDistance);
  $('#track').on('click', sortByTrack);
  $('#msgs').on('click', sortByMsgs);
  $('#seen').on('click', sortBySeen);
  $('#rssi').on('click', sortByRssi);
  $('#lat').on('click', sortByLatitude);
  $('#lon').on('click', sortByLongitude);
  $('#data_source').on('click', sortByDataSource);

  // Start web application
  DatabaseInit();
});
