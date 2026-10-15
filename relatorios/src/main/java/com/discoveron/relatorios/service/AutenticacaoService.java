package com.discoveron.relatorios.service;

import com.discoveron.relatorios.repository.FuncionarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AutenticacaoService implements UserDetailsService {

    private final FuncionarioRepository funcionarioRepository;

    public AutenticacaoService(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String login) {
        var funcionario = funcionarioRepository.findByLogin(login)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Credenciais inválidas."
                ));

        if (funcionario.getNivel() == null || funcionario.getSenha() == null
                || funcionario.getSenha().isBlank()) {
            throw new UsernameNotFoundException("Credenciais inválidas.");
        }

        return User.withUsername(funcionario.getLogin())
                .password(funcionario.getSenha())
                .roles(funcionario.getNivel().name())
                .disabled(!funcionario.isAtivo())
                .build();
    }
}
