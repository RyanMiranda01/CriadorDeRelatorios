package com.discoveron.relatorios.config;

import com.discoveron.relatorios.controller.CsrfController;
import com.discoveron.relatorios.controller.AutenticacaoController;
import tools.jackson.databind.json.JsonMapper;
import com.discoveron.relatorios.controller.FuncionariosController;
import com.discoveron.relatorios.service.FuncionarioService;
import com.discoveron.relatorios.service.SessoesService;
import com.discoveron.relatorios.validacao.funcionarios.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.discoveron.relatorios.domain.*;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import com.discoveron.relatorios.service.AutenticacaoService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.mock.web.*;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SecurityFlowTest {
    AnnotationConfigWebApplicationContext context;
    MockMvc mvc;
    Funcionarios funcionario;

    @Configuration
    @EnableWebSecurity
    @EnableWebMvc
    @Import({SecurityConfig.class, ConfiguracaoSenha.class, AutenticacaoService.class,
            CsrfController.class, AutenticacaoController.class, RespostasSeguranca.class,
            FuncionariosController.class, SessoesService.class, RotasTeste.class})
    static class ConfigTeste {
        @Bean JsonMapper jsonMapper() { return JsonMapper.builder().build(); }
        @Bean FuncionarioRepository funcionarioRepository() { return mock(FuncionarioRepository.class); }
        @Bean FuncionarioService funcionarioService(FuncionarioRepository repository,
                PasswordEncoder encoder, SessoesService sessoes) {
            var porId = mock(ValidarFuncionariosExistentesPorId.class);
            when(porId.validarFuncionariosId(anyLong())).thenAnswer(i ->
                    repository.findById(i.getArgument(0)).orElseThrow());
            return new FuncionarioService(repository, mock(ValidarFuncionarioExistente.class),
                    porId, encoder, sessoes);
        }
    }

    @RestController
    static class RotasTeste {
        @GetMapping("/relatorio/listar") String listar() { return "relatorios"; }
    }

    @BeforeEach void preparar() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(ConfigTeste.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .defaultRequest(get("/").with(request -> {
                    request.setServletPath(request.getRequestURI());
                    return request;
                }))
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
        funcionario = new Funcionarios();
        funcionario.setId(1L);
        funcionario.setLogin("maria");
        funcionario.setNome("Maria");
        funcionario.setCargo("Professora");
        funcionario.setNivel(Nivel.PROFESSOR);
        funcionario.setAtivo(true);
        funcionario.setSenha(context.getBean(org.springframework.security.crypto.password.PasswordEncoder.class)
                .encode("SenhaTesteValida123!"));
        when(context.getBean(FuncionarioRepository.class).findByLogin("maria"))
                .thenReturn(Optional.of(funcionario));
        var repository = context.getBean(FuncionarioRepository.class);
        when(repository.findById(1L)).thenReturn(Optional.of(funcionario));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @AfterEach void encerrar() { context.close(); }

    MvcResult login() throws Exception { return login("SenhaTesteValida123!"); }

    MvcResult login(String senha) throws Exception {
        var pagina = mvc.perform(get("/csrf")).andExpect(status().isOk()).andReturn();
        var csrf = (CsrfToken) pagina.getRequest().getAttribute(CsrfToken.class.getName());
        return mvc.perform(post("/login")
                .session((MockHttpSession) pagina.getRequest().getSession())
                .param("username", "maria").param("password", senha)
                .param(csrf.getParameterName(), csrf.getToken())).andReturn();
    }

    @Test void loginPendenteRetornaJsonEBloqueiaRelatoriosMasLiberaCsrf() throws Exception {
        funcionario.setTrocaSenhaObrigatoria(true);
        var resultado = login();
        assertEquals(200, resultado.getResponse().getStatus());
        assertTrue(resultado.getResponse().getContentAsString().contains("trocaSenhaObrigatoria"));
        var sessao = (MockHttpSession) resultado.getRequest().getSession();
        mvc.perform(get("/auth/me").session(sessao)).andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("TROCA_SENHA_OBRIGATORIA")));
        mvc.perform(get("/relatorio/listar").session(sessao)).andExpect(status().isForbidden());
        var token = mvc.perform(get("/csrf").session(sessao)).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store")).andReturn();
        var csrf = (CsrfToken) token.getRequest().getAttribute(CsrfToken.class.getName());
        mvc.perform(put("/funcionarios/minha-senha").session(sessao))
                .andExpect(status().isForbidden());
        mvc.perform(put("/funcionarios/minha-senha").session(sessao)
                .header(csrf.getHeaderName(), csrf.getToken())
                .contentType("application/json").content("{\"novaSenha\":\"OutraSenhaValida123!\"}"))
                .andExpect(status().isNoContent());
        assertFalse(funcionario.isTrocaSenhaObrigatoria());
        mvc.perform(get("/relatorio/listar").session(sessao))
                .andExpect(status().isUnauthorized()).andExpect(content().string(
                        org.hamcrest.Matchers.containsString("SESSAO_EXPIRADA")));
        var novoLogin = login("OutraSenhaValida123!");
        assertEquals(200, novoLogin.getResponse().getStatus());
        assertTrue(novoLogin.getResponse().getContentAsString().contains("\"trocaSenhaObrigatoria\":false"));
        var senhaAntiga = login();
        assertEquals(401, senhaAntiga.getResponse().getStatus());
        assertTrue(senhaAntiga.getResponse().getContentAsString().contains("CREDENCIAIS_INVALIDAS"));
    }

    @Test void professorNaoAcessaFuncionariosEAdminAcessa() throws Exception {
        var resultado = login();
        assertEquals(200, resultado.getResponse().getStatus());
        var sessao = (MockHttpSession) resultado.getRequest().getSession();
        mvc.perform(get("/funcionarios/listarFunc").session(sessao)).andExpect(status().isForbidden());
        mvc.perform(get("/relatorio/listar").session(sessao)).andExpect(status().isOk());
        funcionario.setNivel(Nivel.ADMINISTRADOR);
        var admin = (MockHttpSession) login().getRequest().getSession();
        mvc.perform(get("/funcionarios/listarFunc").session(admin)).andExpect(status().isOk());
    }

    @Test void resetAdministrativoExpiraSessaoDoFuncionario() throws Exception {
        var sessao = (MockHttpSession) login().getRequest().getSession();
        context.getBean(FuncionarioService.class).resetarSenha(1L);
        mvc.perform(get("/relatorio/listar").session(sessao))
                .andExpect(status().isUnauthorized()).andExpect(content().string(
                        org.hamcrest.Matchers.containsString("SESSAO_EXPIRADA")));
        var resultado = login("maria");
        assertEquals(200, resultado.getResponse().getStatus());
        assertTrue(resultado.getResponse().getContentAsString().contains("trocaSenhaObrigatoria"));
    }

    @Test void sessaoExpiradaNaoAcessaEndpoints() throws Exception {
        var resultado = login();
        var sessao = (MockHttpSession) resultado.getRequest().getSession();
        context.getBean(SessionRegistry.class).getSessionInformation(sessao.getId()).expireNow();
        mvc.perform(get("/relatorio/listar").session(sessao))
                .andExpect(status().isUnauthorized()).andExpect(content().string(
                        org.hamcrest.Matchers.containsString("SESSAO_EXPIRADA")));
        assertTrue(sessao.isInvalid());
    }

    @Test void csrfPodeSerObtidoAntesDoLoginSemCache() throws Exception {
        var resultado = mvc.perform(get("/csrf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store")).andReturn();
        assertNotNull(resultado.getRequest().getSession(false));
        assertTrue(resultado.getResponse().getContentAsString().contains("headerName"));
        assertTrue(resultado.getResponse().getContentAsString().contains("token"));
    }

    @Test void endpointsProtegidosSemSessaoRetornam401JsonSemRedirecionar() throws Exception {
        for (String caminho : new String[]{"/auth/me", "/relatorio/listar", "/funcionarios/listarFunc"}) {
            mvc.perform(get(caminho)).andExpect(status().isUnauthorized())
                    .andExpect(header().doesNotExist("Location"))
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("NAO_AUTENTICADO")));
        }
    }

    @Test void usuarioAtualRetornaIdentidadeSemSenhaOuHash() throws Exception {
        var sessao = (MockHttpSession) login().getRequest().getSession();
        var resultado = mvc.perform(get("/auth/me").session(sessao)).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store")).andReturn();
        var json = context.getBean(JsonMapper.class).readTree(resultado.getResponse().getContentAsString());
        assertEquals(1L, json.get("id").asLong());
        assertEquals("Maria", json.get("nome").asString());
        assertEquals("PROFESSOR", json.get("nivel").asString());
        assertEquals("maria", json.get("login").asString());
        assertFalse(json.has("senha"));
        assertFalse(resultado.getResponse().getContentAsString().contains("bcrypt"));
    }

    @Test void loginSemCsrfOuComTokenInvalidoRetornaCodigoDistinto() throws Exception {
        mvc.perform(post("/login").param("username", "maria").param("password", "SenhaTesteValida123!"))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("CSRF_INVALIDO")));
        var token = mvc.perform(get("/csrf")).andReturn();
        mvc.perform(post("/login").session((MockHttpSession) token.getRequest().getSession())
                .header("X-CSRF-TOKEN", "invalido").param("username", "maria").param("password", "SenhaTesteValida123!"))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("CSRF_INVALIDO")));
    }

    @Test void credenciaisInvalidasRetornam401SemRedirecionamento() throws Exception {
        var resultado = login("SenhaIncorreta123!");
        assertEquals(401, resultado.getResponse().getStatus());
        assertNull(resultado.getResponse().getRedirectedUrl());
        assertTrue(resultado.getResponse().getContentAsString().contains("CREDENCIAIS_INVALIDAS"));
        mvc.perform(get("/auth/me").session((MockHttpSession) resultado.getRequest().getSession()))
                .andExpect(status().isUnauthorized());
    }

    @Test void tokenAnteriorAoLoginNaoAutorizaEscritaAposAutenticacao() throws Exception {
        var resultado = mvc.perform(get("/csrf")).andReturn();
        var csrf = (CsrfToken) resultado.getRequest().getAttribute(CsrfToken.class.getName());
        String tokenAntigo = csrf.getToken();
        var autenticacao = mvc.perform(post("/login")
                .session((MockHttpSession) resultado.getRequest().getSession())
                .header(csrf.getHeaderName(), tokenAntigo)
                .param("username", "maria").param("password", "SenhaTesteValida123!"))
                .andExpect(status().isOk()).andReturn();
        var sessao = (MockHttpSession) autenticacao.getRequest().getSession();
        mvc.perform(post("/logout").session(sessao).header(csrf.getHeaderName(), tokenAntigo))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("CSRF_INVALIDO")));
        mvc.perform(get("/auth/me").session(sessao)).andExpect(status().isOk());
    }

    @Test void logoutPendenteEncerraSessaoRetorna204EPermiteNovoCsrfAnonimo() throws Exception {
        funcionario.setTrocaSenhaObrigatoria(true);
        var sessao = (MockHttpSession) login().getRequest().getSession();
        var resultado = mvc.perform(get("/csrf").session(sessao)).andReturn();
        var csrf = (CsrfToken) resultado.getRequest().getAttribute(CsrfToken.class.getName());
        mvc.perform(post("/logout").session(sessao).header(csrf.getHeaderName(), csrf.getToken()))
                .andExpect(status().isNoContent()).andExpect(header().doesNotExist("Location"));
        assertTrue(sessao.isInvalid());
        mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/csrf")).andExpect(status().isOk());
    }

    @Test void funcionarioDesativadoNaoFazLoginENaoRecebeDetalhesDaConta() throws Exception {
        funcionario.setAtivo(false);
        var resultado = login();
        assertEquals(401, resultado.getResponse().getStatus());
        assertTrue(resultado.getResponse().getContentAsString().contains("CREDENCIAIS_INVALIDAS"));
        assertFalse(resultado.getResponse().getContentAsString().contains("inativo"));
    }
}
