import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { niveis } from "../types";
import { mensagemErro } from "../api/client";
import { Alert, Brand } from "./UI";
export function Layout() {
  const auth = useAuth();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");
  const local = useLocation();
  const usuario = auth.usuario!;
  useEffect(() => {
    function fechar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, []);
  const links = [
    { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
    { to: "/relatorios", label: "Relatórios", icon: FileText },
    ...(usuario.nivel === "ADMINISTRADOR"
      ? [{ to: "/funcionarios", label: "Funcionários", icon: Users }]
      : []),
    { to: "/minha-conta", label: "Minha conta", icon: UserRound },
  ];
  async function sair() {
    setSaindo(true);
    setErro("");
    try {
      await auth.sair();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSaindo(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      {aberto && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
        />
      )}
      <aside className={`sidebar ${aberto ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p className="nav-caption">ESPAÇO DE TRABALHO</p>
        <nav aria-label="Navegação principal">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setAberto(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <ShieldCheck size={21} />
          </span>
          <strong>Um espaço para cuidar.</strong>
          <p>Informações organizadas para acompanhar cada história.</p>
        </div>
        <div className="sidebar-bottom">
          <span className="connection-dot" /> Ambiente interno da escola
          <ArrowUpRight size={14} />
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-only"
              aria-label="Abrir menu"
              aria-expanded={aberto}
              onClick={() => setAberto(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              DiscoverON <span>/</span>{" "}
              {local.pathname.startsWith("/funcionarios")
                ? "Equipe"
                : local.pathname.startsWith("/minha-conta")
                  ? "Minha conta"
                  : "Gestão educacional"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="user-copy">
              <strong>{usuario.nome}</strong>
              <small>{niveis[usuario.nivel]}</small>
            </span>
            <span className="avatar">
              {usuario.nome.slice(0, 1).toUpperCase()}
            </span>
            <button
              className="icon-button"
              aria-label="Sair do sistema"
              title="Sair"
              onClick={() => void sair()}
              disabled={saindo}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="conteudo" className="content" tabIndex={-1}>
          {erro && <Alert>{erro}</Alert>}
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>DiscoverON · Gestão de Relatórios</span>
          <span>Educação que conecta.</span>
        </footer>
      </div>
    </div>
  );
}
export function NovoButton() {
  return (
    <NavLink className="btn primary" to="/relatorios/novo">
      <Plus size={18} /> Novo relatório
    </NavLink>
  );
}
