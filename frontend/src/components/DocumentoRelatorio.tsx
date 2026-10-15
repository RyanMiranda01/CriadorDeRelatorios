import { periodos, type Relatorio } from "../types";
export function DocumentoRelatorio({
  relatorio: r,
  responsavel,
}: {
  relatorio: Relatorio;
  responsavel: string;
}) {
  return (
    <article className="print-document">
      <header>
        <strong>DiscoverON | Gestão de Relatórios</strong>
        <h1>Relatório #{r.id}</h1>
        <p>Registrado em {r.data_criacao}</p>
      </header>
      <dl>
        <div>
          <dt>Aluno</dt>
          <dd>{r.nome_aluno}</dd>
        </div>
        <div>
          <dt>Turma</dt>
          <dd>{r.turma}</dd>
        </div>
        <div>
          <dt>Período</dt>
          <dd>{periodos[r.periodo]}</dd>
        </div>
        <div>
          <dt>Responsável</dt>
          <dd>{responsavel}</dd>
        </div>
      </dl>
      {[
        ["Motivo", r.motivo],
        ["Descrição da situação", r.desc_situacao],
        ["Providências adotadas", r.providencia],
      ].map(([titulo, texto]) => (
        <section key={titulo}>
          <h2>{titulo}</h2>
          <p>{texto}</p>
        </section>
      ))}
      <footer>DiscoverON · Documento de uso interno</footer>
    </article>
  );
}
