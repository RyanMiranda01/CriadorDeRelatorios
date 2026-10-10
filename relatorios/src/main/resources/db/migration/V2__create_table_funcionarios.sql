CREATE TABLE funcionarios
(
    id    BIGINT NOT NULL AUTO_INCREMENT,
    nome  VARCHAR(255),
    nivel VARCHAR(255),
    cargo VARCHAR(255),
    PRIMARY KEY (id),
    ativo BOOLEAN NOT NULL
);

ALTER TABLE relatorios
    RENAME COLUMN funcionarios TO funcionarios_id;

ALTER TABLE relatorios
    ADD CONSTRAINT fk_relatorios_funcionarios
        FOREIGN KEY (funcionarios_id) REFERENCES funcionarios (id);