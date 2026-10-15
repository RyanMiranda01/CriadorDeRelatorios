import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  FileText,
  Filter,
  Printer,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { useConsulta } from "../hooks/useConsulta";
import { camposErro, mensagemErro } from "../api/client";
import { relatoriosApi, type FiltroRelatorio } from "../services";
import { dataParaApi, ordenarRecentes, podeAlterar } from "../utils";
import { periodos, type Relatorio, type RelatorioDados } from "../types";
import {
  Alert,
  Confirm,
  Empty,
  Field,
  Loading,
  PageHeader,
} from "../components/UI";
import { DocumentoRelatorio } from "../components/DocumentoRelatorio";
import { NovoButton } from "../components/Layout";

const texto = z.string().trim().min(1, "Preencha este campo.");
export const relatorioSchema = z.object({
  nome_aluno: texto.max(255),
  turma: texto.max(255),
  motivo: texto.max(255),
  periodo: z.enum(["MATUTINO", "VESPERTINO", "NOTURNO"]),
  desc_situacao: texto,
  providencia: texto,
});

export function Relatorios() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [filtro, setFiltro] = useState<FiltroRelatorio>({ tipo: "todos" });
  const [tipo, setTipo] = useState("todos");
  const [valor, setValor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [erroFiltro, setErroFiltro] = useState("");
  const [excluir, setExcluir] = useState<Relatorio | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [sucesso, setSucesso] = useState<string>(
    (location.state as { sucesso?: string } | null)?.sucesso ?? "",
  );
  const consulta = useConsulta(
    (signal) => relatoriosApi.listar(filtro, signal),
    JSON.stringify(filtro),
  );
  function buscar(evento: FormEvent) {
    evento.preventDefault();
    setErroFiltro("");
    if (tipo === "todos") setFiltro({ tipo: "todos" });
    else if (tipo === "data") {
      if (!inicio || !fim || inicio > fim) {
        setErroFiltro(
          "Informe um intervalo válido, com início anterior ou igual ao fim.",
        );
        return;
      }
      setFiltro({
        tipo: "data",
        inicio: dataParaApi(inicio),
        fim: dataParaApi(fim),
      });
    } else if (!valor.trim()) setErroFiltro("Informe o valor da busca.");
    else
      setFiltro({
        tipo: tipo as "aluno" | "funcionario" | "periodo",
        valor: valor.trim(),
      });
  }
  async function confirmarExclusao() {
    if (!excluir) return;
    setOcupado(true);
    setErroAcao("");
    try {
      await relatoriosApi.excluir(excluir.id);
      setExcluir(null);
      setSucesso("Relatório excluído com sucesso.");
      consulta.atualizar();
    } catch (error) {
      setErroAcao(mensagemErro(error));
    } finally {
      setOcupado(false);
    }
  }
  const lista = ordenarRecentes(consulta.dados ?? []);
  return (
    <>
      <PageHeader
        eyebrow="ACOMPANHAMENTO EDUCACIONAL"
        titulo={
          usuario!.nivel === "PROFESSOR" ? "Meus relatórios" : "Relatórios"
        }
        descricao="Encontre, consulte e organize os registros da escola."
      >
        <NovoButton />
      </PageHeader>
      {sucesso && <Alert sucesso>{sucesso}</Alert>}
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Registros educacionais</h2>
            <p className="muted small">
              {usuario!.nivel === "PROFESSOR"
                ? "Você está consultando somente seus próprios registros."
                : "Você pode consultar os registros de toda a equipe."}
            </p>
          </div>
          <span className="pill neutral">
            <FileText size={14} />
            {consulta.carregando || consulta.erro
              ? "Consultando"
              : `${lista.length} registros`}
          </span>
        </div>
        <form className="filter-bar" onSubmit={buscar}>
          <div className="filter-label">
            <Filter size={17} /> Filtrar
          </div>
          <label className="sr-only" htmlFor="tipo-filtro">
            Tipo de filtro
          </label>
          <select
            id="tipo-filtro"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setValor("");
            }}
          >
            <option value="todos">Todos os registros</option>
            <option value="aluno">Nome do aluno</option>
            <option value="funcionario">Nome do funcionário</option>
            <option value="periodo">Período</option>
            <option value="data">Intervalo de datas</option>
          </select>
          {tipo === "periodo" ? (
            <>
              <label className="sr-only" htmlFor="valor-filtro">
                Período
              </label>
              <select
                id="valor-filtro"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              >
                <option value="">Selecione o período</option>
                {Object.entries(periodos).map(([chave, label]) => (
                  <option key={chave} value={chave}>
                    {label}
                  </option>
                ))}
              </select>
            </>
          ) : tipo === "data" ? (
            <>
              <label className="date-filter">
                De
                <input
                  type="date"
                  min="1000-01-01"
                  max="9999-12-30"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  required
                />
              </label>
              <label className="date-filter">
                Até
                <input
                  type="date"
                  min={inicio || "1000-01-01"}
                  max="9999-12-30"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  required
                />
              </label>
            </>
          ) : tipo !== "todos" ? (
            <>
              <label className="sr-only" htmlFor="valor-filtro">
                Nome para buscar
              </label>
              <input
                id="valor-filtro"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={
                  tipo === "aluno"
                    ? "Buscar pelo nome do aluno"
                    : "Buscar pelo nome do funcionário"
                }
                required
              />
            </>
          ) : (
            <span className="filter-spacer" />
          )}
          <button className="btn secondary" type="submit">
            <Search size={17} /> Buscar
          </button>
          {filtro.tipo !== "todos" && (
            <button
              className="btn text"
              type="button"
              onClick={() => {
                setTipo("todos");
                setValor("");
                setInicio("");
                setFim("");
                setFiltro({ tipo: "todos" });
                setErroFiltro("");
              }}
            >
              Limpar
            </button>
          )}
        </form>
        {erroFiltro && <Alert>{erroFiltro}</Alert>}
        {consulta.carregando ? (
          <Loading />
        ) : consulta.erro ? (
          <div className="table-feedback">
            <Alert>{consulta.erro}</Alert>
            <button className="btn secondary" onClick={consulta.atualizar}>
              Tentar novamente
            </button>
          </div>
        ) : lista.length ? (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                Relatórios autorizados para seu perfil
              </caption>
              <thead>
                <tr>
                  <th>Aluno / turma</th>
                  <th>Motivo</th>
                  <th>Período</th>
                  <th>Data</th>
                  <th>Responsável</th>
                  <th className="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link className="cell-title" to={`/relatorios/${r.id}`}>
                        {r.nome_aluno}
                      </Link>
                      <span className="cell-subtitle">
                        {r.turma} · #{r.id}
                      </span>
                    </td>
                    <td className="motivo-cell">{r.motivo}</td>
                    <td>
                      <span
                        className={`period-tag period-${r.periodo.toLowerCase()}`}
                      >
                        {periodos[r.periodo]}
                      </span>
                    </td>
                    <td className="nowrap">
                      {r.data_criacao.split(" ")[0]}
                      <span className="cell-subtitle">
                        {r.data_criacao.split(" ")[1]}
                      </span>
                    </td>
                    <td>
                      {r.id_funcionario === usuario!.id ? (
                        <span className="owner-label">Você</span>
                      ) : (
                        <span className="small">
                          Funcionário #{r.id_funcionario}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          className="icon-button"
                          aria-label={`Consultar relatório ${r.id}`}
                          to={`/relatorios/${r.id}`}
                        >
                          <Eye size={17} />
                        </Link>
                        <Link
                          className="icon-button"
                          aria-label={`Ver PDF do relatório ${r.id}`}
                          to={`/relatorios/${r.id}/pdf`}
                        >
                          <Printer size={17} />
                        </Link>
                        {podeAlterar(usuario!, r) && (
                          <>
                            <Link
                              className="icon-button"
                              aria-label={`Editar relatório ${r.id}`}
                              to={`/relatorios/${r.id}/editar`}
                            >
                              <Pencil size={17} />
                            </Link>
                            <button
                              className="icon-button destructive"
                              aria-label={`Excluir relatório ${r.id}`}
                              onClick={() => {
                                setErroAcao("");
                                setExcluir(r);
                              }}
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            titulo={
              filtro.tipo === "todos"
                ? "Seu próximo registro começa aqui"
                : "Nenhum resultado encontrado"
            }
            texto={
              filtro.tipo === "todos"
                ? "Ainda não há relatórios disponíveis para seu perfil."
                : "Tente outro valor ou limpe o filtro."
            }
          />
        )}
        <div className="table-footer">
          Exibindo os registros retornados pelo servidor. Um critério de busca
          por vez.
        </div>
      </section>
      {excluir && (
        <Confirm
          titulo="Excluir relatório?"
          texto={`O registro #${excluir.id}, de ${excluir.nome_aluno}, será excluído. Esta ação não pode ser desfeita.`}
          fechar={() => setExcluir(null)}
          confirmar={() => void confirmarExclusao()}
          ocupado={ocupado}
          erro={erroAcao}
          acao="Excluir relatório"
        />
      )}
    </>
  );
}

function FormRelatorio({ inicial, id }: { inicial?: Relatorio; id?: number }) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [erro, setErro] = useState("");
  const form = useForm<RelatorioDados>({
    resolver: zodResolver(relatorioSchema),
    defaultValues: inicial
      ? {
          nome_aluno: inicial.nome_aluno,
          turma: inicial.turma,
          motivo: inicial.motivo,
          periodo: inicial.periodo,
          desc_situacao: inicial.desc_situacao,
          providencia: inicial.providencia,
        }
      : {
          nome_aluno: "",
          turma: "",
          motivo: "",
          periodo: "MATUTINO",
          desc_situacao: "",
          providencia: "",
        },
  });
  async function salvar(dados: RelatorioDados) {
    setErro("");
    try {
      if (id) await relatoriosApi.editar(id, dados);
      else await relatoriosApi.criar(dados);
      navigate("/relatorios", {
        state: {
          sucesso: id
            ? "Relatório atualizado com sucesso."
            : "Relatório criado com sucesso.",
        },
      });
    } catch (error) {
      setErro(mensagemErro(error));
      for (const [campo, mensagem] of Object.entries(camposErro(error))) {
        if (campo in relatorioSchema.shape)
          form.setError(campo as keyof RelatorioDados, { message: mensagem });
      }
    }
  }
  return (
    <form
      className="report-form"
      onSubmit={form.handleSubmit(salvar)}
      noValidate
    >
      <div className="panel">
        <div className="section-head">
          <div>
            <h2>Informações do registro</h2>
            <p className="muted small">
              Preencha todos os campos com informações claras e objetivas.
            </p>
          </div>
          <span className="step-label">01 / 02</span>
        </div>
        <div className="form-grid">
          <Field
            id="nome_aluno"
            label="Nome do aluno"
            erro={form.formState.errors.nome_aluno?.message}
          >
            <input
              id="nome_aluno"
              placeholder="Nome completo do aluno"
              aria-invalid={!!form.formState.errors.nome_aluno}
              aria-describedby="nome_aluno-error"
              {...form.register("nome_aluno")}
            />
          </Field>
          <Field
            id="turma"
            label="Turma"
            erro={form.formState.errors.turma?.message}
          >
            <input
              id="turma"
              placeholder="Informe a turma"
              aria-invalid={!!form.formState.errors.turma}
              aria-describedby="turma-error"
              {...form.register("turma")}
            />
          </Field>
          <Field
            id="periodo"
            label="Período"
            erro={form.formState.errors.periodo?.message}
          >
            <select id="periodo" {...form.register("periodo")}>
              {Object.entries(periodos).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="motivo"
            label="Motivo"
            erro={form.formState.errors.motivo?.message}
          >
            <input
              id="motivo"
              placeholder="Qual é o motivo do registro?"
              aria-invalid={!!form.formState.errors.motivo}
              aria-describedby="motivo-error"
              {...form.register("motivo")}
            />
          </Field>
        </div>
      </div>
      <div className="panel">
        <div className="section-head">
          <div>
            <h2>Contexto e providências</h2>
            <p className="muted small">
              Descreva a situação e as medidas adotadas.
            </p>
          </div>
          <span className="step-label">02 / 02</span>
        </div>
        <Field
          id="desc_situacao"
          label="Descrição da situação"
          erro={form.formState.errors.desc_situacao?.message}
        >
          <textarea
            id="desc_situacao"
            rows={5}
            placeholder="Descreva o que aconteceu…"
            aria-invalid={!!form.formState.errors.desc_situacao}
            aria-describedby="desc_situacao-error"
            {...form.register("desc_situacao")}
          />
        </Field>
        <Field
          id="providencia"
          label="Providências adotadas"
          erro={form.formState.errors.providencia?.message}
        >
          <textarea
            id="providencia"
            rows={4}
            placeholder="Registre as ações e orientações realizadas…"
            aria-invalid={!!form.formState.errors.providencia}
            aria-describedby="providencia-error"
            {...form.register("providencia")}
          />
        </Field>
        <p className="author-note">
          <FileText size={17} />
          {id
            ? `Responsável pelo registro: ${inicial!.id_funcionario === usuario!.id ? usuario!.nome : `funcionário #${inicial!.id_funcionario}`}. A autoria será preservada.`
            : `O relatório será registrado em nome de ${usuario!.nome}, pela sua sessão.`}
        </p>
      </div>
      {erro && <Alert>{erro}</Alert>}
      <div className="form-actions">
        <Link
          className="btn secondary"
          to={id ? `/relatorios/${id}` : "/relatorios"}
        >
          Cancelar
        </Link>
        <button className="btn primary" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Salvando…"
            : id
              ? "Salvar alterações"
              : "Criar relatório"}
          <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}
export function NovoRelatorio() {
  return (
    <>
      <Link className="back-link" to="/relatorios">
        <ArrowLeft size={16} /> Voltar aos relatórios
      </Link>
      <PageHeader
        eyebrow="NOVO REGISTRO"
        titulo="Criar relatório"
        descricao="Um registro cuidadoso faz diferença no acompanhamento."
      />
      <FormRelatorio />
    </>
  );
}
export function RelatorioPagina({ editar = false }: { editar?: boolean }) {
  const { id } = useParams();
  const numero = Number(id);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [excluir, setExcluir] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const consulta = useConsulta(
    (signal) =>
      Number.isSafeInteger(numero) && numero > 0
        ? relatoriosApi.obter(numero, signal)
        : Promise.reject(new Error("Identificador de relatório inválido.")),
    id,
  );
  async function confirmar() {
    setOcupado(true);
    setErro("");
    try {
      await relatoriosApi.excluir(numero);
      navigate("/relatorios", {
        state: { sucesso: "Relatório excluído com sucesso." },
      });
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setOcupado(false);
    }
  }
  if (consulta.carregando) return <Loading />;
  if (consulta.erro || !consulta.dados)
    return (
      <>
        <Link className="back-link" to="/relatorios">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Alert>{consulta.erro || "Relatório não encontrado."}</Alert>
        <button className="btn secondary" onClick={consulta.atualizar}>
          Tentar novamente
        </button>
      </>
    );
  const r = consulta.dados;
  const pode = podeAlterar(usuario!, r);
  if (editar && !pode)
    return <Alert>Você só pode editar seus próprios relatórios.</Alert>;
  return (
    <>
      <Link className="back-link" to="/relatorios">
        <ArrowLeft size={16} /> Voltar aos relatórios
      </Link>
      <PageHeader
        eyebrow={`RELATÓRIO #${r.id}`}
        titulo={editar ? "Editar relatório" : r.nome_aluno}
        descricao={
          editar
            ? "Atualize as informações mantendo a autoria do registro."
            : `Registrado em ${r.data_criacao}`
        }
      >
        {!editar && (
          <div className="button-group">
            <Link className="btn secondary" to={`/relatorios/${r.id}/pdf`}>
              <FileText size={17} /> Ver PDF
            </Link>
            <button className="btn secondary" onClick={() => window.print()}>
              <Printer size={17} /> Imprimir
            </button>
            {pode && (
              <>
                <button
                  className="btn secondary destructive"
                  onClick={() => {
                    setErro("");
                    setExcluir(true);
                  }}
                >
                  <Trash2 size={17} /> Excluir
                </button>
                <Link className="btn primary" to={`/relatorios/${r.id}/editar`}>
                  <Pencil size={17} /> Editar
                </Link>
              </>
            )}
          </div>
        )}
      </PageHeader>
      {!editar && (
        <DocumentoRelatorio
          relatorio={r}
          responsavel={
            r.id_funcionario === usuario!.id
              ? usuario!.nome
              : `Funcionário #${r.id_funcionario}`
          }
        />
      )}
      {editar ? (
        <FormRelatorio key={r.id} id={r.id} inicial={r} />
      ) : (
        <section className="panel details-panel">
          <div className="detail-grid">
            <div>
              <span>Aluno</span>
              <strong>{r.nome_aluno}</strong>
            </div>
            <div>
              <span>Turma</span>
              <strong>{r.turma}</strong>
            </div>
            <div>
              <span>Período</span>
              <strong>{periodos[r.periodo]}</strong>
            </div>
            <div>
              <span>Responsável</span>
              <strong>
                {r.id_funcionario === usuario!.id
                  ? usuario!.nome
                  : `Funcionário #${r.id_funcionario}`}
              </strong>
            </div>
          </div>
          <div className="detail-block">
            <h2>Motivo</h2>
            <p>{r.motivo}</p>
          </div>
          <div className="detail-block">
            <h2>Descrição da situação</h2>
            <p>{r.desc_situacao}</p>
          </div>
          <div className="detail-block">
            <h2>Providências adotadas</h2>
            <p>{r.providencia}</p>
          </div>
        </section>
      )}
      {excluir && (
        <Confirm
          titulo="Excluir relatório?"
          texto={`O registro #${r.id} será excluído permanentemente.`}
          ocupado={ocupado}
          erro={erro}
          fechar={() => setExcluir(false)}
          confirmar={() => void confirmar()}
          acao="Excluir relatório"
        />
      )}
    </>
  );
}
