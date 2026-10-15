package com.discoveron.relatorios.config;

import com.discoveron.relatorios.repository.FuncionarioRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.session.HttpSessionEventPublisher;

import java.util.Map;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            FuncionarioRepository funcionarioRepository,
            SessionRegistry sessionRegistry,
            RespostasSeguranca respostas
    ) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error", "/style.css").permitAll()
                        .requestMatchers(HttpMethod.GET, "/csrf").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/funcionarios/minha-senha").authenticated()
                        .requestMatchers("/funcionarios/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/relatorio/**")
                        .hasAnyRole("PROFESSOR", "CORDENADOR", "ADMINISTRADOR")
                        .anyRequest().authenticated()
                )
                .requestCache(cache -> cache.disable())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                respostas.erro(response, 401, "NAO_AUTENTICADO",
                                        "É necessário fazer login."))
                        .accessDeniedHandler((request, response, exception) -> {
                            if (exception instanceof CsrfException) {
                                respostas.erro(response, 403, "CSRF_INVALIDO",
                                        "Obtenha um novo token CSRF antes de enviar a requisição.");
                            } else {
                                respostas.erro(response, 403, "ACESSO_NEGADO",
                                        "Você não tem permissão para acessar este recurso.");
                            }
                        })
                )
                .formLogin(form -> form
                        .successHandler((request, response, authentication) -> {
                            var funcionario = funcionarioRepository
                                    .findByLogin(authentication.getName()).orElse(null);
                            if (funcionario == null || !funcionario.isAtivo()) {
                                var sessao = request.getSession(false);
                                if (sessao != null) {
                                    sessao.invalidate();
                                }
                                SecurityContextHolder.clearContext();
                                respostas.erro(response, 401, "SESSAO_INVALIDA",
                                        "A conta não está disponível para acesso.");
                                return;
                            }
                            respostas.escrever(response, 200, Map.of(
                                    "autenticado", true,
                                    "trocaSenhaObrigatoria", funcionario.isTrocaSenhaObrigatoria()
                            ));
                        })
                        .failureHandler((request, response, exception) ->
                                respostas.erro(response, 401, "CREDENCIAIS_INVALIDAS",
                                        "Login ou senha inválidos."))
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setHeader("Cache-Control", "no-store");
                            response.setStatus(204);
                        })
                )
                .sessionManagement(session -> session
                        .maximumSessions(-1)
                        .sessionRegistry(sessionRegistry)
                        .expiredSessionStrategy(event -> respostas.erro(
                                event.getResponse(), 401, "SESSAO_EXPIRADA",
                                "Sua sessão expirou. Entre novamente."))
                );

        http.addFilterBefore(
                new FiltroTrocaSenhaObrigatoria(funcionarioRepository, respostas),
                AuthorizationFilter.class
        );
        return http.build();
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }
}
