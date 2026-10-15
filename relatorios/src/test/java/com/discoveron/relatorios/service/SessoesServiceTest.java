package com.discoveron.relatorios.service;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.core.userdetails.User;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.junit.jupiter.api.Assertions.*;

class SessoesServiceTest {
    @Test void expiraSomenteSessoesDoFuncionarioAposCommit() {
        var registry = new SessionRegistryImpl();
        var usuario = User.withUsername("maria").password("hash").roles("PROFESSOR").build();
        var outro = User.withUsername("joao").password("hash").roles("PROFESSOR").build();
        registry.registerNewSession("sessao1", usuario);
        registry.registerNewSession("sessao2", usuario);
        registry.registerNewSession("sessao3", outro);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            new SessoesService(registry).expirarSessoes("maria");
            assertFalse(registry.getSessionInformation("sessao1").isExpired());
            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCommit());
            assertTrue(registry.getSessionInformation("sessao1").isExpired());
            assertTrue(registry.getSessionInformation("sessao2").isExpired());
            assertFalse(registry.getSessionInformation("sessao3").isExpired());
        } finally {
            TransactionSynchronizationManager.clear();
        }
    }
}
