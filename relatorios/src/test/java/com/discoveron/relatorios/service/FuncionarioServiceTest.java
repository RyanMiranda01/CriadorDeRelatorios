package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.*;
import com.discoveron.relatorios.dto.funcionarios.*;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import com.discoveron.relatorios.validacao.funcionarios.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FuncionarioServiceTest {
    FuncionarioRepository repository;
    ValidarFuncionariosExistentesPorId porId;
    SessoesService sessoes;
    PasswordEncoder encoder;
    FuncionarioService service;
    Funcionarios funcionario;

    @BeforeEach void preparar() {
        repository = mock(FuncionarioRepository.class);
        porId = mock(ValidarFuncionariosExistentesPorId.class);
        sessoes = mock(SessoesService.class);
        encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        service = new FuncionarioService(repository, mock(ValidarFuncionarioExistente.class), porId, encoder, sessoes);
        funcionario = new Funcionarios();
        funcionario.setId(1L);
        funcionario.setLogin("professor");
        funcionario.setNivel(Nivel.PROFESSOR);
        funcionario.setAtivo(true);
        funcionario.setSenha(encoder.encode("professor"));
        when(repository.findByLogin("professor")).thenReturn(Optional.of(funcionario));
        when(porId.validarFuncionariosId(1L)).thenReturn(funcionario);
    }

    @Test void resetExigeTrocaESessoesExpiram() {
        service.resetarSenha(1L);
        assertTrue(encoder.matches("professor", funcionario.getSenha()));
        assertTrue(funcionario.isTrocaSenhaObrigatoria());
        verify(repository).save(funcionario);
        verify(sessoes).expirarSessoes("professor");
    }

    @Test void trocaPropriaSalvaUmaVezELimpaPendencia() {
        funcionario.setTrocaSenhaObrigatoria(true);
        service.trocarPropriaSenha("professor", new TrocarSenhaDTO("NovaSenhaValida123!"));
        assertTrue(encoder.matches("NovaSenhaValida123!", funcionario.getSenha()));
        assertFalse(funcionario.isTrocaSenhaObrigatoria());
        verify(repository, times(1)).save(funcionario);
        verify(sessoes).expirarSessoes("professor");
    }

    @Test void trocaSemPendenciaNaoAlteraSenha() {
        assertThrows(ResponseStatusException.class, () -> service.trocarPropriaSenha(
                "professor", new TrocarSenhaDTO("NovaSenhaValida123!")));
        verify(repository, never()).save(any());
    }

    @Test void senhaQueExcedeLimiteDeBytesNaoChegaAoEncoder() {
        assertThrows(ResponseStatusException.class, () -> service.criarNovaSenha(1L, "á".repeat(40)));
        verify(repository, never()).save(any());
    }

    @Test void senhaAdministrativaExigeTrocaEExpiraSessoes() {
        service.criarNovaSenha(1L, "NovaTemporaria123!");
        assertTrue(funcionario.isTrocaSenhaObrigatoria());
        assertTrue(encoder.matches("NovaTemporaria123!", funcionario.getSenha()));
        verify(sessoes).expirarSessoes("professor");
    }

    @Test void mudancaDeNivelRevogaPermissoesAntigas() {
        service.editarFuncionario(new FuncionariosEditarDTO(Nivel.CORDENADOR, "Coordenação", "Maria", true), 1L);
        verify(sessoes).expirarSessoes("professor");
    }

    @Test void desativacaoExpiraSessoes() {
        service.editarFuncionario(new FuncionariosEditarDTO(Nivel.PROFESSOR, "Professor", "Maria", false), 1L);
        assertFalse(funcionario.isAtivo());
        verify(sessoes).expirarSessoes("professor");
    }
}
