import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileSearch,
  LoaderCircle,
  X,
} from "lucide-react";
export function Alert({
  children,
  sucesso = false,
}: {
  children: ReactNode;
  sucesso?: boolean;
}) {
  return (
    <div
      role={sucesso ? "status" : "alert"}
      className={`alert ${sucesso ? "alert-success" : ""}`}
    >
      {sucesso ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>Carregando informações…</span>
    </div>
  );
}
export function Empty({
  titulo = "Nenhum relatório por aqui",
  texto = "Os registros aparecerão aqui quando estiverem disponíveis.",
  children,
}: {
  titulo?: string;
  texto?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <FileSearch size={30} />
      </span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {children}
    </div>
  );
}
export function Field({
  label,
  erro,
  id,
  children,
  hint,
  className = "",
}: {
  label: string;
  erro?: string;
  id: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {erro && (
        <small className="field-error" id={`${id}-error`}>
          {erro}
        </small>
      )}
    </div>
  );
}
export function Password({
  id,
  invalid,
  describedBy,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  describedBy?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="password">
      <input
        {...props}
        id={id}
        type={visivel ? "text" : "password"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="icon-button"
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setVisivel(!visivel)}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
export function Modal({
  titulo,
  children,
  fechar,
  ocupado = false,
}: {
  titulo: string;
  children: ReactNode;
  fechar: () => void;
  ocupado?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const elemento = dialog.current;
    elemento?.showModal();
    return () => elemento?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="modal-titulo"
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) fechar();
      }}
    >
      <div className="modal-head">
        <h2 id="modal-titulo">{titulo}</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Fechar"
          onClick={fechar}
          disabled={ocupado}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  titulo,
  texto,
  confirmar,
  fechar,
  ocupado,
  erro,
  acao = "Confirmar",
}: {
  titulo: string;
  texto: string;
  confirmar: () => void;
  fechar: () => void;
  ocupado: boolean;
  erro: string;
  acao?: string;
}) {
  return (
    <Modal titulo={titulo} fechar={fechar} ocupado={ocupado}>
      <p className="muted">{texto}</p>
      {erro && <Alert>{erro}</Alert>}
      <div className="form-actions">
        <button
          type="button"
          className="btn secondary"
          onClick={fechar}
          disabled={ocupado}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={confirmar}
          disabled={ocupado}
        >
          {ocupado ? "Aguarde…" : acao}
        </button>
      </div>
    </Modal>
  );
}
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-name">
        Discover<span>ON</span>
        <span className="brand-dot">.</span>
      </span>
      <span className="brand-subtitle">GESTÃO DE RELATÓRIOS</span>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  children,
}: {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{titulo}</h1>
        {descricao && <p className="muted">{descricao}</p>}
      </div>
      {children}
    </div>
  );
}
