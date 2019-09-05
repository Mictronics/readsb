// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// layers.js: providing layers for map view
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This code is based on a detached fork of dump1090-fa.
//
// Additional layers by Al Kissack
// https://github.com/alkissack/Dump1090-OpenLayers3-html
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

import {
  BingMapsAPIKey,
  ChartBundleLayers,
  ShowAdditionalMaps,
  ShowEULayers,
  ShowUSLayers,
  SkyVectorAPIKey,
} from './config.js';
import './ol3/ol.js';

function svDate() {
  const e = new Date();
  const t = Math.round(e.getTime() / 1e3);
  const a = Math.floor((t - 1263459660) / 2419200);
  const r = new Date(e.getFullYear(), 0, 1);
  const i = Math.round(r.getTime() / 1e3);
  const n = Math.floor((i - 1263459660) / 2419200);
  let o = a - n;
  let s = e.getFullYear() - 2e3;

  if (o === 0) {
    o = 13;
    s -= 1;
  }

  let l = o.toFixed(0);

  if (l.length === 1) {
    l = '0'.concat(l);
  }

  return s.toFixed(0) + l;
}

// Base layers configuration
export default function CreateBaseLayers() {
  const layers = [];

  const world = [];
  const us = [];
  const eu = [];

  if (
    ShowAdditionalMaps
    && typeof SkyVectorAPIKey !== 'undefined'
    && SkyVectorAPIKey !== null
  ) {
    const d = svDate();

    world.push(
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: `//t.skyvector.com/${SkyVectorAPIKey}/hi/${d}/{z}/{x}/{y}.jpg`,
          attributions:
            'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
        }),
        name: 'world_hi',
        title: 'Enroute High >18000ft MSL',
        type: 'base',
        minZoom: 1,
        maxZoom: 9,
      }),
    );

    world.push(
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: `//t.skyvector.com/${SkyVectorAPIKey}/lo/${d}/{z}/{x}/{y}.jpg`,
          attributions:
            'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
        }),
        name: 'world_lo',
        title: 'Enroute Low <18000ft MSL',
        type: 'base',
        minZoom: 1,
        maxZoom: 10,
      }),
    );

    world.push(
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: `//t.skyvector.com/${SkyVectorAPIKey}/vfr/${d}/{z}/{x}/{y}.jpg`,
          attributions:
            'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
        }),
        name: 'world_vfr',
        title: 'VFR',
        type: 'base',
        minZoom: 1,
        maxZoom: 11,
      }),
    );
  }

  if (ShowAdditionalMaps) {
    world.push(
      new ol.layer.Tile({
        source: new ol.source.OSM({
          url: 'http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        }),
        name: 'osm light',
        title: 'OpenStreetMap Light',
        type: 'base',
      }),
    );
  }

  world.push(
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      name: 'osm',
      title: 'OpenStreetMap',
      type: 'base',
    }),
  );

  if (ShowAdditionalMaps) {
    world.push(
      new ol.layer.Tile({
        source: new ol.source.OSM({
          url: 'http://{a-d}.tile.stamen.com/terrain/{z}/{x}/{y}.png',
          attributions:
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
            + 'Data by <a _href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
        }),
        name: 'terrain',
        title: 'Terrain + Roads',
        type: 'base',
      }),
    );

    world.push(
      new ol.layer.Tile({
        source: new ol.source.OSM({
          url:
            'http://{a-d}.tile.stamen.com/terrain-background/{z}/{x}/{y}.png',
          attributions:
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
            + 'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
        }),
        name: 'terrain',
        title: 'Terrain',
        type: 'base',
      }),
    );
  }

  if (BingMapsAPIKey) {
    world.push(
      new ol.layer.Tile({
        source: new ol.source.BingMaps({
          key: BingMapsAPIKey,
          imagerySet: 'Aerial',
        }),
        name: 'bing_aerial',
        title: 'Bing Aerial',
        type: 'base',
      }),
    );
    world.push(
      new ol.layer.Tile({
        source: new ol.source.BingMaps({
          key: BingMapsAPIKey,
          imagerySet: 'Road',
        }),
        name: 'bing_roads',
        title: 'Bing Roads',
        type: 'base',
      }),
    );
  }

  if (ShowUSLayers) {
    if (ChartBundleLayers) {
      const chartbundleTypes = {
        sec: 'Sectional Charts',
        tac: 'Terminal Area Charts',
        wac: 'World Aeronautical Charts',
        enrl: 'IFR Enroute Low Charts',
        enra: 'IFR Area Charts',
        enrh: 'IFR Enroute High Charts',
      };
      Object.keys(chartbundleTypes).forEach((type) => {
        us.push(
          new ol.layer.Tile({
            source: new ol.source.TileWMS({
              url: 'http://wms.chartbundle.com/wms',
              params: { LAYERS: type },
              projection: 'EPSG:3857',
              attributions:
                'Tiles courtesy of <a href="http://www.chartbundle.com/">ChartBundle</a>',
            }),
            name: `chartbundle_${type}`,
            title: chartbundleTypes[type],
            type: 'base',
            group: 'chartbundle',
          }),
        );
      });
    }
    const nexrad = new ol.layer.Tile({
      name: 'nexrad',
      title: 'NEXRAD',
      type: 'overlay',
      opacity: 0.5,
      visible: false,
    });
    us.push(nexrad);

    const refreshNexrad = () => {
      // re-build the source to force a refresh of the nexrad tiles
      const now = new Date().getTime();
      nexrad.setSource(
        new ol.source.XYZ({
          url: `http://mesonet{1-3}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${now}`,
          attributions:
            'NEXRAD courtesy of <a href="http://mesonet.agron.iastate.edu/">IEM</a>',
        }),
      );
    };
    refreshNexrad();
    window.setInterval(refreshNexrad, 5 * 60000);
  }

  if (ShowEULayers) {
    eu.push(
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url:
            'https://snapshots.openflightmaps.org/live/1808/tiles/world/noninteractive/epsg3857/merged/512/latest/{z}/{x}/{y}.png',
        }),
        name: 'ofm',
        title: 'OpenFlightMap',
        type: 'base',
        minZoom: 4,
        maxZoom: 11,
        opacity: 0.75,
      }),
    );

    const dwd = new ol.layer.Tile({
      source: new ol.source.TileWMS({
        url: 'https://maps.dwd.de/geoserver/wms',
        params: { LAYERS: 'dwd:RX-Produkt', validtime: new Date().getTime() },
        projection: 'EPSG:3857',
        attributions: 'Deutscher Wetterdienst (DWD)',
      }),
      name: 'radolan',
      title: 'DWD RADOLAN',
      type: 'overlay',
      opacity: 0.3,
      visible: false,
    });
    eu.push(dwd);

    const refreshDwd = () => {
      dwd.getSource().updateParams({ validtime: new Date().getTime() });
    };
    refreshDwd();
    window.setInterval(refreshDwd, 5 * 60000);
  }

  if (world.length > 0) {
    layers.push(
      new ol.layer.Group({
        name: 'world',
        title: 'Worldwide',
        layers: world,
      }),
    );
  }

  if (us.length > 0) {
    layers.push(
      new ol.layer.Group({
        name: 'us',
        title: 'US',
        layers: us,
      }),
    );
  }

  if (eu.length > 0) {
    layers.push(
      new ol.layer.Group({
        name: 'eu',
        title: 'EU',
        layers: eu,
      }),
    );
  }

  return layers;
}
