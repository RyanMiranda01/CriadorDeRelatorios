package com.discoveron.relatorios.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CsrfController {

    public record RespostaCsrf(String headerName, String token) {}

    @GetMapping("/csrf")
    public ResponseEntity<RespostaCsrf> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(
                new RespostaCsrf(csrfToken.getHeaderName(), csrfToken.getToken())
        );
    }
}