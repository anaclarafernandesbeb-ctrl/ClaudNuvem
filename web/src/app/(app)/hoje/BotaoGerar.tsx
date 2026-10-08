"use client";

import { useActionState } from "react";
import { gerarListaDoDia, type EstadoLista } from "./actions";

export function BotaoGerar({ texto }: { texto: string }) {
  const [estado, acao, gerando] = useActionState<EstadoLista>(gerarListaDoDia, {});
  return (
    <form action={acao} className="space-y-2">
      <button className="btn-primario" disabled={gerando}>
        {gerando ? "Buscando e avaliando empresas..." : texto}
      </button>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      {estado.aviso && <p className="text-sm text-texto-suave">{estado.aviso}</p>}
    </form>
  );
}
