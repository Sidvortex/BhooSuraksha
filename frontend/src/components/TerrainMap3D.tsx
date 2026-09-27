/**
 * Full 3D map, shared by the Authority Risk Map (GisMap.tsx) and the public
 * Near Me map (NearMeMap.tsx). MapLibre GL JS with free, key-less data:
 *
 *  - OpenFreeMap "liberty" vector style: roads, water, place labels and
 *    building footprints with real OpenStreetMap heights
 *  - AWS Terrarium elevation tiles: real terrain relief + hillshading
 *  - 3D building extrusions (visible when zoomed into a town, ~zoom 14+)
 *  - risk zones rendered as 3D columns whose height tracks probability
 *
 * Building coverage depends on OpenStreetMap: dense in cities like Guwahati
 * or Shillong, sparse in remote hill villages. Buildings without a height
 * tag are drawn at OpenMapTiles' default height.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// maplibre decodes tiles and terrain in a web worker that it locates at
// runtime from a string, which bundlers can't see — so in both `vite dev`
// and production builds the worker file went missing (404) and 3D terrain
// silently never built. `?worker&url` makes Vite bundle the worker together
// with its shared chunk and hand us its real URL.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export const TERRAIN_3D_HINT = 'Column height = risk probability · zoom into a town for 3D buildings · right-drag (or two-finger drag) to tilt and rotate';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

export interface TerrainMarker {
  lon: number;
  lat: number;
  color: string;
  popupHtml: string;
  /** 0-1. When set, the point is also drawn as a 3D risk column this tall. */
  weight?: number;
}

interface TerrainMap3DProps {
  centerLon: number;
  centerLat: number;
  zoom?: number;
  markers: TerrainMarker[];
  radiusKm?: number;
  radiusColor?: string;
}

