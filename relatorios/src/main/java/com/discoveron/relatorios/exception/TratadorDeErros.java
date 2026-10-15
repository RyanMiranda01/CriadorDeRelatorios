package com.discoveron.relatorios.exception;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler({HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class})
    public ResponseEntity<ErroResposta> tratarRequisicaoInvalida(Exception exception) {
        return ResponseEntity.badRequest().body(new ErroResposta(
                400, "Verifique o JSON, os parâmetros e os valores informados.", Map.of()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResposta> tratarConflito(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409).body(new ErroResposta(
                409, "Os dados conflitam com um registro existente ou uma referência do banco.", Map.of()));
    }


    public record ErroResposta(
            int status,
            String mensagem,
            Map<String, String> campos
    ) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta> tratarValidacao(MethodArgumentNotValidException exception) {

        Map<String, String> campos = new LinkedHashMap<>();

        exception.getBindingResult().getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(
                        erro.getField(),
                        erro.getDefaultMessage()
                ));

        return ResponseEntity.badRequest().body(
                new ErroResposta(
                        400,
                        "Verifique os campos informados.",
                        campos
                )
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErroResposta> tratarErroDeNegocio(ResponseStatusException exception) {

        String mensagem = exception.getReason() != null ? exception.getReason() : "Não foi possível concluir a operação.";

        return ResponseEntity.status(exception.getStatusCode()).body(
                new ErroResposta(
                        exception.getStatusCode().value(),
                        mensagem,
                        Map.of()
                )
        );
    }


}
