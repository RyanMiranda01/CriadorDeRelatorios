import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { mensagemErro } from "../api/client";
export function useConsulta<T>(
  buscar: (signal: AbortSignal) => Promise<T>,
  chave = "",
) {
  const [dados, setDados] = useState<T>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;
  const atualizar = useCallback(() => setVersao((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro("");
    setDados(undefined);
    buscarRef
      .current(controller.signal)
      .then((resultado) => {
        if (!controller.signal.aborted) setDados(resultado);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !axios.isCancel(error))
          setErro(mensagemErro(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });
    return () => controller.abort();
  }, [versao, chave]);
  return { dados, carregando, erro, atualizar };
}
