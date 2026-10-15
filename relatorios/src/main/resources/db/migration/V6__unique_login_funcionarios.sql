-- Não remove nem modifica funcionários existentes. Logins duplicados
-- precisam ser corrigidos antes da aplicação desta restrição.
ALTER TABLE funcionarios
    ADD CONSTRAINT uk_funcionarios_login UNIQUE (login);
