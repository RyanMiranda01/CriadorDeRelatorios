# DiscoverOn — Gestão de Relatórios Educacionais

Sistema para gerenciamento de funcionários e relatórios educacionais, com interface web e API REST.

## Funcionalidades

- Cadastro e gerenciamento de funcionários.
- Cadastro, consulta, edição e exclusão de relatórios.
- Filtros por aluno, funcionário, data e período.
- Exportação de relatórios em PDF.
- Autenticação e controle de acesso para professores, coordenadores e administradores.
- Troca e redefinição de senhas.

## Tecnologias

**Backend:** Java 21, Spring Boot, Spring Data JPA, Spring Security, MySQL, Flyway e Maven.

**Frontend:** React, TypeScript, Vite e Tailwind CSS.

## Organização

- `relatorios/`: API REST e acesso ao banco de dados.
- `frontend/`: interface web integrada à API.

As instruções de execução estão nos arquivos README de cada pasta.

## Autoria e uso de IA

Desenvolvi o backend, incluindo entidades, DTOs, controllers, services, repositories, endpoints, filtros de consulta e migrations do banco de dados.

O ChatGPT/Codex foi utilizado para implementar o frontend e os recursos de segurança, incluindo autenticação, permissões por perfil e fluxos de troca de senha.
