import React, { useState, useRef } from "react";
import { formatRupiah } from "@/lib/formatRupiah";

interface PriceChartProps {
  prices: number[];     // Fallback data (30 hari)
  prices60d?: number[]; // Data lengkap (60 hari) untuk zoom out
  sma20: number;
  sma50: number;
  symbol: string;
}

type Timeframe = "7d" | "15d" | "30d" | "60d";

export default function PriceChart({ prices, prices60d, sma20, sma50, symbol }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sumber data utama: gunakan 60d jika ada, jika tidak fallback ke 30d
  const rawData = prices60d && prices60d.length > 0 ? prices60d : prices;

  if (!rawData || rawData.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm h-64 flex items-center justify-center text-xs text-neutral-400 dark:text-zinc-500 animate-pulse">
        Menyiapkan data grafik...
      </div>
    );
  }

  // Tentukan jumlah data berdasarkan timeframe terpilih
  let dataPointsCount = 30;
  if (timeframe === "7d") dataPointsCount = 7;
  else if (timeframe === "15d") dataPointsCount = 15;
  else if (timeframe === "30d") dataPointsCount = 30;
  else if (timeframe === "60d") dataPointsCount = 60;

  // Batasi agar tidak melebih panjang rawData yang tersedia
  const dataLen = Math.min(rawData.length, dataPointsCount);
  const activePrices = rawData.slice(-dataLen);

  // Fungsi hitung SMA nyata historis untuk data aktif
  const calculateSmaHistory = (data: number[], period: number) => {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - period + 1);
      const subset = data.slice(start, i + 1);
      const sum = subset.reduce((acc, val) => acc + val, 0);
      sma.push(sum / subset.length);
    }
    return sma;
  };

  const activeSma20 = calculateSmaHistory(activePrices, 20);
  const activeSma50 = calculateSmaHistory(activePrices, 50);

  // Parameter SVG & Padding
  const width = 600;
  const height = 260;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Temukan harga Min & Max untuk penentuan skala Y
  const maxPrice = Math.max(...activePrices);
  const minPrice = Math.min(...activePrices);
  
  // Berikan margin 8% agar garis tidak menyentuh ujung atas/bawah grafik
  const priceRange = maxPrice - minPrice;
  const marginRange = priceRange === 0 ? 100 : priceRange * 0.08;
  const yMax = maxPrice + marginRange;
  const yMin = Math.max(0, minPrice - marginRange);
  const yRange = yMax - yMin;

  // Konversi data harga ke koordinat SVG (X, Y)
  const getCoordinates = (data: number[]) => {
    const points: { x: number; y: number }[] = [];
    const len = data.length;
    for (let i = 0; i < len; i++) {
      const x = paddingLeft + (i / (len - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((data[i] - yMin) / (yRange || 1)) * chartHeight;
      points.push({ x, y });
    }
    return points;
  };

  const pricePoints = getCoordinates(activePrices);
  const sma20Points = getCoordinates(activeSma20);
  const sma50Points = getCoordinates(activeSma50);

  // Fungsi menggambar polyline path
  const getPathD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  };

  const linePath = getPathD(pricePoints);
  const sma20Path = sma20 > 0 ? getPathD(sma20Points) : "";
  const sma50Path = sma50 > 0 ? getPathD(sma50Points) : "";

  // Format label harga Y axis
  const formatYLabel = (val: number) => {
    if (symbol === "USDIDR") return `Rp${val.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
    return val.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  };

  // Generate 4 sumbu horizontal grid lines
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i < gridCount; i++) {
    const yVal = yMin + (i / (gridCount - 1)) * yRange;
    const yPos = paddingTop + chartHeight - (i / (gridCount - 1)) * chartHeight;
    gridLines.push({ yPos, label: formatYLabel(yVal) });
  }

  // Generate tanggal untuk sumbu X
  const getDates = () => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < dataLen; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (dataLen - 1 - i));
      dates.push(
        date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })
      );
    }
    return dates;
  };
  const activeDates = getDates();

  // Helper untuk format detail harga di tooltip
  const formatTooltipPrice = (val: number) => {
    if (symbol === "USDIDR") {
      return `Rp ${val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatRupiah(val);
  };

  // Helper mendapatkan format tanggal panjang untuk tooltip
  const getTooltipDate = (index: number) => {
    const now = new Date();
    const date = new Date(now);
    date.setDate(now.getDate() - (dataLen - 1 - index));
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Penanganan interaksi kursor/sentuhan
  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Hitung posisi relative terhadap container
    const xRel = clientX - rect.left;
    const yRel = clientY - rect.top;

    // Konversi posisi relative X ke koordinat internal SVG (skala viewBox)
    const svgX = (xRel / rect.width) * width;

    // Batasi kursor dalam area chartWidth saja
    if (svgX < paddingLeft || svgX > width - paddingRight) {
      setHoveredIndex(null);
      setTooltipPos(null);
      return;
    }

    const pct = (svgX - paddingLeft) / chartWidth;
    const idx = Math.min(dataLen - 1, Math.max(0, Math.round(pct * (dataLen - 1))));

    setHoveredIndex(idx);

    // Hitung posisi tooltip HTML absolut
    const tooltipX = rect.left - rect.left + (pricePoints[idx].x / width) * rect.width;
    const tooltipY = Math.max(20, (pricePoints[idx].y / height) * rect.height - 85);
    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  // Tentukan indeks tanggal sumbu X yang ditampilkan (tampilkan 4 label agar proporsional)
  const labelIndices = [
    0,
    Math.floor((dataLen - 1) * 0.33),
    Math.floor((dataLen - 1) * 0.66),
    dataLen - 1,
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 select-none relative">
      
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-zinc-200">
            Grafik Harga Historis ({timeframe === "7d" ? "7 Hari" : timeframe === "15d" ? "15 Hari" : timeframe === "30d" ? "30 Hari" : "60 Hari"})
          </h3>
          <p className="text-[10px] text-neutral-450 dark:text-zinc-500 font-semibold mt-0.5 sm:block hidden">
            Arahkan kursor ke grafik untuk melihat harga spesifik & waktu
          </p>
        </div>

        {/* Timeframe Selectors & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend indicator */}
          <div className="flex items-center gap-2.5 text-[9px] font-extrabold">
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <span className="h-1.5 w-2.5 bg-orange-600 rounded-full"></span> Harga
            </span>
            {sma20 > 0 && (
              <span className="flex items-center gap-1 text-blue-500">
                <span className="h-1.5 w-2.5 bg-blue-500 rounded-full"></span> SMA20
              </span>
            )}
            {sma50 > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <span className="h-1.5 w-2.5 bg-amber-500 rounded-full"></span> SMA50
              </span>
            )}
          </div>

          {/* Timeframe Zoom Buttons */}
          <div className="flex items-center bg-neutral-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-neutral-200 dark:border-zinc-700/60">
            {(["7d", "15d", "30d", "60d"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  handleLeave();
                }}
                className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-zinc-100 shadow-sm"
                    : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200"
                }`}
              >
                {tf === "7d" ? "7H" : tf === "15d" ? "15H" : tf === "30d" ? "30H" : "60H"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Area Canvas SVG */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseLeave={handleLeave}
        onTouchEnd={handleLeave}
        className="w-full relative cursor-crosshair overflow-visible"
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Grid Lines & Y Axis Labels */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.yPos} 
                x2={width - paddingRight} 
                y2={line.yPos} 
                className="stroke-neutral-100 dark:stroke-zinc-800/80" 
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={line.yPos + 3.5} 
                className="fill-neutral-400 dark:fill-zinc-500 text-[9px] font-black text-right" 
                textAnchor="end"
              >
                {line.label}
              </text>
            </g>
          ))}

          {/* Area Fill Gradient under Price Line */}
          {pricePoints.length > 0 && (
            <g>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <path 
                d={`${linePath} L ${(pricePoints[pricePoints.length - 1].x).toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${(pricePoints[0].x).toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`}
                fill="url(#chartGradient)"
              />
            </g>
          )}

          {/* SMA 20 Overlay Path (Blue) */}
          {sma20Path && (
            <path 
              d={sma20Path} 
              fill="none" 
              className="stroke-blue-400/80 dark:stroke-blue-500/60" 
              strokeWidth={1.5}
              strokeDasharray="1 1"
            />
          )}

          {/* SMA 50 Overlay Path (Amber) */}
          {sma50Path && (
            <path 
              d={sma50Path} 
              fill="none" 
              className="stroke-amber-400/80 dark:stroke-amber-500/60" 
              strokeWidth={1.5}
              strokeDasharray="1 1"
            />
          )}

          {/* Price Line Path (Orange) */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              className="stroke-orange-500 dark:stroke-orange-500" 
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Sumbu X Axis Bottom Line */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop + chartHeight} 
            x2={width - paddingRight} 
            y2={paddingTop + chartHeight} 
            className="stroke-neutral-200 dark:stroke-zinc-800" 
            strokeWidth={1.2}
          />

          {/* Sumbu X Labels (Spread 4 dates) */}
          {labelIndices.map((index) => {
            if (index >= pricePoints.length) return null;
            const pt = pricePoints[index];
            const anchor = index === 0 ? "start" : index === dataLen - 1 ? "end" : "middle";
            return (
              <text 
                key={index}
                x={pt.x} 
                y={height - 10} 
                className="fill-neutral-400 dark:fill-zinc-500 text-[9px] font-bold"
                textAnchor={anchor}
              >
                {activeDates[index]}
              </text>
            );
          })}

          {/* Interactive Hover Indicators */}
          {hoveredIndex !== null && (
            <g>
              {/* Vertical Dashed Line */}
              <line
                x1={pricePoints[hoveredIndex].x}
                y1={paddingTop}
                x2={pricePoints[hoveredIndex].x}
                y2={paddingTop + chartHeight}
                className="stroke-neutral-350 dark:stroke-zinc-700"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />

              {/* SMA50 Indicator Dot */}
              {sma50Path && hoveredIndex < activeSma50.length && (
                <circle
                  cx={sma50Points[hoveredIndex].x}
                  cy={sma50Points[hoveredIndex].y}
                  r={4}
                  className="fill-amber-500 stroke-white dark:stroke-zinc-900"
                  strokeWidth={1.5}
                />
              )}

              {/* SMA20 Indicator Dot */}
              {sma20Path && hoveredIndex < activeSma20.length && (
                <circle
                  cx={sma20Points[hoveredIndex].x}
                  cy={sma20Points[hoveredIndex].y}
                  r={4}
                  className="fill-blue-500 stroke-white dark:stroke-zinc-900"
                  strokeWidth={1.5}
                />
              )}

              {/* Price Indicator Dot */}
              <circle
                cx={pricePoints[hoveredIndex].x}
                cy={pricePoints[hoveredIndex].y}
                r={6}
                className="fill-orange-500 stroke-white dark:stroke-zinc-900"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Floating HTML Glassmorphic Tooltip */}
        {hoveredIndex !== null && tooltipPos && (
          <div
            className="absolute z-10 pointer-events-none transform -translate-x-1/2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-neutral-200 dark:border-zinc-800 p-3 rounded-2xl shadow-xl space-y-1 text-left min-w-[150px] transition-all duration-75"
            style={{ 
              left: `${tooltipPos.x}px`, 
              top: `${tooltipPos.y}px` 
            }}
          >
            <p className="text-[9px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-wide">
              {getTooltipDate(hoveredIndex)}
            </p>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-400 flex items-center justify-between gap-3">
                <span>Harga:</span>
                <span className="font-extrabold text-neutral-850 dark:text-zinc-200">
                  {formatTooltipPrice(activePrices[hoveredIndex])}
                </span>
              </p>
              
              {sma20 > 0 && hoveredIndex < activeSma20.length && (
                <p className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-400 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span> SMA20:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatTooltipPrice(activeSma20[hoveredIndex])}
                  </span>
                </p>
              )}

              {sma50 > 0 && hoveredIndex < activeSma50.length && (
                <p className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-400 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span> SMA50:
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatTooltipPrice(activeSma50[hoveredIndex])}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

