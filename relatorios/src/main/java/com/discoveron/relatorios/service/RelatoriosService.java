package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.domain.Nivel;
import com.discoveron.relatorios.domain.Periodo;
import com.discoveron.relatorios.domain.Relatorios;
import com.discoveron.relatorios.dto.relatorio.RelatorioCadastroDTO;
import com.discoveron.relatorios.dto.relatorio.RelatorioEditar;
import com.discoveron.relatorios.dto.relatorio.RelatoriosRespostasDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import com.discoveron.relatorios.repository.RelatorioRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class RelatoriosService {

    private final RelatorioRepository relatorioRepository;
    private final FuncionarioRepository funcionarioRepository;

    public RelatoriosService(RelatorioRepository relatorioRepository, FuncionarioRepository funcionarioRepository) {
        this.relatorioRepository = relatorioRepository;
        this.funcionarioRepository = funcionarioRepository;
    }

    @Transactional
    public RelatoriosRespostasDTO cadastrarRelatorio(@Valid RelatorioCadastroDTO relatorioCadastroDTO) {

        Funcionarios funcionarioLogado = buscarFuncionarioLogado();
        Funcionarios funcionarios = funcionarioLogado;

        if (funcionarioLogado.getNivel() == Nivel.ADMINISTRADOR
                && relatorioCadastroDTO.funcionarios_id() != null) {
            funcionarios = funcionarioRepository
                    .findById(relatorioCadastroDTO.funcionarios_id())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Funcionário não encontrado!"
                    ));
        }


        Relatorios relatorios = new Relatorios(relatorioCadastroDTO, funcionarios);
        Relatorios relatorioAtualizado = relatorioRepository.save(relatorios);
        RelatoriosRespostasDTO cadastroDTO = new RelatoriosRespostasDTO(relatorioAtualizado);
        return cadastroDTO;
    }

    public List<RelatoriosRespostasDTO> listarRelatorios() {
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();
        List<Relatorios> relatorios;
        if (funcionarioLogado.getNivel() == Nivel.PROFESSOR) {
            relatorios = relatorioRepository.findByFuncionarios_Id(funcionarioLogado.getId()
            );
        } else {
            relatorios = relatorioRepository.findAll();
        }

        return relatorios.stream()
                .map(RelatoriosRespostasDTO::new)
                .toList();
    }

    @Transactional
    public RelatoriosRespostasDTO editarRelatorio(Long id, @Valid RelatorioEditar relatorioEditar) {
        Relatorios relatorios = relatorioRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relatorio nao encontrado!"));

        Funcionarios funcionarioLogado = buscarFuncionarioLogado();

        boolean administrador = funcionarioLogado.getNivel() == Nivel.ADMINISTRADOR;

        boolean proprioRelatorio = relatorios.getFuncionarios().getId()
                .equals(funcionarioLogado.getId());

        if (!administrador && !proprioRelatorio) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você só pode editar seus próprios relatórios."
            );
        }
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
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();

        Relatorios relatorio = relatorioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Relatório não encontrado!"
                ));

        boolean professor = funcionarioLogado.getNivel() == Nivel.PROFESSOR;

        boolean proprioRelatorio = relatorio.getFuncionarios().getId()
                .equals(funcionarioLogado.getId());

        if (professor && !proprioRelatorio) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Relatório não encontrado!"
            );
        }

        return new RelatoriosRespostasDTO(relatorio);
    }

    @Transactional
    public void deletarRelatorio(Long id) {
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();

        Relatorios relatorio = relatorioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Relatório não encontrado!"
                ));

        boolean administrador =
                funcionarioLogado.getNivel() == Nivel.ADMINISTRADOR;

        boolean proprioRelatorio = relatorio.getFuncionarios().getId()
                .equals(funcionarioLogado.getId());

        if (!administrador && !proprioRelatorio) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você só pode excluir seus próprios relatórios."
            );
        }

        relatorioRepository.delete(relatorio);
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
            if (dataInicio.isAfter(dataFim)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A data inicial deve ser anterior ou igual à final."
                );
            }
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe datas válidas no formato dd/MM/yyyy."
            );
        }
        if (dataInicio.getYear() < 1000 || dataFim.getYear() > 9999) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe anos entre 1000 e 9999.");
        }
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();

        List<Relatorios> relatorios;

        if (funcionarioLogado.getNivel() == Nivel.PROFESSOR) {
            relatorios = relatorioRepository.buscarPorDataEFuncionario(
                    dataInicio.atStartOfDay(),
                    dataFim.plusDays(1).atStartOfDay(),
                    funcionarioLogado.getId()
            );
        } else {
            relatorios = relatorioRepository.buscarPorData(
                    dataInicio.atStartOfDay(),
                    dataFim.plusDays(1).atStartOfDay()
            );
        }

        return relatorios.stream()
                .map(RelatoriosRespostasDTO::new)
                .toList();
    }


    public List<RelatoriosRespostasDTO> listarPorPeriodo(Periodo periodo) {
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();
        List<Relatorios> relatorios;
        if (funcionarioLogado.getNivel() == Nivel.PROFESSOR) {
            relatorios = relatorioRepository
                    .findByPeriodoAndFuncionarios_Id(
                            periodo,
                            funcionarioLogado.getId()
                    );
        } else {
            relatorios = relatorioRepository.findByPeriodo(periodo);
        }

        return relatorios.stream()
                .map(RelatoriosRespostasDTO::new)
                .toList();
    }

    public List<RelatoriosRespostasDTO> listarPorFuncionario(String nomeF) {
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();

        List<Relatorios> relatorios;

        if (funcionarioLogado.getNivel() == Nivel.PROFESSOR) {
            relatorios = relatorioRepository
                    .findByFuncionarios_NomeContainingIgnoreCaseAndFuncionarios_Id(
                            nomeF,
                            funcionarioLogado.getId()
                    );
        } else {
            relatorios = relatorioRepository
                    .findByFuncionarios_NomeContainingIgnoreCase(nomeF);
        }

        return relatorios.stream()
                .map(RelatoriosRespostasDTO::new)
                .toList();
    }



    public List<RelatoriosRespostasDTO> listarPorAluno(String aluno) {
        Funcionarios funcionarioLogado = buscarFuncionarioLogado();

        List<Relatorios> relatorios;

        if (funcionarioLogado.getNivel() == Nivel.PROFESSOR) {
            relatorios = relatorioRepository
                    .findByNomeAlunoContainingIgnoreCaseAndFuncionarios_Id(
                            aluno,
                            funcionarioLogado.getId()
                    );
        } else {
            relatorios = relatorioRepository
                    .findByNomeAlunoContainingIgnoreCase(aluno);
        }
        return relatorios.stream()
                .map(RelatoriosRespostasDTO::new)
                .toList();
    }


    private Funcionarios buscarFuncionarioLogado() {
        Authentication autenticacao = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login."
            );
        }

        Funcionarios funcionario = funcionarioRepository.findByLogin(autenticacao.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Funcionário autenticado não encontrado."
                ));
        if (!funcionario.isAtivo() || funcionario.getNivel() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Funcionário sem acesso.");
        }
        if (funcionario.isTrocaSenhaObrigatoria()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Troca de senha obrigatória.");
        }
        return funcionario;
    }
}
