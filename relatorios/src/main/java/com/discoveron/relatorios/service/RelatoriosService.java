package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;
import com.discoveron.relatorios.dto.relatorio.RelatorioCadastroDTO;
import com.discoveron.relatorios.dto.relatorio.RelatorioEditar;
import com.discoveron.relatorios.dto.relatorio.RelatoriosRespostasDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import com.discoveron.relatorios.repository.RelatorioRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.List;

@Service
public class RelatoriosService {

    private final RelatorioRepository relatorioRepository;

    public RelatoriosService(RelatorioRepository relatorioRepository) {
        this.relatorioRepository = relatorioRepository;
    }

    public RelatorioCadastroDTO cadastrarRelatorio(@Valid RelatorioCadastroDTO relatorioCadastroDTO) {
        Relatorios relatorios = new Relatorios(relatorioCadastroDTO);
        Relatorios relatorioAtualizado = relatorioRepository.save(relatorios);
        RelatorioCadastroDTO cadastroDTO = new RelatorioCadastroDTO(relatorioAtualizado);
        return cadastroDTO;
    }

    public List<RelatoriosRespostasDTO> listarRelatorios() {

        List<Relatorios> listaRelatorios = relatorioRepository.findAll();
        List<RelatoriosRespostasDTO> listaResposta = new ArrayList<>();

        for (Relatorios relatorios : listaRelatorios) {
            RelatoriosRespostasDTO relatoriosRespostasDTO = new RelatoriosRespostasDTO(relatorios);
            listaResposta.add(relatoriosRespostasDTO);
        }

        return listaResposta;
    }

    public RelatoriosRespostasDTO editarRelatorio(Long id, @Valid RelatorioEditar relatorioEditar) {
        Relatorios relatorios = relatorioRepository.findById(id).orElseThrow(() -> new RuntimeException("Relatorio nao encontrado!"));

        relatorios.setNomeAluno(relatorioEditar.nome_aluno());
        relatorios.setDesc_situacao(relatorioEditar.desc_situacao());
        relatorios.setMotivo(relatorioEditar.motivo());
        relatorios.setPeriodo(relatorioEditar.periodo());
        relatorios.setProvidencia(relatorioEditar.providencia());
        relatorios.setTurma(relatorioEditar.turma());

        Relatorios relatorioAlterado = relatorioRepository.save(relatorios);
        RelatoriosRespostasDTO relatoriosRespostasDTO = new RelatoriosRespostasDTO(relatorioAlterado);

        return relatoriosRespostasDTO;
    }

    public RelatoriosRespostasDTO buscarRelatorioId(Long id) {
        Relatorios relatorios = relatorioRepository.findById(id).orElseThrow(() -> new RuntimeException("Relatorio nao encontrado!"));
        RelatoriosRespostasDTO relatoriosRespostasDTO = new RelatoriosRespostasDTO(relatorios);
        return relatoriosRespostasDTO;
    }

    public void deletarRelatorio(Long id) {
        relatorioRepository.deleteById(id);
    }


    public List<RelatoriosRespostasDTO> listarPorData(String inicio, String fim) {

        DateTimeFormatter formato =
                DateTimeFormatter.ofPattern("dd/MM/uuuu")
                        .withResolverStyle(ResolverStyle.STRICT);

        LocalDate dataInicio;
        LocalDate dataFim;

        try {
            dataInicio = LocalDate.parse(inicio, formato);
            dataFim = LocalDate.parse(fim, formato);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe datas válidas no formato dd/MM/yyyy."
            );
        }

        if (dataInicio.isAfter(dataFim)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data inicial deve ser anterior ou igual à final."
            );
        }

        return relatorioRepository.buscarPorData(
                        dataInicio.atStartOfDay(),
                        dataFim.plusDays(1).atStartOfDay()
                )
                .stream()
                .map(RelatoriosRespostasDTO::new)
                .toList();
    }

    public List<RelatoriosRespostasDTO> listarPorPeriodo(Periodo periodo) {

        List<Relatorios> listaRelatorios = relatorioRepository.findByPeriodo(periodo);
        List<RelatoriosRespostasDTO> listaResposta = new ArrayList<>();

        for (Relatorios relatorios : listaRelatorios) {
            RelatoriosRespostasDTO relatoriosRespostasDTO = new RelatoriosRespostasDTO(relatorios);
            listaResposta.add(relatoriosRespostasDTO);
        }

        return listaResposta;
    }

    public List<RelatoriosRespostasDTO> listarPorFuncionario(String nomeF) {

        List<Relatorios> listaRelatorios = relatorioRepository.findByFuncionarios_NomeContainingIgnoreCase(nomeF);
        List<RelatoriosRespostasDTO> listaResposta = new ArrayList<>();

        for (Relatorios relatorios : listaRelatorios) {
            RelatoriosRespostasDTO relatoriosRespostasDTO = new RelatoriosRespostasDTO(relatorios);
            listaResposta.add(relatoriosRespostasDTO);
        }

        return listaResposta;
    }

    public List<RelatoriosRespostasDTO> listarPorAluno(String aluno) {


        List<Relatorios> listaRelatorios = relatorioRepository.findByNomeAlunoContainingIgnoreCase(aluno);
        List<RelatoriosRespostasDTO> listaResposta = new ArrayList<>();

        for (Relatorios relatorios : listaRelatorios) {
            RelatoriosRespostasDTO relatoriosRespostasDTO = new RelatoriosRespostasDTO(relatorios);
            listaResposta.add(relatoriosRespostasDTO);
        }

        return listaResposta;
    }
}
