import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Alert, Loading } from "./components/UI";
import { Layout } from "./components/Layout";
import { Login, TrocarSenha } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { NovoRelatorio, RelatorioPagina, Relatorios } from "./pages/Relatorios";
import { RelatorioPdf } from "./pages/RelatorioPdf";
import { Funcionarios, MinhaConta } from "./pages/Funcionarios";
export function Protegida({
  administrador = false,
}: {
  administrador?: boolean;
}) {
  const auth = useAuth();
  if (auth.status === "anonimo") return <Navigate to="/login" replace />;
  if (auth.status === "troca-obrigatoria")
    return <Navigate to="/trocar-senha" replace />;
  if (administrador && auth.usuario?.nivel !== "ADMINISTRADOR")
    return (
      <>
        <h1>Acesso restrito</h1>
        <Alert>Esta área é exclusiva de administradores.</Alert>
      </>
    );
  return <Outlet />;
}
export default function App() {
  const auth = useAuth();
  if (auth.status === "carregando")
    return (
      <main className="initial-loading">
        <Loading />
      </main>
    );
  if (auth.status === "erro")
    return (
      <main className="initial-error">
        <h1>Não foi possível carregar sua sessão</h1>
        <Alert>{auth.erro}</Alert>
        <button className="btn primary" onClick={() => void auth.carregar()}>
          Tentar novamente
        </button>
      </main>
    );
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/trocar-senha" element={<TrocarSenha />} />
      <Route element={<Protegida />}>
        <Route path="/relatorios/:id/pdf" element={<RelatorioPdf />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/relatorios/novo" element={<NovoRelatorio />} />
          <Route path="/relatorios/:id" element={<RelatorioPagina />} />
          <Route
            path="/relatorios/:id/editar"
            element={<RelatorioPagina editar />}
          />
          <Route path="/minha-conta" element={<MinhaConta />} />
          <Route element={<Protegida administrador />}>
            <Route path="/funcionarios" element={<Funcionarios />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <Navigate
            to={
              auth.status === "troca-obrigatoria" ? "/trocar-senha" : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
}
