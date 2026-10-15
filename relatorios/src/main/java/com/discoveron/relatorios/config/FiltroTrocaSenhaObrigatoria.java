package com.discoveron.relatorios.config;

import com.discoveron.relatorios.repository.FuncionarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class FiltroTrocaSenhaObrigatoria extends OncePerRequestFilter {

    private final FuncionarioRepository funcionarioRepository;
    private final RespostasSeguranca respostas;

    public FiltroTrocaSenhaObrigatoria(
            FuncionarioRepository funcionarioRepository,
            RespostasSeguranca respostas
    ) {
        this.funcionarioRepository = funcionarioRepository;
        this.respostas = respostas;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        var autenticacao = SecurityContextHolder.getContext()
                .getAuthentication();

        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            filterChain.doFilter(request, response);
            return;
        }

        var funcionario = funcionarioRepository
                .findByLogin(autenticacao.getName())
                .orElse(null);

        if (funcionario == null || !funcionario.isAtivo()) {
            var sessao = request.getSession(false);
            if (sessao != null) {
                sessao.invalidate();
            }
            SecurityContextHolder.clearContext();
            respostas.erro(response, 401, "SESSAO_INVALIDA", "Sua sessão não é mais válida.");
            return;
        }

        if (funcionario.isTrocaSenhaObrigatoria()
                && !rotaPermitida(request)) {
            respostas.erro(response, 403, "TROCA_SENHA_OBRIGATORIA",
                    "Troque sua senha temporária para continuar.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean rotaPermitida(HttpServletRequest request) {
        String caminho = request.getServletPath();
        String metodo = request.getMethod();

        return ("GET".equals(metodo)
                && "/csrf".equals(caminho))
                || ("PUT".equals(metodo)
                && "/funcionarios/minha-senha".equals(caminho))
                || ("POST".equals(metodo)
                && "/logout".equals(caminho));
    }
}
