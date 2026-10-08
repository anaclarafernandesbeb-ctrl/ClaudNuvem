"""
Importa os dados abertos do CNPJ (Receita Federal) para o banco da Prospecta.

Só carrega o que interessa, para caber no plano barato do Supabase:
  - empresas ATIVAS
  - das UFs escolhidas (variável UFS, ex.: "SP" ou "SP,RJ")
  - abertas nos últimos DIAS dias (padrão 120)
  - opcionalmente só de alguns CNAEs (variável CNAES, prefixos separados por vírgula)

Variáveis de ambiente:
  DATABASE_URL    conexão Postgres do Supabase (obrigatória)
  UFS             obrigatória
  DIAS            opcional, padrão 120
  CNAES           opcional, ex.: "56,9602,8630"
  CNPJ_BASE_URL   opcional, pasta dos arquivos da Receita (compartilhamento WebDAV)
  CNPJ_SHARE_TOKEN opcional, token do link público (padrão: lido do CNPJ_BASE_URL)
  CNPJ_MES        opcional, ex.: "2026-09" (padrão: o mais recente)

Rodado todo mês pelo GitHub Actions (.github/workflows/importar-cnpj.yml).
"""

import base64
import csv
import io
import os
import re
import sys
import tempfile
import time
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta

import psycopg

# Desde 2026 os dados abertos do CNPJ ficam num compartilhamento público do tipo
# Nextcloud (SERPRO+). Acessamos pelo WebDAV do link público: o "usuário" do
# Basic Auth é o token do link (o trecho logo depois de /dav/files/) e a senha é
# vazia. A estrutura é .../CNPJ/<AAAA-MM>/<Arquivo>.zip.
BASE_URL = os.environ.get(
    "CNPJ_BASE_URL",
    "https://arquivos.receitafederal.gov.br/public.php/dav/files/"
    "gn672Ad4CF8N6TK/Dados/Cadastros/CNPJ/",
).rstrip("/") + "/"
_token_na_url = re.search(r"/dav/files/([^/]+)/", BASE_URL)
SHARE_TOKEN = os.environ.get(
    "CNPJ_SHARE_TOKEN", _token_na_url.group(1) if _token_na_url else ""
)
HEADERS = {"User-Agent": "prospecta-importer/1.0"}
if SHARE_TOKEN:
    HEADERS["Authorization"] = "Basic " + base64.b64encode(
        f"{SHARE_TOKEN}:".encode()
    ).decode()
# Quantos arquivos baixar ao mesmo tempo. O servidor novo da Receita é lento por
# conexão, então baixar em paralelo encurta muito o tempo total. Ajustável por
# variável de ambiente caso o servidor passe a limitar conexões simultâneas.
CONCORRENCIA = max(1, int(os.environ.get("CNPJ_CONCORRENCIA", "6")))
UFS = {u.strip().upper() for u in os.environ.get("UFS", "").split(",") if u.strip()}
DIAS = int(os.environ.get("DIAS", "120"))
CNAES = [c.strip() for c in os.environ.get("CNAES", "").split(",") if c.strip()]
NATUREZA_PESSOA_FISICA = {"2135"}  # Empresário (Individual), inclui MEI
PORTES = {"00": "Não informado", "01": "Micro empresa", "03": "Empresa de pequeno porte", "05": "Demais"}

csv.field_size_limit(10_000_000)


