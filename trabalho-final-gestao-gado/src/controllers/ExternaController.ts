import { Request, Response } from 'express';
import axios from 'axios';

export class ExternaController {
  async buscarCep(req: Request, res: Response): Promise<Response> {
    try {
      const cepParam = req.params.cep;
      const cep = Array.isArray(cepParam) ? cepParam[0] : cepParam;

      if (!cep || cep.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'CEP inválido. Digite 8 dígitos.'
        });
      }

      const cepLimpo = cep.replace(/\D/g, '');
      
      const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (response.data.erro) {
        return res.status(404).json({
          success: false,
          message: 'CEP não encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          cep: response.data.cep,
          logradouro: response.data.logradouro,
          complemento: response.data.complemento,
          bairro: response.data.bairro,
          localidade: response.data.localidade,
          uf: response.data.uf,
          ibge: response.data.ibge,
          gia: response.data.gia,
          ddd: response.data.ddd,
          siafi: response.data.siafi
        }
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar CEP',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async validarCpf(req: Request, res: Response): Promise<Response> {
    try {
      const { cpf } = req.body;

      if (!cpf) {
        return res.status(400).json({
          success: false,
          message: 'CPF é obrigatório'
        });
      }

      const cpfLimpo = cpf.replace(/\D/g, '');
      const isValid = this._validarCPF(cpfLimpo);

      return res.json({
        success: true,
        data: {
          cpf: cpfLimpo,
          valido: isValid,
          formatado: isValid ? cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : null
        }
      });
    } catch (error) {
      console.error('Erro ao validar CPF:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao validar CPF',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async buscarEndereco(req: Request, res: Response): Promise<Response> {
    return this.buscarCep(req, res);
  }

  private _validarCPF(cpf: string): boolean {
    if (!cpf) return false;

    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpfLimpo)) return false;

    let soma = 0;
    const multiplicador1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * multiplicador1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;

    soma = 0;
    const multiplicador2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * multiplicador2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(cpfLimpo.charAt(10)) === digito2;
  }
}