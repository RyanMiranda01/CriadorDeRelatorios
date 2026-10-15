package com.discoveron.relatorios.service;

import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class SessoesService {

    private final SessionRegistry sessionRegistry;

    public SessoesService(SessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    public void expirarSessoes(String login) {
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    expirarAgora(login);
                }
            });
        } else {
            expirarAgora(login);
        }
    }

    private void expirarAgora(String login) {
        for (Object principal : sessionRegistry.getAllPrincipals()) {
            if (principal instanceof UserDetails usuario
                    && usuario.getUsername().equals(login)) {

                sessionRegistry.getAllSessions(principal, false)
                        .forEach(sessao -> sessao.expireNow());
            }
        }
    }
}