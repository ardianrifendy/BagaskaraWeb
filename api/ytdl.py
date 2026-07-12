from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import yt_dlp

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
        except Exception:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'ok': False,
                'error': 'INVALID_JSON',
                'message': 'Format request tidak valid.'
            }).encode('utf-8'))
            return

        url = body.get('url')
        if not url:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'ok': False,
                'error': 'INVALID_URL',
                'message': 'URL video wajib diisi.'
            }).encode('utf-8'))
            return

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'youtube_include_dash_manifest': False,
            'youtube_include_hls_manifest': False,
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web']
                }
            }
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                title = info.get('title', 'Video YouTube')
                duration_sec = info.get('duration')
                thumbnail = info.get('thumbnail')
                if not thumbnail and info.get('id'):
                    thumbnail = f"https://img.youtube.com/vi/{info.get('id')}/hqdefault.jpg"

                variants = []
                formats = info.get('formats', [])

                for f in formats:
                    url_dl = f.get('url')
                    if not url_dl or 'youtube.com' in url_dl or 'googlevideo.com' not in url_dl:
                        continue

                    acodec = f.get('acodec', 'none')
                    vcodec = f.get('vcodec', 'none')
                    ext = f.get('ext', 'mp4')
                    filesize = f.get('filesize') or f.get('filesize_approx')

                    has_audio = acodec != 'none' and acodec is not None
                    has_video = vcodec != 'none' and vcodec is not None

                    if has_audio and not has_video:
                        # Audio-only
                        bitrate = f.get('abr') or (f.get('tbr') if not has_video else None)
                        bitrate_label = f" ({int(bitrate)} kbps)" if bitrate else ""
                        variants.append({
                            'kind': 'audio',
                            'label': f"Audio MP3{bitrate_label} - Kualitas Terbaik" if ext == 'mp3' or 'mp3' in f.get('format_id', '') else f"Audio {ext.upper()}{bitrate_label}",
                            'url': url_dl,
                            'ext': ext if ext != 'webm' else 'mp3',
                            'sizeBytes': filesize
                        })
                    elif has_audio and has_video:
                        # Video dengan audio
                        height = f.get('height') or 360
                        variants.append({
                            'kind': 'video',
                            'label': f"Video MP4 {height}p (Dengan Audio)",
                            'url': url_dl,
                            'ext': ext,
                            'sizeBytes': filesize
                        })
                    elif not has_audio and has_video:
                        # Video-only (resolusi tinggi)
                        height = f.get('height') or 720
                        if height >= 720:
                            variants.append({
                                'kind': 'video',
                                'label': f"Video MP4 {height}p (Tanpa Audio)",
                                'url': url_dl,
                                'ext': ext,
                                'sizeBytes': filesize
                            })

                if not variants:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'ok': False,
                        'error': 'PRIVATE_OR_NOT_FOUND',
                        'message': 'Konten tidak ditemukan atau bersifat privat.'
                    }).encode('utf-8'))
                    return

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'ok': True,
                    'platform': 'youtube',
                    'title': title,
                    'thumbnail': thumbnail,
                    'durationSec': duration_sec,
                    'variants': variants
                }).encode('utf-8'))

        except Exception as e:
            error_str = str(e)
            print(f"[ytdl] Extract error: {error_str}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'ok': False,
                'error': 'PROVIDER_ERROR',
                'message': 'Gagal memproses video YouTube. Silakan coba lagi nanti.'
            }).encode('utf-8'))
