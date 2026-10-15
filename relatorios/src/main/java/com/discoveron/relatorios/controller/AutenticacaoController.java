package com.discoveron.relatorios.controller;

import com.discoveron.relatorios.dto.funcionarios.FuncionariosRespostaDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AutenticacaoController {

    private final FuncionarioRepository funcionarioRepository;

    public AutenticacaoController(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<FuncionariosRespostaDTO> usuarioAtual(Authentication authentication) {
        var funcionario = funcionarioRepository.findByLogin(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Funcionário autenticado não encontrado."));

        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new FuncionariosRespostaDTO(funcionario));
    }
}
