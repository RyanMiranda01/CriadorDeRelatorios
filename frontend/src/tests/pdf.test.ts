import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import type { Relatorio } from "../types";
const dados: Relatorio = {
  id: 25,
  id_funcionario: 1,
  nome_aluno: "João de Teste",
  turma: "Turma de teste",
  periodo: "MATUTINO",
  motivo: "Orientação",
  desc_situacao: "Descrição com acentuação: ação, atenção, português.",
  providencia: "Providência de teste.",
  data_criacao: "14/10/2026 08:00:00",
};
beforeEach(async () => {
  const bytes = await readFile("src/assets/fonts/DejaVuSans.ttf");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
    }),
  );
  vi.resetModules();
});
afterEach(() => vi.unstubAllGlobals());
it("gera um arquivo PDF real com fonte incorporada para português", async () => {
  const { gerarPdf } = await import("../utils/pdf");
  const resultado = await gerarPdf(dados, "Maria de Teste");
  expect(resultado.blob.type).toBe("application/pdf");
  expect(resultado.blob.size).toBeGreaterThan(10000);
  expect(resultado.paginas).toBe(1);
  const texto = await new Promise<string>((resolve) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.readAsText(resultado.blob);
  });
  expect(texto.startsWith("%PDF-")).toBe(true);
});
it("distribui textos longos em várias páginas sem truncar o registro", async () => {
  const { gerarPdf } = await import("../utils/pdf");
  const resultado = await gerarPdf(
    {
      ...dados,
      desc_situacao: "Descrição detalhada de uma situação educacional. ".repeat(
        600,
      ),
      providencia: "Orientação realizada. ".repeat(300),
    },
    "Maria de Teste",
  );
  expect(resultado.paginas).toBeGreaterThan(3);
  expect(resultado.blob.type).toBe("application/pdf");
});
it("informa falha ao carregar a fonte em vez de gerar arquivo inválido", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  const { gerarPdf } = await import("../utils/pdf");
  await expect(gerarPdf(dados, "Maria de Teste")).rejects.toThrow(
    "Não foi possível carregar a fonte",
  );
});
