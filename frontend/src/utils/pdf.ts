import { jsPDF } from "jspdf";
import fonteUrl from "../assets/fonts/DejaVuSans.ttf?url";
import { periodos, type Relatorio } from "../types";

let fonte: Promise<string> | undefined;
async function carregarFonte() {
  fonte ??= fetch(fonteUrl)
    .then(async (resposta) => {
      if (!resposta.ok)
        throw new Error(
          "Não foi possível carregar a fonte do PDF. Tente novamente.",
        );
      const bytes = new Uint8Array(await resposta.arrayBuffer());
      let binario = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return btoa(binario);
    })
    .catch((erro: unknown) => {
      fonte = undefined;
      throw erro;
    });
  return fonte;
}

export async function gerarPdf(relatorio: Relatorio, responsavel: string) {
  const arquivoFonte = await carregarFonte();
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("DiscoverSans.ttf", arquivoFonte);
  doc.addFont("DiscoverSans.ttf", "DiscoverSans", "normal");
  doc.setFont("DiscoverSans");
  doc.setProperties({
    title: `Relatório #${relatorio.id} | DiscoverON`,
    subject: "Relatório educacional",
    creator: "DiscoverON | Gestão de Relatórios",
  });
  const margem = 18;
  const largura = 174;
  const limite = 273;
  let y = 0;
  function cabecalho() {
    doc.setFontSize(15);
    doc.setTextColor(30, 57, 125);
    doc.text("DiscoverON | Gestão de Relatórios", margem, 21);
    doc.setFontSize(9);
    doc.setTextColor(90, 103, 125);
    doc.text(
      `Relatório #${relatorio.id} · ${relatorio.data_criacao}`,
      margem,
      29,
    );
    doc.setDrawColor(215, 223, 236);
    doc.line(margem, 34, 192, 34);
    y = 45;
  }
  function espaco(altura: number) {
    if (y + altura > limite) {
      doc.addPage();
      cabecalho();
    }
  }
  function campo(titulo: string, conteudo: string) {
    espaco(22);
    doc.setFontSize(9);
    doc.setTextColor(85, 102, 130);
    doc.text(titulo, margem, y);
    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(33, 43, 61);
    const linhas = doc.splitTextToSize(conteudo || "—", largura) as string[];
    for (const linha of linhas) {
      espaco(6);
      doc.text(linha, margem, y);
      y += 6;
    }
    y += 7;
  }
  cabecalho();
  campo("ALUNO", relatorio.nome_aluno);
  campo("TURMA", relatorio.turma);
  campo("PERÍODO", periodos[relatorio.periodo]);
  campo("RESPONSÁVEL", responsavel);
  campo("MOTIVO", relatorio.motivo);
  campo("DESCRIÇÃO DA SITUAÇÃO", relatorio.desc_situacao);
  campo("PROVIDÊNCIAS ADOTADAS", relatorio.providencia);
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(215, 223, 236);
    doc.line(margem, 280, 192, 280);
    doc.setFontSize(8);
    doc.setTextColor(100, 111, 130);
    doc.text("DiscoverON · Documento de uso interno", margem, 287);
    doc.text(`${pagina} / ${paginas}`, 192, 287, { align: "right" });
  }
  return { blob: doc.output("blob"), paginas };
}
