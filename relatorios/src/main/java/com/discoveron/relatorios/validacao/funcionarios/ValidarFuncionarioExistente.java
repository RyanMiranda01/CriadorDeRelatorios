package com.discoveron.relatorios.validacao.funcionarios;

import com.discoveron.relatorios.dto.funcionarios.FuncionarioCadastroDTO;
import com.discoveron.relatorios.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ValidarFuncionarioExistente {

    @Autowired
    private FuncionarioRepository funcionarioRepository;


    public void validarFuncionarioExistente(FuncionarioCadastroDTO funcionarios){
        if(funcionarioRepository.existsByLogin(funcionarios.login())){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Login ja cdastrados!");
        };

    }
}
