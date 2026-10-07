CREATE TABLE relatorios
(
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    nome_aluno    VARCHAR(255) NOT NULL,
    funcionarios  BIGINT NOT NULL,
    turma         VARCHAR(255),
    motivo        VARCHAR(255) NOT NULL,
    periodo       VARCHAR(50),
    desc_situacao TEXT,
    providencia   TEXT,
    data_criacao  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
);