def log(msg):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def mes_mais_recente():
    mes = os.environ.get("CNPJ_MES")
    if mes:
        return mes
    # Lista as pastas mensais com um PROPFIND no WebDAV do compartilhamento.
    req = urllib.request.Request(
        BASE_URL,
        method="PROPFIND",
        headers={**HEADERS, "Depth": "1", "Content-Type": "application/xml"},
        data=b'<?xml version="1.0"?><d:propfind xmlns:d="DAV:">'
        b"<d:prop><d:resourcetype/></d:prop></d:propfind>",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        corpo = r.read().decode("utf-8", "ignore")
    meses = sorted(set(re.findall(r"(\d{4}-\d{2})/", corpo)))
    if not meses:
        sys.exit(f"Não encontrei as pastas mensais em {BASE_URL}")
    return meses[-1]


def baixar(url, destino):
    nome = os.path.basename(destino)
    t0 = time.time()
    req = urllib.request.Request(url, headers=HEADERS)
    total = 0
    with urllib.request.urlopen(req, timeout=1800) as r, open(destino, "wb") as f:
        while bloco := r.read(1024 * 1024):
            f.write(bloco)
            total += len(bloco)
    dt = max(time.time() - t0, 0.1)
    log(f"baixado {nome}: {total // 1048576} MB em {int(dt)}s "
        f"({int((total / 1024) / dt)} KB/s)")
    return destino


def linhas_do_zip(caminho):
    with zipfile.ZipFile(caminho) as z:
        for nome in z.namelist():
            with z.open(nome) as bruto:
                texto = io.TextIOWrapper(bruto, encoding="latin-1", newline="")
                yield from csv.reader(texto, delimiter=";", quotechar='"')


def data_iso(valor):
    try:
        return datetime.strptime(valor, "%Y%m%d").date()
    except ValueError:
        return None


def limpar(valor):
    valor = (valor or "").strip()
    return valor or None


def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url or not UFS:
        sys.exit("Defina DATABASE_URL e UFS.")

    mes = mes_mais_recente()
    pasta = f"{BASE_URL}{mes}/"
    corte = date.today() - timedelta(days=DIAS)
    log(f"mês {mes} · UFs {sorted(UFS)} · abertas desde {corte} · CNAEs {CNAES or 'todos'}")

    tmp = tempfile.mkdtemp()

    def arquivo(nome):
        destino = os.path.join(tmp, nome)
        baixar(pasta + nome, destino)
        return destino

    def baixar_varios(nomes):
        """Baixa a lista de arquivos em paralelo e entrega cada caminho assim que
        termina (ordem de chegada), para processar enquanto os outros baixam."""
        with ThreadPoolExecutor(max_workers=CONCORRENCIA) as executor:
            futuros = {
                executor.submit(baixar, pasta + nome, os.path.join(tmp, nome)): nome
                for nome in nomes
            }
            for futuro in as_completed(futuros):
                yield futuros[futuro], futuro.result()

    # Tabelas auxiliares
    municipios = {}
    for linha in linhas_do_zip(arquivo("Municipios.zip")):
        if len(linha) >= 2:
            municipios[linha[0]] = linha[1].strip().upper()
    cnaes = []
    for linha in linhas_do_zip(arquivo("Cnaes.zip")):
        if len(linha) >= 2:
            cnaes.append((linha[0].strip(), linha[1].strip()))

    # Estabelecimentos filtrados (baixados em paralelo)
    estabelecimentos = {}
    for nome, caminho in baixar_varios([f"Estabelecimentos{i}.zip" for i in range(10)]):
        for c in linhas_do_zip(caminho):
            if len(c) < 28 or c[5] != "02" or c[19] not in UFS:
                continue
            aberta = data_iso(c[10])
            if not aberta or aberta < corte:
                continue
            cnae = c[11].strip()
            if CNAES and not any(cnae.startswith(p) for p in CNAES):
                continue
            telefone = (c[21].strip() + c[22].strip()) or None
            email = limpar(c[27])
            if not telefone and not email:
                continue
            cnpj = c[0] + c[1] + c[2]
            estabelecimentos[cnpj] = {
                "cnpj": cnpj,
                "basico": c[0],
                "nome_fantasia": limpar(c[4]),
                "cnae_principal": cnae,
                "data_abertura": aberta,
                "uf": c[19],
                "municipio_codigo": c[20],
                "municipio_nome": municipios.get(c[20]),
                "bairro": limpar(c[17]),
                "logradouro": " ".join(p for p in (c[13].strip(), c[14].strip()) if p) or None,
                "numero": limpar(c[15]),
                "cep": limpar(c[18]),
                "telefone": telefone,
                "email": email.lower() if email else None,
            }
        os.remove(caminho)
        log(f"{nome}: {len(estabelecimentos)} empresas selecionadas até agora")

    # Dados da empresa (razão social, natureza jurídica, porte)
    basicos = {e["basico"] for e in estabelecimentos.values()}
    empresas = {}
    for nome, caminho in baixar_varios([f"Empresas{i}.zip" for i in range(10)]):
        for c in linhas_do_zip(caminho):
            if len(c) >= 6 and c[0] in basicos:
                empresas[c[0]] = (limpar(c[1]), c[2].strip(), PORTES.get(c[5].strip()))
        os.remove(caminho)
        log(f"{nome}: {len(empresas)} encontradas")

    log("gravando no banco")
    with psycopg.connect(database_url) as conn, conn.cursor() as cur:
        cur.executemany(
            "insert into public.cnaes (codigo, descricao) values (%s, %s) "
            "on conflict (codigo) do update set descricao = excluded.descricao",
            cnaes,
        )
        cur.execute(
            "create temp table novas (like public.companies including defaults) on commit drop"
        )
        colunas = (
            "cnpj", "razao_social", "nome_fantasia", "cnae_principal", "natureza_juridica",
            "porte", "pessoa_fisica", "data_abertura", "uf", "municipio_codigo",
            "municipio_nome", "bairro", "logradouro", "numero", "cep", "telefone", "email",
        )
        with cur.copy(f"copy novas ({', '.join(colunas)}) from stdin") as copia:
            for e in estabelecimentos.values():
                razao, natureza, porte = empresas.get(e["basico"], (None, None, None))
                copia.write_row((
                    e["cnpj"], razao, e["nome_fantasia"], e["cnae_principal"], natureza,
                    porte, natureza in NATUREZA_PESSOA_FISICA, e["data_abertura"], e["uf"],
                    e["municipio_codigo"], e["municipio_nome"], e["bairro"], e["logradouro"],
                    e["numero"], e["cep"], e["telefone"], e["email"],
                ))
        atualizar = ", ".join(f"{c} = excluded.{c}" for c in colunas if c != "cnpj")
        cur.execute(
            f"insert into public.companies ({', '.join(colunas)}) "
            f"select {', '.join(colunas)} from novas "
            f"on conflict (cnpj) do update set {atualizar}, atualizado_em = now()"
        )
        log(f"{cur.rowcount} empresas gravadas")
        # Remove empresas fora da janela que nenhum usuário guardou como lead
        cur.execute(
            "delete from public.companies c where c.data_abertura < %s "
            "and not exists (select 1 from public.leads l where l.company_cnpj = c.cnpj)",
            (corte,),
        )
        log(f"{cur.rowcount} empresas antigas removidas")
    log("pronto")


if __name__ == "__main__":
    main()
