import { useState } from "react";
import { ArrowRight, Check, FileText, LockKeyhole, LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, mensagemErro } from "../api/client";
import { Alert, Brand, Field, Password } from "../components/UI";
const loginSchema = z.object({
  login: z.string().trim().min(1, "Informe seu login."),
  senha: z.string().min(1, "Informe sua senha."),
});
export const senhaSchema = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .max(64, "Use no máximo 64 caracteres.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Use no máximo 72 bytes em UTF-8.",
  );
const trocaSchema = z
  .object({
    novaSenha: senhaSchema,
    confirmacao: z.string().min(1, "Confirme a senha."),
  })
  .refine((dados) => dados.novaSenha === dados.confirmacao, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmacao"],
  });
export function Login() {
  const auth = useAuth();
  const [erro, setErro] = useState("");
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  if (auth.status === "autenticado")
    return <Navigate to="/dashboard" replace />;
  if (auth.status === "troca-obrigatoria")
    return <Navigate to="/trocar-senha" replace />;
  async function enviar(dados: z.infer<typeof loginSchema>) {
    setErro("");
    try {
      await auth.entrar(dados.login, dados.senha);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand light />
        <div className="story-content">
          <span className="pill light">
            <span /> CONEXÕES QUE TRANSFORMAM
          </span>
          <h1>
            Cada registro,
            <br />
            um novo olhar
            <br />
            <em>para o futuro.</em>
          </h1>
          <p>
            Um espaço para organizar o presente e acompanhar as histórias que
            construímos juntos.
          </p>
          <div className="story-features">
            <span>
              <Check size={17} /> Mais organização
            </span>
            <span>
              <Check size={17} /> Mais conexão
            </span>
          </div>
        </div>
        <div className="story-footer">
          <FileText size={19} />
          <span>Gestão de Relatórios</span>
          <span className="story-line" />
        </div>
        <div className="orb orb-one" />
        <div className="orb orb-two" />
      </section>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">
          <span className="auth-icon">
            <LockKeyhole size={24} />
          </span>
          <p className="eyebrow">BEM-VINDO À DISCOVERON</p>
          <h2>Que bom ter você aqui.</h2>
          <p className="muted">
            Entre na sua conta para acessar o painel da escola.
          </p>
          {auth.aviso && <Alert sucesso>{auth.aviso}</Alert>}
          {erro && <Alert>{erro}</Alert>}
          <form onSubmit={form.handleSubmit(enviar)} noValidate>
            <Field
              id="login"
              label="Login"
              erro={form.formState.errors.login?.message}
            >
              <input
                id="login"
                autoComplete="username"
                placeholder="Seu login"
                aria-invalid={!!form.formState.errors.login}
                aria-describedby="login-error"
                {...form.register("login")}
              />
            </Field>
            <Field
              id="senha"
              label="Senha"
              erro={form.formState.errors.senha?.message}
            >
              <Password
                id="senha"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                invalid={!!form.formState.errors.senha}
                describedBy="senha-error"
                {...form.register("senha")}
              />
            </Field>
            <button
              className="btn primary full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Entrando…" : "Entrar no painel"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="auth-help">
            <LockKeyhole size={15} />
            <span>
              Acesso exclusivo à equipe DiscoverON.
              <br />
              Precisa redefinir sua senha? Procure o administrador.
            </span>
          </div>
        </div>
        <p className="auth-legal">DiscoverON | Gestão de Relatórios</p>
      </main>
    </div>
  );
}
export function TrocarSenha() {
  const auth = useAuth();
  const [erro, setErro] = useState("");
  const [saindo, setSaindo] = useState(false);
  const form = useForm<z.infer<typeof trocaSchema>>({
    resolver: zodResolver(trocaSchema),
  });
  async function enviar(dados: z.infer<typeof trocaSchema>) {
    setErro("");
    try {
      await api.put("/funcionarios/minha-senha", {
        novaSenha: dados.novaSenha,
      });
      auth.senhaAlterada();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }
  async function sair() {
    setSaindo(true);
    try {
      await auth.sair();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSaindo(false);
    }
  }
  if (auth.status === "anonimo") return <Navigate to="/login" replace />;
  if (auth.status === "autenticado")
    return <Navigate to="/dashboard" replace />;
  return (
    <main className="password-page">
      <Brand />
      <section className="panel password-card">
        <span className="auth-icon">
          <LockKeyhole size={25} />
        </span>
        <p className="eyebrow">SEGURANÇA DA CONTA</p>
        <h1>Uma nova senha para continuar.</h1>
        <p className="muted">
          Sua senha foi redefinida pelo administrador. Crie uma senha diferente
          da temporária e do seu login.
        </p>
        {erro && <Alert>{erro}</Alert>}
        <form onSubmit={form.handleSubmit(enviar)} noValidate>
          <Field
            id="novaSenha"
            label="Nova senha"
            hint="De 12 a 64 caracteres, respeitando o limite de 72 bytes em UTF-8."
            erro={form.formState.errors.novaSenha?.message}
          >
            <Password
              id="novaSenha"
              autoComplete="new-password"
              invalid={!!form.formState.errors.novaSenha}
              describedBy="novaSenha-hint novaSenha-error"
              {...form.register("novaSenha")}
            />
          </Field>
          <Field
            id="confirmacao"
            label="Confirme a nova senha"
            erro={form.formState.errors.confirmacao?.message}
          >
            <Password
              id="confirmacao"
              autoComplete="new-password"
              invalid={!!form.formState.errors.confirmacao}
              describedBy="confirmacao-error"
              {...form.register("confirmacao")}
            />
          </Field>
          <button
            className="btn primary full"
            disabled={form.formState.isSubmitting || saindo}
          >
            {form.formState.isSubmitting ? "Salvando…" : "Salvar nova senha"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="small muted">
          Após salvar, entre novamente com sua nova senha.
        </p>
        <button
          className="btn text"
          onClick={() => void sair()}
          disabled={saindo || form.formState.isSubmitting}
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </section>
    </main>
  );
}
