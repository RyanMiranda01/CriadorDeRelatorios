package com.discoveron.relatorios.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.Map;

@Component
public class RespostasSeguranca {

    private final JsonMapper jsonMapper;

    public RespostasSeguranca(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public void escrever(HttpServletResponse response, int status, Object corpo) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        jsonMapper.writeValue(response.getWriter(), corpo);
    }

    public void erro(HttpServletResponse response, int status, String codigo,
                     String mensagem) throws IOException {
        escrever(response, status, Map.of(
                "status", status,
                "codigo", codigo,
                "mensagem", mensagem,
                "campos", Map.of()
        ));
    }
}
