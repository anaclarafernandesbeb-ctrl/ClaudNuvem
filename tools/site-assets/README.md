# Imagens e vídeos do site (Higgsfield)

As imagens/vídeos da v2.0 do site institucional foram gerados no Higgsfield
(padrão visual: interface holográfica) e ficam hospedados no CloudFront.

Para baixar, otimizar (WebP / MP4 720p sem áudio) e gravar em
`site-institucional/assets/img/v2/`:

```bash
python3 -I tools/site-assets/fetch_assets.py
```

Requer acesso de rede a `d8j0ntlcm91z4.cloudfront.net`, Pillow e ffmpeg.
