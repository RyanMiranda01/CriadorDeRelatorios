import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Layers3,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useConsulta } from "../hooks/useConsulta";
import { relatoriosApi } from "../services";
import { ordenarRecentes } from "../utils";
import { niveis, periodos } from "../types";
import { Alert, Empty, Loading, PageHeader } from "../components/UI";
import { NovoButton } from "../components/Layout";
export function Dashboard() {
  const { usuario } = useAuth();
  const consulta = useConsulta((signal) =>
    relatoriosApi.listar({ tipo: "todos" }, signal),
  );
  const lista = consulta.dados ?? [];
  const recentes = ordenarRecentes(lista).slice(0, 5);
  return (
    <>
      <PageHeader
        eyebrow="SEU ESPAÇO DE GESTÃO"
        titulo={`Olá, ${usuario!.nome.split(" ")[0]}.`}
        descricao="Vamos acompanhar as histórias que fazem parte da nossa escola."
      >
        <NovoButton />
      </PageHeader>
      <section className="welcome-banner">
        <div>
          <span className="pill light">
            <Sparkles size={14} /> Transformando vidas através do conhecimento
          </span>
          <h2>
            Pequenos registros.
            <br />
            Grandes possibilidades.
          </h2>
          <p>
            Organize as informações e encontre mais tempo
            <br className="desktop-only" /> para o que importa: educar.
          </p>
          <Link to="/relatorios" className="banner-link">
            Explorar relatórios <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="paper paper-back" />
          <div className="paper">
            <span className="paper-symbol">
              <FileText size={29} />
            </span>
            <i />
            <i />
            <i />
            <div className="paper-check">✓</div>
          </div>
          <span className="art-dot dot-a" />
          <span className="art-dot dot-b" />
        </div>
      </section>
      {consulta.erro ? (
        <Alert>
          {consulta.erro}{" "}
          <button className="inline-link" onClick={consulta.atualizar}>
            Tentar novamente
          </button>
        </Alert>
      ) : consulta.carregando ? (
        <Loading />
      ) : (
        <>
          <section
            className="stats-grid"
            aria-label="Indicadores dos relatórios autorizados"
          >
            <div className="stat-card">
              <span className="stat-icon blue">
                <FileText size={21} />
              </span>
              <span className="stat-label">
                {usuario!.nivel === "PROFESSOR"
                  ? "Meus relatórios"
                  : "Relatórios disponíveis"}
              </span>
              <strong>{lista.length}</strong>
              <small>Registros que você pode consultar</small>
            </div>
            <div className="stat-card">
              <span className="stat-icon violet">
                <Layers3 size={21} />
              </span>
              <span className="stat-label">Turmas mencionadas</span>
              <strong>
                {new Set(lista.map((r) => r.turma.trim()).filter(Boolean)).size}
              </strong>
              <small>Nomes distintos nos relatórios</small>
            </div>
            <div className="stat-card">
              <span className="stat-icon teal">
                <CalendarDays size={21} />
              </span>
              <span className="stat-label">Último registro</span>
              <strong className="stat-date">
                {recentes[0]?.data_criacao.split(" ")[0] ?? "—"}
              </strong>
              <small>
                {recentes.length
                  ? "Na sua lista autorizada"
                  : "Nenhum registro disponível"}
              </small>
            </div>
          </section>
          <section className="dashboard-lower">
            <div className="panel">
              <div className="section-head">
                <div>
                  <h2>Relatórios recentes</h2>
                  <p className="muted small">
                    Os últimos registros da sua área de acesso.
                  </p>
                </div>
                <Link to="/relatorios" className="inline-link">
                  Ver todos <ArrowRight size={15} />
                </Link>
              </div>
              {recentes.length ? (
                <div className="recent-list">
                  {recentes.map((r) => (
                    <Link
                      key={r.id}
                      to={`/relatorios/${r.id}`}
                      className="recent-item"
                    >
                      <span className="report-mini">
                        <FileText size={19} />
                      </span>
                      <span className="recent-copy">
                        <strong>{r.nome_aluno}</strong>
                        <small>
                          {r.turma} · {periodos[r.periodo]}
                        </small>
                      </span>
                      <span className="recent-date">
                        {r.data_criacao.split(" ")[0]}
                      </span>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty texto="Crie o primeiro relatório para começar.">
                  <Link className="btn secondary" to="/relatorios/novo">
                    <Plus size={16} /> Criar relatório
                  </Link>
                </Empty>
              )}
            </div>
            <aside className="panel shortcuts">
              <h2>Acesso rápido</h2>
              <Link to="/relatorios/novo">
                <span className="shortcut-icon">
                  <Plus size={20} />
                </span>
                <span>
                  <strong>Novo relatório</strong>
                  <small>Registrar uma nova situação</small>
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/minha-conta">
                <span className="shortcut-icon">
                  <UserRound size={20} />
                </span>
                <span>
                  <strong>Minha conta</strong>
                  <small>{niveis[usuario!.nivel]}</small>
                </span>
                <ArrowRight size={16} />
              </Link>
              <div className="shortcut-tip">
                <strong>Informação com responsabilidade.</strong>
                <p>
                  Registre fatos com clareza e preserve a privacidade dos
                  envolvidos.
                </p>
              </div>
            </aside>
          </section>
        </>
      )}
    </>
  );
}
