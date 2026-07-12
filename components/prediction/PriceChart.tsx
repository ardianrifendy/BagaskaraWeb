import React from "react";

interface PriceChartProps {
  prices: number[];
  sma20: number;
  sma50: number;
  symbol: string;
}

export default function PriceChart({ prices, sma20, sma50, symbol }: PriceChartProps) {
  // Hanya render jika ada data penutupan yang cukup
  if (!prices || prices.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm h-64 flex items-center justify-center text-xs text-neutral-400 dark:text-zinc-500 animate-pulse">
        Menyiapkan data grafik...
      </div>
    );
  }

  // Parameter SVG & Padding
  const width = 500;
  const height = 220;
  const paddingLeft = 65;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Temukan harga Min & Max untuk penentuan skala Y
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  
  // Berikan margin 5% agar garis tidak menyentuh ujung atas/bawah grafik
  const priceRange = maxPrice - minPrice;
  const marginRange = priceRange === 0 ? 100 : priceRange * 0.05;
  const yMax = maxPrice + marginRange;
  const yMin = Math.max(0, minPrice - marginRange);
  const yRange = yMax - yMin;

  // Konversi data harga ke koordinat SVG (X, Y)
  const getCoordinates = (data: number[]) => {
    const points: { x: number; y: number }[] = [];
    const len = data.length;
    for (let i = 0; i < len; i++) {
      // X terdistribusi rata secara linear
      const x = paddingLeft + (i / (len - 1 || 1)) * chartWidth;
      // Y terbalik (0 di atas, height di bawah)
      const y = paddingTop + chartHeight - ((data[i] - yMin) / (yRange || 1)) * chartHeight;
      points.push({ x, y });
    }
    return points;
  };

  const pricePoints = getCoordinates(prices);

  // Fungsi menggambar polyline path
  const getPathD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  };

  const linePath = getPathD(pricePoints);

  // Hitung data SMA20 & SMA50 historis 30 titik untuk di-overlay ke chart
  // Karena prices berukuran 30 hari (untuk chart), kita estimasi garis SMA20 & SMA50 linear merayap
  // ke arah nilai SMA terakhir
  const getSmaPoints = (targetSma: number) => {
    if (targetSma <= 0) return null;
    const len = prices.length;
    const smaPoints: { x: number; y: number }[] = [];
    
    // Estimasi pergerakan SMA sederhana untuk chart:
    // Garis lurus / trendline landai dari harga awal ke target SMA
    const startVal = (prices[0] + prices[Math.floor(len / 2)] + targetSma) / 3;
    for (let i = 0; i < len; i++) {
      const x = paddingLeft + (i / (len - 1 || 1)) * chartWidth;
      const currentVal = startVal + (i / (len - 1 || 1)) * (targetSma - startVal);
      const y = paddingTop + chartHeight - ((currentVal - yMin) / (yRange || 1)) * chartHeight;
      smaPoints.push({ x, y });
    }
    return getPathD(smaPoints);
  };

  const sma20Path = getSmaPoints(sma20);
  const sma50Path = getSmaPoints(sma50);

  // Format label harga Y axis
  const formatYLabel = (val: number) => {
    if (symbol === "USDIDR") return `$${val.toLocaleString("id-ID")}`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
    return val.toString();
  };

  // Generate 4 sumbu horizontal grid lines
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i < gridCount; i++) {
    const yVal = yMin + (i / (gridCount - 1)) * yRange;
    const yPos = paddingTop + chartHeight - (i / (gridCount - 1)) * chartHeight;
    gridLines.push({ yPos, label: formatYLabel(yVal) });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-zinc-200">
          Grafik Harga Historis (30 Hari)
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-extrabold select-none">
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <span className="h-1.5 w-3 bg-orange-600 rounded"></span> Harga
          </span>
          {sma20 > 0 && (
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="h-1.5 w-3 bg-blue-500 rounded"></span> SMA20
            </span>
          )}
          {sma50 > 0 && (
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="h-1.5 w-3 bg-amber-500 rounded"></span> SMA50
            </span>
          )}
        </div>
      </div>

      <div className="w-full relative">
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
                y={line.yPos + 4} 
                className="fill-neutral-400 dark:fill-zinc-550 text-[10px] font-bold text-right" 
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
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
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
              className="stroke-blue-400 dark:stroke-blue-500/80" 
              strokeWidth={1.5}
            />
          )}

          {/* SMA 50 Overlay Path (Amber) */}
          {sma50Path && (
            <path 
              d={sma50Path} 
              fill="none" 
              className="stroke-amber-400 dark:stroke-amber-500/80" 
              strokeWidth={1.5}
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

          {/* Sumbu X Labels (30 hari lalu vs Hari ini) */}
          <text 
            x={paddingLeft} 
            y={height - 8} 
            className="fill-neutral-400 dark:fill-zinc-550 text-[10px] font-bold"
            textAnchor="start"
          >
            30 Hari Lalu
          </text>
          <text 
            x={width - paddingRight} 
            y={height - 8} 
            className="fill-neutral-400 dark:fill-zinc-550 text-[10px] font-bold"
            textAnchor="end"
          >
            Hari Ini
          </text>
        </svg>
      </div>
    </div>
  );
}