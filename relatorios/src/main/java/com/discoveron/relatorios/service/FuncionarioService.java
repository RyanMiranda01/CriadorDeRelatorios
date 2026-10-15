package com.discoveron.relatorios.service;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.dto.funcionarios.FuncionarioCadastroDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosEditarDTO;
import com.discoveron.relatorios.dto.funcionarios.FuncionariosRespostaDTO;
import com.discoveron.relatorios.dto.funcionarios.TrocarSenhaDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import com.discoveron.relatorios.validacao.funcionarios.ValidarFuncionarioExistente;
import com.discoveron.relatorios.validacao.funcionarios.ValidarFuncionariosExistentesPorId;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


import java.nio.charset.StandardCharsets;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final ValidarFuncionarioExistente validarFuncionarioExistente;
    private final ValidarFuncionariosExistentesPorId validarFuncionariosExistentesPorId;
    private final PasswordEncoder passwordEncoder;
    private final SessoesService sessoesService;


    public FuncionarioService(FuncionarioRepository funcionarioRepository, ValidarFuncionarioExistente validarFuncionarioExistente, ValidarFuncionariosExistentesPorId validarFuncionariosExistentesPorId, PasswordEncoder passwordEncoder, SessoesService sessoesService) {
        this.funcionarioRepository = funcionarioRepository;
        this.validarFuncionarioExistente = validarFuncionarioExistente;
        this.validarFuncionariosExistentesPorId = validarFuncionariosExistentesPorId;
        this.passwordEncoder = passwordEncoder;
        this.sessoesService = sessoesService;
    }


    @Transactional
    public FuncionariosRespostaDTO cadastrarFuncionario(@Valid FuncionarioCadastroDTO funcionarioCadastroDTO) {


        validarNovaSenha(funcionarioCadastroDTO.senha());
        validarLoginParaReset(funcionarioCadastroDTO.login());
        validarFuncionarioExistente.validarFuncionarioExistente(funcionarioCadastroDTO);
        Funcionarios funcionarios = new Funcionarios(funcionarioCadastroDTO);
        funcionarios.setSenha(passwordEncoder.encode(funcionarioCadastroDTO.senha()));
        Funcionarios novoFuncionario = funcionarioRepository.save(funcionarios);
        FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(novoFuncionario);
        return funcionariosRespostaDTO;

    }


    @Transactional
    public void editarFuncionario(
            @Valid FuncionariosEditarDTO dados,
            Long id
    ) {
        Funcionarios funcionario =
                validarFuncionariosExistentesPorId.validarFuncionariosId(id);

        boolean mudouNivel = funcionario.getNivel() != dados.nivel();

        boolean foiDesativado =
                funcionario.isAtivo() && !dados.ativo();

        funcionario.setCargo(dados.cargo());
        funcionario.setNivel(dados.nivel());
        funcionario.setNome(dados.nome());
        funcionario.setAtivo(dados.ativo());

        funcionarioRepository.save(funcionario);

        if (mudouNivel || foiDesativado) {
            sessoesService.expirarSessoes(funcionario.getLogin());
        }
    }

    public List<FuncionariosRespostaDTO> listarFuncionario() {
        List<Funcionarios> listaFuncionarios = funcionarioRepository.findAll();
        List<FuncionariosRespostaDTO> listaFuncionarioDTO = new ArrayList<>();

        for (Funcionarios funcionarios : listaFuncionarios) {
            FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);
            listaFuncionarioDTO.add(funcionariosRespostaDTO);
        }
        return listaFuncionarioDTO;
    }

    public List<FuncionariosRespostaDTO> listarPorNome(String nome) {

        List<Funcionarios> listaFuncionarios = funcionarioRepository.findByNomeContainingIgnoreCase(nome);
        List<FuncionariosRespostaDTO> listaFuncionarioDTO = new ArrayList<>();

        for (Funcionarios funcionarios : listaFuncionarios) {
            FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);
            listaFuncionarioDTO.add(funcionariosRespostaDTO);
        }
        return listaFuncionarioDTO;
    }

    public FuncionariosRespostaDTO buscarPorId(Long id) {
        Funcionarios funcionarios = validarFuncionariosExistentesPorId.validarFuncionariosId(id);
        FuncionariosRespostaDTO funcionariosRespostaDTO = new FuncionariosRespostaDTO(funcionarios);

        return funcionariosRespostaDTO;
    }

    @Transactional
    public void resetarSenha(Long id) {
        Funcionarios funcionario =
                validarFuncionariosExistentesPorId.validarFuncionariosId(id);

        validarLoginParaReset(funcionario.getLogin());
        funcionario.setSenha(
                passwordEncoder.encode(funcionario.getLogin())
        );

        funcionario.setTrocaSenhaObrigatoria(true);

        funcionarioRepository.save(funcionario);

        sessoesService.expirarSessoes(funcionario.getLogin());
    }

    @Transactional
    public void criarNovaSenha(Long id, String senha) {
        validarNovaSenha(senha);
        Funcionarios funcionario =
                validarFuncionariosExistentesPorId.validarFuncionariosId(id);

        if (senha.equals(funcionario.getLogin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A nova senha deve ser diferente do login.");
        }
        funcionario.setSenha(passwordEncoder.encode(senha));
        funcionario.setTrocaSenhaObrigatoria(true);

        funcionarioRepository.save(funcionario);

        sessoesService.expirarSessoes(funcionario.getLogin());
    }

    @Transactional
    public void trocarPropriaSenha(String login, TrocarSenhaDTO dados) {
        validarNovaSenha(dados.novaSenha());

        Funcionarios funcionario = funcionarioRepository.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Funcionário autenticado não encontrado."
                ));

        if (!funcionario.isAtivo()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Funcionário inativo."
            );
        }

        if (!funcionario.isTrocaSenhaObrigatoria()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Não há troca obrigatória de senha pendente."
            );
        }

        if (dados.novaSenha().equals(funcionario.getLogin())
                || passwordEncoder.matches(
                dados.novaSenha(),
                funcionario.getSenha()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Escolha uma senha diferente do login e da senha atual."
            );
        }
        funcionario.setSenha(
                passwordEncoder.encode(dados.novaSenha())
        );

        funcionario.setTrocaSenhaObrigatoria(false);

        funcionarioRepository.save(funcionario);

        sessoesService.expirarSessoes(funcionario.getLogin());
    }
    private void validarLoginParaReset(String login) {
        if (login == null || login.isBlank()
                || login.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O login deve ser preenchido e ter no máximo 72 bytes em UTF-8 para permitir o reset.");
        }
    }

    private void validarNovaSenha(String senha) {
        if (senha == null || senha.isBlank() || senha.length() < 12
                || senha.length() > 64
                || senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A senha deve ter de 12 a 64 caracteres e no máximo 72 bytes em UTF-8.");
        }
    }
}