export const TerrainMap3D: React.FC<TerrainMap3DProps> = ({
  centerLon,
  centerLat,
  zoom = 9,
  markers,
  radiusKm,
  radiusColor = '#1c4f9e',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerObjsRef = useRef<maplibregl.Marker[]>([]);
  const [styleReady, setStyleReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Initialise once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [centerLon, centerLat],
      zoom,
      pitch: 62,
      bearing: -20,
      maxPitch: 85,
      canvasContextAttributes: { antialias: true },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    if (import.meta.env.DEV) {
      (window as unknown as { __bhooMap3d?: maplibregl.Map }).__bhooMap3d = map; // debugging aid in dev only
    }

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    // A style-level failure (no sourceId) means the base map itself didn't load
    map.on('error', (e) => {
      if (!map.isStyleLoaded() && !(e as unknown as { sourceId?: string }).sourceId) setLoadError(true);
    });

    // 'style.load', not 'load': 'load' waits for every initial tile to
    // download, so on a slow or flaky connection (common in hill districts)
    // one stalled tile would keep terrain, buildings and risk columns from
    // ever appearing. The style being parsed is all these layers need.
    map.on('style.load', () => {
      const firstLabelLayer = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;

      // Terrain relief (separate source for hillshade, as MapLibre recommends)
      map.addSource('terrain-dem', { type: 'raster-dem', tiles: [TERRAIN_TILES], tileSize: 256, encoding: 'terrarium', maxzoom: 14 });
      map.addSource('hillshade-dem', { type: 'raster-dem', tiles: [TERRAIN_TILES], tileSize: 256, encoding: 'terrarium', maxzoom: 14 });
      map.setTerrain({ source: 'terrain-dem', exaggeration: 1.4 });
      map.addLayer(
        { id: 'bhoo-hillshade', type: 'hillshade', source: 'hillshade-dem', paint: { 'hillshade-exaggeration': 0.45, 'hillshade-shadow-color': '#2d3a4a' } },
        firstLabelLayer,
      );

      // 3D buildings: liberty ships an extrusion layer; add one if the style lacks it
      const layers = map.getStyle().layers;
      const hasExtrusion = layers.some((l) => l.type === 'fill-extrusion');
      const buildingLayer = layers.find((l) => 'source-layer' in l && l['source-layer'] === 'building') as { source?: string } | undefined;
      if (!hasExtrusion && buildingLayer?.source) {
        map.addLayer(
          {
            id: 'bhoo-3d-buildings',
            type: 'fill-extrusion',
            source: buildingLayer.source,
            'source-layer': 'building',
            minzoom: 13,
            paint: {
              'fill-extrusion-color': '#d8d2c8',
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 15, ['coalesce', ['get', 'render_height'], 6]],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.9,
            },
          },
          firstLabelLayer,
        );
      }

      map.setSky({
        'sky-color': '#9cc3e6',
        'horizon-color': '#dfe9f3',
        'fog-color': '#eef2f7',
        'sky-horizon-blend': 0.6,
        'horizon-fog-blend': 0.6,
        'fog-ground-blend': 0.4,
      });

      setStyleReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Recenter when the target location changes
  useEffect(() => {
    mapRef.current?.jumpTo({ center: [centerLon, centerLat], zoom });
  }, [centerLon, centerLat, zoom]);

  // Markers, risk columns and radius ring
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    markerObjsRef.current.forEach((m) => m.remove());
    markerObjsRef.current = markers.map((m) => {
      const el = document.createElement('div');
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${m.color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.6)`;
      return new maplibregl.Marker({ element: el })
        .setLngLat([m.lon, m.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(m.popupHtml))
        .addTo(map);
    });

    const columns: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: markers
        .filter((m) => m.weight !== undefined)
        .map((m) => ({
          // ~4 km wide, 3-30 km tall: readable at regional zoom, height still
          // proportional to risk probability
          ...circlePolygon(m.lon, m.lat, 4),
          properties: { color: m.color, height: 3000 + (m.weight ?? 0) * 27000 },
        })),
    };
    setGeoJson(map, 'bhoo-risk-columns', columns);
    if (!map.getLayer('bhoo-risk-columns')) {
      map.addLayer({
        id: 'bhoo-risk-columns',
        type: 'fill-extrusion',
        source: 'bhoo-risk-columns',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          // full height at regional zoom, shrinking as you zoom into a town
          // so buildings and terrain stay readable
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 7, ['get', 'height'], 13, ['*', ['get', 'height'], 0.12]],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8,
        },
      });
    }

    if (radiusKm) {
      setGeoJson(map, 'bhoo-radius', { type: 'FeatureCollection', features: [circlePolygon(centerLon, centerLat, radiusKm)] });
      if (!map.getLayer('bhoo-radius-line')) {
        map.addLayer({ id: 'bhoo-radius-fill', type: 'fill', source: 'bhoo-radius', paint: { 'fill-color': radiusColor, 'fill-opacity': 0.05 } });
        map.addLayer({ id: 'bhoo-radius-line', type: 'line', source: 'bhoo-radius', paint: { 'line-color': radiusColor, 'line-width': 2 } });
      }
    }
  }, [markers, radiusKm, radiusColor, centerLon, centerLat, styleReady]);

  return (
    <div class="relative w-full h-full">
      <div ref={containerRef} class="w-full h-full" />
      {loadError && (
        <div class="absolute inset-0 flex items-center justify-center bg-gov-page/90 text-sm text-slate-300 p-4 text-center">
          Couldn't load the 3D map data (OpenFreeMap). Check your internet connection, or use the 2D map.
        </div>
      )}
    </div>
  );
};

function setGeoJson(map: maplibregl.Map, id: string, data: GeoJSON.FeatureCollection) {
  const src = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (src) src.setData(data);
  else map.addSource(id, { type: 'geojson', data });
}

/** GeoJSON polygon approximating a circle of the given radius (km). */
function circlePolygon(lon: number, lat: number, radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 48;
  const dx = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const dy = radiusKm / 110.57;
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * 2 * Math.PI;
    coords.push([lon + dx * Math.cos(t), lat + dy * Math.sin(t)]);
  }
  coords.push(coords[0]);
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} };
}
