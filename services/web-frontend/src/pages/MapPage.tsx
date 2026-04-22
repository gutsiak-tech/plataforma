import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { TopNav } from "../components/layout/TopNav";
import { useDashboardSummary, useSetMapCompetenciaMutation } from "../lib/query/hooks";

const TILES_URL = import.meta.env.VITE_TILES_URL || "http://localhost:8080";
const LAYER_ID = "caged_saldo";
const DEFAULT_MIN = -500;
const DEFAULT_MAX = 500;
const PR_BOUNDS: [[number, number], [number, number]] = [[-54, -27], [-48, -22]];
const TILES_TEMPLATE = `${TILES_URL}/maps/municipios/{z}/{x}/{y}.pbf`;

export function MapPage() {
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isInitializedRef = useRef(false);
  const uf = searchParams.get("uf") || "PR";
  const competencia = searchParams.get("competencia") || "";

  const [bounds, setBounds] = useState<{ min: number; max: number }>({ min: DEFAULT_MIN, max: DEFAULT_MAX });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; municipio: string; saldo_sum: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const setCompetenciaMutation = useSetMapCompetenciaMutation();
  const summary = useDashboardSummary(uf, competencia);

  const runWhenStyleReady = useCallback((map: maplibregl.Map, fn: () => void) => {
    if (map.isStyleLoaded()) {
      fn();
      return;
    }
    map.once("styledata", () => {
      if (map.isStyleLoaded()) {
        fn();
      }
    });
  }, []);

  const refreshTiles = useCallback((uf: string, competencia: string) => {
    setCompetenciaMutation.mutate({ uf, competenciamov: competencia });
    const map = mapRef.current;
    if (!map) return;
    runWhenStyleReady(map, () => {
      // Keep one map instance; update layer filters only.
      const layerFilter: unknown[] = [
        "all",
        ["==", ["get", "uf"], uf],
        ["==", ["get", "competenciamov"], competencia],
      ];
      if (map.getLayer(LAYER_ID)) {
        map.setFilter(LAYER_ID, layerFilter as never);
      }
      if (map.getLayer(`${LAYER_ID}-outline`)) {
        map.setFilter(`${LAYER_ID}-outline`, layerFilter as never);
      }
    });
  }, [runWhenStyleReady, setCompetenciaMutation]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    if (isInitializedRef.current) return;

    console.info("[MAP] init", { styleUrl: "inline-style-v8", tilesUrl: TILES_TEMPLATE });

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          [LAYER_ID]: {
            type: "vector",
            tiles: [TILES_TEMPLATE],
            bounds: [-54, -27, -48, -22],
            minzoom: 3,
            maxzoom: 10,
          },
        },
        layers: [
          {
            id: LAYER_ID,
            type: "fill-extrusion",
            source: LAYER_ID,
            "source-layer": LAYER_ID,
            paint: {
              "fill-extrusion-color": [
                "case",
                ["<", ["get", "saldo_sum"], 0],
                [
                  "interpolate",
                  ["linear"],
                  ["get", "saldo_sum"],
                  DEFAULT_MIN,
                  "#7f1d1d",
                  DEFAULT_MIN * 0.5,
                  "#b91c1c",
                  -1,
                  "#f87171",
                  0,
                  "#fff1f2",
                ],
                [
                  "interpolate",
                  ["linear"],
                  ["get", "saldo_sum"],
                  0,
                  "#ecfeff",
                  DEFAULT_MAX * 0.5,
                  "#14b8a6",
                  DEFAULT_MAX,
                  "#065f46",
                ],
              ],
              // Height in meters proportional to absolute saldo magnitude.
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["abs", ["to-number", ["get", "saldo_sum"]]],
                0,
                0,
                100,
                6500,
                500,
                20000,
                1000,
                34000,
                5000,
                76000,
              ],
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.9,
            },
          },
          {
            id: `${LAYER_ID}-outline`,
            type: "line",
            source: LAYER_ID,
            "source-layer": LAYER_ID,
            paint: { "line-color": "#333", "line-width": 0.5 },
          },
        ],
      },
      center: [-51, -24.5],
      zoom: 6,
      minZoom: 3,
      maxZoom: 10,
      renderWorldCopies: false,
      pitch: 50,
      bearing: 0,
    });

    map.on("load", () => {
      console.info("[MAP] load");
      map.fitBounds(PR_BOUNDS, {
        padding: { top: 4, right: 4, bottom: 4, left: 4 },
        duration: 0,
        maxZoom: 9.2,
      });
      map.easeTo({ pitch: 50, bearing: 0, duration: 0 });
    });

    map.on("error", (e) => {
      const err = (e as { error?: { name?: string; message?: string } }).error;
      console.warn("[MAP] error", err?.name, err?.message);
    });

    map.on("mousemove", LAYER_ID, (e) => {
      map.getCanvas().style.cursor = "pointer";
      if (!e.features?.length) {
        setTooltip(null);
        return;
      }
      const f = e.features[0];
      const props = f.properties;
      const municipio = (props?.municipio_display ?? props?.municipio ?? "—") as string;
      const saldo = (props?.saldo_sum ?? 0) as number;
      setTooltip({
        x: e.point.x,
        y: e.point.y,
        municipio,
        saldo_sum: saldo,
      });
    });
    map.on("mouseleave", LAYER_ID, () => {
      setTooltip(null);
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;
    isInitializedRef.current = true;

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  // Sync map tiles with dashboard URL params (uf, competencia)
  useEffect(() => {
    if (!competencia || !uf) return;
    refreshTiles(uf, competencia);
  }, [uf, competencia]);

  // Update fill-color scale when bounds (from dashboard summary) change
  useEffect(() => {
    const min = summary.data?.min_saldo ?? DEFAULT_MIN;
    const max = summary.data?.max_saldo ?? DEFAULT_MAX;
    setBounds({ min, max: max !== min ? max : min + 1 });
  }, [summary.data?.max_saldo, summary.data?.min_saldo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    runWhenStyleReady(map, () => {
      const layer = map.getLayer(LAYER_ID);
      if (!layer || layer.type !== "fill-extrusion") return;
      map.setPaintProperty(LAYER_ID, "fill-extrusion-color", [
        "case",
        ["<", ["get", "saldo_sum"], 0],
        [
          "interpolate",
          ["linear"],
          ["get", "saldo_sum"],
          bounds.min,
          "#7f1d1d",
          bounds.min * 0.5,
          "#b91c1c",
          -1,
          "#f87171",
          0,
          "#fff1f2",
        ],
        [
          "interpolate",
          ["linear"],
          ["get", "saldo_sum"],
          0,
          "#ecfeff",
          bounds.max * 0.5,
          "#14b8a6",
          bounds.max,
          "#065f46",
        ],
      ]);
      const maxAbs = Math.max(Math.abs(bounds.min), Math.abs(bounds.max), 1);
      map.setPaintProperty(LAYER_ID, "fill-extrusion-height", [
        "interpolate",
        ["linear"],
        ["abs", ["to-number", ["get", "saldo_sum"]]],
        0,
        0,
        maxAbs * 0.08,
        8000,
        maxAbs * 0.2,
        22000,
        maxAbs * 0.5,
        44000,
        maxAbs,
        90000,
      ]);
    });
  }, [bounds, runWhenStyleReady]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div ref={mapContainerRef} className="map-container h-full w-full" />
        {tooltip && (
        <div
          ref={tooltipRef}
          className="map-tooltip"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <strong>{tooltip.municipio}</strong>
          <br />
          Saldo: {tooltip.saldo_sum.toLocaleString("pt-BR")}
        </div>
      )}
      </motion.div>
      <div className="absolute left-0 right-0 top-0 z-20">
        <TopNav uf={uf} competencia={competencia} />
      </div>
    </div>
  );
}
