package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.*;
import com.discoveron.relatorios.dto.relatorio.*;
import com.discoveron.relatorios.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RelatoriosServiceTest {
    FuncionarioRepository funcionarios;
    RelatorioRepository repository;
    RelatoriosService service;
    Funcionarios logado;
    Relatorios deOutro;

    @BeforeEach void preparar() {
        funcionarios = mock(FuncionarioRepository.class);
        repository = mock(RelatorioRepository.class);
        service = new RelatoriosService(repository, funcionarios);
        logado = new Funcionarios();
        logado.setId(1L);
        logado.setLogin("maria");
        logado.setAtivo(true);
        logado.setNivel(Nivel.PROFESSOR);
        when(funcionarios.findByLogin("maria")).thenReturn(Optional.of(logado));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("maria", null, List.of()));
        var outro = new Funcionarios();
        outro.setId(2L);
        deOutro = new Relatorios();
        deOutro.setId(10L);
        deOutro.setFuncionarios(outro);
        when(repository.findById(10L)).thenReturn(Optional.of(deOutro));
    }

    @AfterEach void limpar() { SecurityContextHolder.clearContext(); }

    @Test void todosOsFiltrosDoProfessorConsultamPorIdProprio() {
        service.listarRelatorios();
        service.listarPorAluno("Ana");
        service.listarPorFuncionario("Maria");
        service.listarPorPeriodo(Periodo.MATUTINO);
        service.listarPorData("01/10/2026", "02/10/2026");
        verify(repository).findByFuncionarios_Id(1L);
        verify(repository).findByNomeAlunoContainingIgnoreCaseAndFuncionarios_Id("Ana", 1L);
        verify(repository).findByFuncionarios_NomeContainingIgnoreCaseAndFuncionarios_Id("Maria", 1L);
        verify(repository).findByPeriodoAndFuncionarios_Id(Periodo.MATUTINO, 1L);
        verify(repository).buscarPorDataEFuncionario(LocalDate.of(2026,10,1).atStartOfDay(),
                LocalDate.of(2026,10,3).atStartOfDay(), 1L);
        verify(repository, never()).findAll();
    }

    @ParameterizedTest @EnumSource(value = Nivel.class, names = {"CORDENADOR", "ADMINISTRADOR"})
    void coordenadorEAdminConsultamTodos(Nivel nivel) {
        logado.setNivel(nivel);
        service.listarRelatorios();
        service.listarPorAluno("Ana");
        service.listarPorFuncionario("Maria");
        service.listarPorPeriodo(Periodo.MATUTINO);
        service.listarPorData("01/10/2026", "02/10/2026");
        assertEquals(10L, service.buscarRelatorioId(10L).id());
        verify(repository).findAll();
        verify(repository).findByNomeAlunoContainingIgnoreCase("Ana");
        verify(repository).findByFuncionarios_NomeContainingIgnoreCase("Maria");
        verify(repository).findByPeriodo(Periodo.MATUTINO);
        verify(repository).buscarPorData(any(), any());
    }

    @Test void professorNaoConsultaIdDeOutro() {
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.buscarRelatorioId(10L)).getStatusCode().value());
    }

    @ParameterizedTest @EnumSource(value = Nivel.class, names = {"PROFESSOR", "CORDENADOR"})
    void professorECoordenadorNaoEditamNemExcluemDeOutro(Nivel nivel) {
        logado.setNivel(nivel);
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.editarRelatorio(10L, dadosEdicao())).getStatusCode().value());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.deletarRelatorio(10L)).getStatusCode().value());
        verify(repository, never()).save(any());
        verify(repository, never()).delete(any());
    }

    @ParameterizedTest @EnumSource(Nivel.class)
    void todosPodemEditarEExcluirOsProprios(Nivel nivel) {
        logado.setNivel(nivel);
        deOutro.setFuncionarios(logado);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        service.editarRelatorio(10L, dadosEdicao());
        service.deletarRelatorio(10L);
        verify(repository).save(deOutro);
        verify(repository).delete(deOutro);
    }

    @Test void administradorEditaEExcluiDeOutro() {
        logado.setNivel(Nivel.ADMINISTRADOR);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        service.editarRelatorio(10L, dadosEdicao());
        service.deletarRelatorio(10L);
        verify(repository).delete(deOutro);
    }

    @Test void professorNaoEscolheOutroAutorNoCadastro() {
        when(repository.save(any())).thenAnswer(i -> { Relatorios r = i.getArgument(0); r.setId(3L); return r; });
        var resposta = service.cadastrarRelatorio(new RelatorioCadastroDTO("Ana", "7A", 2L,
                "Motivo", "Descrição", Periodo.MATUTINO, "Providência"));
        assertEquals(1L, resposta.id_funcionario());
        verify(funcionarios, never()).findById(any());
    }

    @Test void intervaloInvertidoRetorna400() {
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.listarPorData("02/10/2026", "01/10/2026")).getStatusCode().value());
        verify(repository, never()).buscarPorData(any(), any());
    }

    private RelatorioEditar dadosEdicao() {
        return new RelatorioEditar("Ana", "7A", "Motivo", "Descrição", Periodo.MATUTINO, "Providência");
    }
}
