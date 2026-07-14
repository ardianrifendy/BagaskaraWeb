// Test script to verify the new y2mate provider logic (using yt2mp3.de).
const url = 'https://www.youtube.com/watch?v=q6t07d2HwS4';
const REQUEST_TIMEOUT_MS = 15000;

function extractYoutubeId(input) {
  try {
    const parsed = new URL(input);
    if (parsed.hostname.includes("youtu.be")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] && /^[a-zA-Z0-9_-]{11}$/.test(parts[0])) {
        return parts[0];
      }
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) {
        return parts[1];
      }
    }
    const v = parsed.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return v;
    }
  } catch {
    // ignore
  }
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\/\s]{11})/);
  return match ? match[1] : null;
}

async function testResolve() {
  console.log("=== TESTING Y2MATE RESOLVER (YT2MP3.DE) ===");
  const videoId = extractYoutubeId(url);
  console.log("Video ID:", videoId);
  if (!videoId) {
    console.error("Invalid YouTube URL");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const apiUrl = `https://yt2mp3.de/api.php?v=${videoId}`;
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error status ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    const formats = data.formats || [];
    if (formats.length === 0) {
      throw new Error("No formats found");
    }

    const title = data.title || "Video YouTube";
    const durationSec = data.duration || undefined;
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const variants = [];

    // 1. Ekstrak Audio (MP3/M4A)
    const audios = formats.filter((f) => f.kind === "audio");
    if (audios.length > 0) {
      audios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      const bestAudio = audios[0];
      const bitrateKbps = bestAudio.bitrate ? Math.round(bestAudio.bitrate / 1000) : 128;
      const ext = bestAudio.container || "mp3";
      const urlDownload = bestAudio.download_url ||
        `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(bestAudio.download_hash || "")}`;

      variants.push({
        kind: "audio",
        label: `Audio MP3 (${bitrateKbps} kbps) - Kualitas Terbaik`,
        url: urlDownload,
        ext,
        sizeBytes: bestAudio.filesize || undefined,
      });

      if (audios[1]) {
        const mediumAudio = audios[1];
        const medBitrate = mediumAudio.bitrate ? Math.round(mediumAudio.bitrate / 1000) : 128;
        const urlMedDownload = mediumAudio.download_url ||
          `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(mediumAudio.download_hash || "")}`;
        variants.push({
          kind: "audio",
          label: `Audio MP3 (${medBitrate} kbps)`,
          url: urlMedDownload,
          ext: mediumAudio.container || "mp3",
          sizeBytes: mediumAudio.filesize || undefined,
        });
      }
    }

    // 2. Ekstrak Video dengan Audio (MP4)
    const videosWithAudio = formats.filter((f) => f.kind === "video" && f.has_audio);
    if (videosWithAudio.length > 0) {
      videosWithAudio.sort((a, b) => (b.height || 0) - (a.height || 0));

      videosWithAudio.forEach((f) => {
        const height = f.height || 360;
        const label = `Video MP4 ${height}p (Dengan Audio)`;
        const urlDownload = f.download_url ||
          `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(f.download_hash || "")}`;
        variants.push({
          kind: "video",
          label,
          url: urlDownload,
          ext: f.container || "mp4",
          sizeBytes: f.filesize || undefined,
        });
      });
    }

    // 3. Ekstrak Video Tanpa Audio (Resolusi tinggi seperti 1080p, 1440p, 2160p)
    const videosNoAudio = formats.filter((f) => f.kind === "video" && !f.has_audio);
    if (videosNoAudio.length > 0) {
      videosNoAudio.sort((a, b) => (b.height || 0) - (a.height || 0));

      videosNoAudio.slice(0, 3).forEach((f) => {
        const height = f.height || 720;
        const label = `Video MP4 ${height}p (Tanpa Audio)`;
        const urlDownload = f.download_url ||
          `https://yt2mp3.de/proxy_download.php?h=${encodeURIComponent(f.download_hash || "")}`;
        variants.push({
          kind: "video",
          label,
          url: urlDownload,
          ext: f.container || "mp4",
          sizeBytes: f.filesize || undefined,
        });
      });
    }

    console.log("SUCCESSFULLY RESOLVED YOUTUBE VIDEO!");
    console.log("Title:", title);
    console.log("Duration (sec):", durationSec);
    console.log("Thumbnail URL:", thumbnail);
    console.log("Variants found:", variants.length);
    console.log("\nList of Download Link Variants:");
    variants.forEach((v, index) => {
      console.log(`${index + 1}. [${v.kind.toUpperCase()}] ${v.label}`);
      console.log(`   URL: ${v.url}`);
      console.log(`   Ext: ${v.ext} | Size: ${v.sizeBytes ? (v.sizeBytes / (1024 * 1024)).toFixed(2) + " MB" : "N/A"}`);
    });

  } catch (err) {
    console.error("Resolve failed:", err.message);
  } finally {
    clearTimeout(timeout);
  }
}

testResolve();
