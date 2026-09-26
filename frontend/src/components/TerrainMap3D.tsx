/**
 * 3D terrain map, shared by the Authority Risk Map (GisMap.tsx) and the
 * public Near Me map (NearMeMap.tsx). Built with MapLibre GL JS — the
 * open-source fork of Mapbox GL from before Mapbox went closed-source —
 * so it needs no API key, matching the rest of this project's tile setup.
 *
 * Data sources (both free, no key, no account):
 *  - Base imagery: OpenStreetMap raster tiles (same source the 2D map uses)
 *  - Terrain elevation: AWS's public Terrarium DEM tiles (part of the AWS
 *    Open Data program) — this is what actually drives the 3D extrusion,
 *    so real Himalayan slopes appear as real slopes, not a flat photo.
 *
 * This is a toggle alongside the existing 2D Leaflet map, not a
 * replacement — if anything about WebGL/terrain rendering doesn't work in
 * a given browser, the 2D map is still there.
 */
import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface TerrainMarker {
  lon: number;
  lat: number;
  color: string;
  popupHtml: string;
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
  radiusColor = '#5b93bc',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerObjsRef = useRef<maplibregl.Marker[]>([]);

  // Initialize once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-raster': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
          'aws-terrain': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
            maxzoom: 15,
          },
        },
        layers: [
          { id: 'osm-tiles', type: 'raster', source: 'osm-raster' },
        ],
        terrain: { source: 'aws-terrain', exaggeration: 1.5 },
        sky: {
          'sky-color': '#1f1d1d',
          'horizon-color': '#353232',
          'fog-color': '#292727',
        } as unknown as maplibregl.SkySpecification,
      },
      center: [centerLon, centerLat],
      zoom,
      pitch: 60,
      maxPitch: 85,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(
      new maplibregl.TerrainControl({ source: 'aws-terrain', exaggeration: 1.5 }),
      'top-right'
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Recenter when the target location changes
  useEffect(() => {
    mapRef.current?.jumpTo({ center: [centerLon, centerLat], zoom });
  }, [centerLon, centerLat, zoom]);

  // Markers + radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyMarkers = () => {
      markerObjsRef.current.forEach((m) => m.remove());
      markerObjsRef.current = markers.map((m) => {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.background = m.color;
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 4px rgba(0,0,0,0.6)';
        return new maplibregl.Marker({ element: el })
          .setLngLat([m.lon, m.lat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(m.popupHtml))
          .addTo(map);
      });

      if (radiusKm) {
        const circleGeoJson = makeCircleGeoJson(centerLon, centerLat, radiusKm);
        if (map.getSource('radius-circle')) {
          (map.getSource('radius-circle') as maplibregl.GeoJSONSource).setData(circleGeoJson);
        } else {
          map.addSource('radius-circle', { type: 'geojson', data: circleGeoJson });
          map.addLayer({
            id: 'radius-circle-fill',
            type: 'fill',
            source: 'radius-circle',
            paint: { 'fill-color': radiusColor, 'fill-opacity': 0.05 },
          });
          map.addLayer({
            id: 'radius-circle-line',
            type: 'line',
            source: 'radius-circle',
            paint: { 'line-color': radiusColor, 'line-width': 1.5 },
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyMarkers();
    } else {
      map.once('load', applyMarkers);
    }
  }, [markers, radiusKm, radiusColor, centerLon, centerLat]);

  return <div ref={containerRef} class="w-full h-full" />;
};

/** Builds a GeoJSON polygon approximating a circle of the given radius (km). */
function makeCircleGeoJson(lon: number, lat: number, radiusKm: number) {
  const points = 64;
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusKm / 110.57;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coords.push([lon + distanceX * Math.cos(theta), lat + distanceY * Math.sin(theta)]);
  }
  coords.push(coords[0]);
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}
