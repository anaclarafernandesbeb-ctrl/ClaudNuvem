"""Baixa as imagens/vídeos do Higgsfield listados em hf-assets.tsv,
otimiza para a web e grava em site-institucional/assets/img/v2/.

Uso:  python3 -I fetch_assets.py
Linhas de imagem:  nome<TAB>largura<TAB>url
Linhas de vídeo:   nome<TAB>video<TAB>url
"""
import os
import subprocess
import sys
import tempfile
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
TSV = os.path.join(HERE, "hf-assets.tsv")
DEST = os.path.join(os.path.dirname(HERE), "..", "site-institucional", "assets", "img", "v2")
CA = "/root/.ccr/ca-bundle.crt"


def download(url, path):
    import ssl
    ctx = ssl.create_default_context(cafile=CA) if os.path.exists(CA) else None
    with urllib.request.urlopen(url, timeout=120, context=ctx) as r, open(path, "wb") as f:
        f.write(r.read())


def main():
    os.makedirs(DEST, exist_ok=True)
    work = tempfile.mkdtemp(prefix="hf-")
    ok, fail = 0, 0
    for line in open(TSV, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        name, size, url = line.split("\t")
        raw = os.path.join(work, name + (".mp4" if size == "video" else ".png"))
        try:
            download(url, raw)
            if size == "video":
                out = os.path.join(DEST, name + ".mp4")
                # sem áudio, H.264, 720p no máximo, faststart para começar a tocar rápido
                subprocess.run([
                    "ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-an",
                    "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-preset", "slow",
                    "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
                ], check=True)
            else:
                im = Image.open(raw).convert("RGB")
                w = int(size)
                if im.width > w:
                    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
                out = os.path.join(DEST, name + ".webp")
                im.save(out, "WEBP", quality=80, method=6)
            print(f"ok   {name:22s} {os.path.getsize(out) // 1024:>5} KB")
            ok += 1
        except Exception as e:  # segue com os demais e informa no fim
            print(f"FALHA {name}: {e}")
            fail += 1
    print(f"\n{ok} arquivos prontos, {fail} falhas")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
