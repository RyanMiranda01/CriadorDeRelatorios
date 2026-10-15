import { useState, type FormEvent } from "react";
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useConsulta } from "../hooks/useConsulta";
import { funcionariosApi } from "../services";
import { camposErro, mensagemErro } from "../api/client";
import { niveis, type Funcionario } from "../types";
import {
  Alert,
  Confirm,
  Empty,
  Field,
  Loading,
  Modal,
  PageHeader,
  Password,
} from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { senhaSchema } from "./Login";
const texto = z
  .string()
  .trim()
  .min(1, "Preencha este campo.")
  .max(255, "Use no máximo 255 caracteres.");
function schemaFuncionario(novo: boolean) {
  return z
    .object({
      nome: texto,
      cargo: texto,
      nivel: z.enum(["PROFESSOR", "CORDENADOR", "ADMINISTRADOR"]),
      ativo: z.boolean(),
      login: z.string(),
      senha: z.string(),
    })
    .superRefine((dados, ctx) => {
      if (!novo) return;
      if (
        !dados.login.trim() ||
        dados.login.length > 255 ||
        new TextEncoder().encode(dados.login).length > 72
      )
        ctx.addIssue({
          code: "custom",
          path: ["login"],
          message: "Informe um login com até 72 bytes em UTF-8.",
        });
      const validacao = senhaSchema.safeParse(dados.senha);
      if (!validacao.success)
        ctx.addIssue({
          code: "custom",
          path: ["senha"],
          message: validacao.error.issues[0].message,
        });
    });
}
type Dados = z.infer<ReturnType<typeof schemaFuncionario>>;
function FormFuncionario({
  funcionario,
  fechar,
  salvo,
}: {
  funcionario?: Funcionario;
  fechar: () => void;
  salvo: () => void;
}) {
  const [erro, setErro] = useState("");
  const novo = !funcionario;
  const form = useForm<Dados>({
    resolver: zodResolver(schemaFuncionario(novo)),
    defaultValues: {
      nome: funcionario?.nome ?? "",
      cargo: funcionario?.cargo ?? "",
      nivel: funcionario?.nivel ?? "PROFESSOR",
      ativo: funcionario?.ativo ?? true,
      login: funcionario?.login ?? "",
      senha: "",
    },
  });
  async function enviar(dados: Dados) {
    setErro("");
    if (
      funcionario &&
      (dados.nivel !== funcionario.nivel || (funcionario.ativo && !dados.ativo))
    ) {
      const confirmou = window.confirm(
        "Confirmar a alteração de acesso? As sessões desse funcionário serão encerradas. Se for sua própria conta, você precisará entrar novamente.",
      );
      if (!confirmou) return;
    }
    try {
      if (funcionario)
        await funcionariosApi.editar(funcionario.id, {
          nome: dados.nome,
          cargo: dados.cargo,
          nivel: dados.nivel,
          ativo: dados.ativo,
        });
      else
        await funcionariosApi.criar({
          nome: dados.nome,
          cargo: dados.cargo,
          nivel: dados.nivel,
          login: dados.login.trim(),
          senha: dados.senha,
        });
      salvo();
    } catch (error) {
      setErro(mensagemErro(error));
      for (const [campo, mensagem] of Object.entries(camposErro(error)))
        if (
          ["nome", "cargo", "nivel", "ativo", "login", "senha"].includes(campo)
        )
          form.setError(campo as keyof Dados, { message: mensagem });
    }
  }
  return (
    <Modal
      titulo={novo ? "Cadastrar funcionário" : "Editar funcionário"}
      fechar={fechar}
      ocupado={form.formState.isSubmitting}
    >
      <form onSubmit={form.handleSubmit(enviar)} noValidate>
        <p className="muted small">
          {novo
            ? "Crie um acesso para um integrante da equipe."
            : "Alterar o nível ou desativar a conta encerra as sessões desse funcionário."}
        </p>
        <Field
          id="func-nome"
          label="Nome completo"
          erro={form.formState.errors.nome?.message}
        >
          <input
            id="func-nome"
            autoComplete="name"
            aria-invalid={!!form.formState.errors.nome}
            aria-describedby="func-nome-error"
            {...form.register("nome")}
          />
        </Field>
        <div className="form-grid">
          <Field
            id="func-cargo"
            label="Cargo"
            erro={form.formState.errors.cargo?.message}
          >
            <input
              id="func-cargo"
              aria-invalid={!!form.formState.errors.cargo}
              aria-describedby="func-cargo-error"
              {...form.register("cargo")}
            />
          </Field>
          <Field
            id="func-nivel"
            label="Nível de acesso"
            erro={form.formState.errors.nivel?.message}
          >
            <select id="func-nivel" {...form.register("nivel")}>
              {Object.entries(niveis).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {novo ? (
          <>
            <Field
              id="func-login"
              label="Login"
              erro={form.formState.errors.login?.message}
            >
              <input
                id="func-login"
                autoComplete="off"
                aria-invalid={!!form.formState.errors.login}
                aria-describedby="func-login-error"
                {...form.register("login")}
              />
            </Field>
            <Field
              id="func-senha"
              label="Senha inicial"
              erro={form.formState.errors.senha?.message}
              hint="De 12 a 64 caracteres, com no máximo 72 bytes em UTF-8."
            >
              <Password
                id="func-senha"
                autoComplete="new-password"
                invalid={!!form.formState.errors.senha}
                describedBy="func-senha-hint func-senha-error"
                {...form.register("senha")}
              />
            </Field>
          </>
        ) : (
          <>
            <p className="small muted">
              Login: <strong>{funcionario.login}</strong>
            </p>
            <label className="checkbox-label">
              <input type="checkbox" {...form.register("ativo")} /> Funcionário
              ativo
            </label>
          </>
        )}
        {erro && <Alert>{erro}</Alert>}
        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={fechar}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </button>
          <button
            className="btn primary"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Salvando…"
              : novo
                ? "Cadastrar funcionário"
                : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Funcionarios() {
  const { usuario } = useAuth();
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const consulta = useConsulta(
    (signal) => funcionariosApi.listar(nome, signal),
    nome,
  );
  const [formulario, setFormulario] = useState<Funcionario | "novo" | null>(
    null,
  );
  const [resetar, setResetar] = useState<Funcionario | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  async function confirmarReset() {
    if (!resetar) return;
    setOcupado(true);
    setErro("");
    try {
      await funcionariosApi.resetar(resetar.id);
      setSucesso(
        "Senha redefinida. As sessões foram expiradas e a troca será obrigatória no próximo acesso.",
      );
      setResetar(null);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setOcupado(false);
    }
  }
  function pesquisar(evento: FormEvent) {
    evento.preventDefault();
    setNome(busca.trim());
  }
  return (
    <>
      <PageHeader
        eyebrow="EQUIPE DISCOVERON"
        titulo="Funcionários"
        descricao="Gerencie os acessos e as informações da equipe."
      >
        <button className="btn primary" onClick={() => setFormulario("novo")}>
          <Plus size={18} /> Novo funcionário
        </button>
      </PageHeader>
      {sucesso && <Alert sucesso>{sucesso}</Alert>}
      <div className="access-note">
        <ShieldCheck size={19} />
        <span>
          Área exclusiva de administradores. Alterações de acesso e reset de
          senha encerram as sessões afetadas.
        </span>
      </div>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Integrantes da equipe</h2>
            <p className="muted small">
              Consulte e mantenha os acessos atualizados.
            </p>
          </div>
          <span className="pill neutral">
            <Users size={14} />
            {consulta.dados?.length ?? "—"} funcionários
          </span>
        </div>
        <form className="filter-bar" onSubmit={pesquisar}>
          <label className="sr-only" htmlFor="busca-funcionario">
            Nome do funcionário
          </label>
          <input
            id="busca-funcionario"
            placeholder="Buscar pelo nome do funcionário"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="btn secondary">
            <Search size={17} /> Buscar
          </button>
          {nome && (
            <button
              className="btn text"
              type="button"
              onClick={() => {
                setBusca("");
                setNome("");
              }}
            >
              Limpar
            </button>
          )}
        </form>
        {consulta.carregando ? (
          <Loading />
        ) : consulta.erro ? (
          <div className="table-feedback">
            <Alert>{consulta.erro}</Alert>
            <button className="btn secondary" onClick={consulta.atualizar}>
              Tentar novamente
            </button>
          </div>
        ) : consulta.dados?.length ? (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Funcionários cadastrados</caption>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Cargo</th>
                  <th>Acesso</th>
                  <th>Situação</th>
                  <th className="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {consulta.dados.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className="cell-title">
                        {f.nome}{" "}
                        {usuario!.id === f.id && (
                          <small className="you-tag">Você</small>
                        )}
                      </span>
                      <span className="cell-subtitle">{f.login}</span>
                    </td>
                    <td>{f.cargo}</td>
                    <td>
                      <span className="pill neutral">{niveis[f.nivel]}</span>
                    </td>
                    <td>
                      <span
                        className={`status-tag ${f.ativo ? "is-active" : ""}`}
                      >
                        <span />
                        {f.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar ${f.nome}`}
                          onClick={() => setFormulario(f)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Resetar senha de ${f.nome}`}
                          title="Resetar senha"
                          onClick={() => {
                            setErro("");
                            setResetar(f);
                          }}
                        >
                          <KeyRound size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            titulo="Nenhum funcionário encontrado"
            texto="Tente outro nome ou cadastre um novo integrante."
          />
        )}
        <div className="table-footer">
          Senhas e hashes não são exibidos nas consultas.
        </div>
      </section>
      {formulario && (
        <FormFuncionario
          funcionario={formulario === "novo" ? undefined : formulario}
          fechar={() => setFormulario(null)}
          salvo={() => {
            setFormulario(null);
            setSucesso("Dados do funcionário salvos com sucesso.");
            consulta.atualizar();
          }}
        />
      )}
      {resetar && (
        <Confirm
          titulo="Resetar senha?"
          texto={`A senha de ${resetar.nome} será temporariamente igual ao login. As sessões serão encerradas e a pessoa precisará criar uma nova senha ao entrar.${resetar.id === usuario!.id ? " Você está redefinindo a própria conta e precisará entrar novamente." : ""}`}
          ocupado={ocupado}
          erro={erro}
          fechar={() => setResetar(null)}
          confirmar={() => void confirmarReset()}
          acao="Resetar senha"
        />
      )}
    </>
  );
}
export function MinhaConta() {
  const { usuario } = useAuth();
  const u = usuario!;
  return (
    <>
      <PageHeader
        eyebrow="SEU PERFIL"
        titulo="Minha conta"
        descricao="Informações do seu acesso à DiscoverON."
      />
      <section className="panel account-panel">
        <div className="account-banner">
          <span className="account-avatar">
            <UserRound size={34} />
          </span>
          <div>
            <h2>{u.nome}</h2>
            <p>{niveis[u.nivel]}</p>
          </div>
        </div>
        <dl className="account-grid">
          <div>
            <dt>Nome completo</dt>
            <dd>{u.nome}</dd>
          </div>
          <div>
            <dt>Login</dt>
            <dd>{u.login}</dd>
          </div>
          <div>
            <dt>Cargo</dt>
            <dd>{u.cargo}</dd>
          </div>
          <div>
            <dt>Nível de acesso</dt>
            <dd>{niveis[u.nivel]}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>{u.ativo ? "Ativo" : "Inativo"}</dd>
          </div>
        </dl>
        <div className="account-help">
          <ShieldCheck size={21} />
          <div>
            <strong>
              Precisa atualizar seus dados ou redefinir sua senha?
            </strong>
            <p className="muted small">
              Entre em contato com o administrador da escola. Seus dados de
              acesso são gerenciados pela equipe responsável.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
