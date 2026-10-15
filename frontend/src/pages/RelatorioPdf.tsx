import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useConsulta } from "../hooks/useConsulta";
import { relatoriosApi } from "../services";
import { mensagemErro } from "../api/client";
import { Alert, Loading } from "../components/UI";
import { DocumentoRelatorio } from "../components/DocumentoRelatorio";

export function RelatorioPdf() {
  const { id } = useParams();
  const numero = Number(id);
  const { usuario } = useAuth();
  const consulta = useConsulta(
    (signal) =>
      Number.isSafeInteger(numero) && numero > 0
        ? relatoriosApi.obter(numero, signal)
        : Promise.reject(new Error("Identificador de relatório inválido.")),
    id,
  );
  const [pdf, setPdf] = useState<{
    id: number;
    url: string;
    paginas: number;
  }>();
  const [erro, setErro] = useState("");
  const r = consulta.dados?.id === numero ? consulta.dados : undefined;
  const documento = r && !consulta.erro && pdf?.id === r.id ? pdf : undefined;
  const responsavel =
    r?.id_funcionario === usuario!.id
      ? usuario!.nome
      : `Funcionário #${r?.id_funcionario}`;
  useEffect(() => {
    if (!r) return;
    let cancelado = false;
    let url: string | undefined;
    setPdf(undefined);
    setErro("");
    const tituloAnterior = document.title;
    document.title = `Relatório #${r.id} | DiscoverON`;
    void import("../utils/pdf")
      .then(({ gerarPdf }) => gerarPdf(r, responsavel))
      .then(({ blob, paginas }) => {
        if (cancelado) return;
        url = URL.createObjectURL(blob);
        setPdf({ id: r.id, url, paginas });
      })
      .catch((error: unknown) => {
        if (!cancelado) setErro(mensagemErro(error));
      });
    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
      document.title = tituloAnterior;
    };
  }, [r, responsavel]);
  return (
    <main className="pdf-page">
      <header className="pdf-toolbar no-print">
        <Link className="back-link" to={`/relatorios/${id}`}>
          <ArrowLeft size={17} /> Voltar ao relatório
        </Link>
        <div>
          <h1>Relatório #{id} · PDF</h1>
          <p className="muted small">
            {documento
              ? `${documento.paginas} página(s) · Formato A4`
              : "Preparando documento"}
          </p>
        </div>
        <div className="button-group">
          <button
            className="btn secondary"
            disabled={!r || !!consulta.erro}
            onClick={() => window.print()}
          >
            <Printer size={17} /> Imprimir
          </button>
          {documento && (
            <a
              className="btn primary"
              href={documento.url}
              download={`relatorio-${numero}.pdf`}
            >
              <Download size={17} /> Baixar PDF
            </a>
          )}
        </div>
      </header>
      <div className="no-print">
        {consulta.carregando || (r && !documento && !erro) ? <Loading /> : null}
        {(consulta.erro || erro) && (
          <>
            <Alert>{consulta.erro || erro}</Alert>
            <button className="btn secondary" onClick={consulta.atualizar}>
              Tentar novamente
            </button>
          </>
        )}
        {documento && (
          <>
            <p className="pdf-help">
              Se o navegador não mostrar o documento, use “Baixar PDF” para
              abri-lo no seu leitor.
            </p>
            <iframe
              className="pdf-frame"
              title={`PDF do relatório #${numero}`}
              src={documento.url}
            />
          </>
        )}
      </div>
      {r && !consulta.erro && (
        <DocumentoRelatorio relatorio={r} responsavel={responsavel} />
      )}
    </main>
  );
}
