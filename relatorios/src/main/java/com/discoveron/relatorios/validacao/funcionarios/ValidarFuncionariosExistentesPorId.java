package com.discoveron.relatorios.validacao.funcionarios;

import com.discoveron.relatorios.domain.Funcionarios;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ValidarFuncionariosExistentesPorId {

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    public Funcionarios validarFuncionariosId(Long id){
        return funcionarioRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionario inexistente"));
    }
}
