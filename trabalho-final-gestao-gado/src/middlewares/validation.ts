import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validação para criação/atualização de animais
 */
export const validateAnimal = (req: Request, res: Response, next: NextFunction): void => {
  const { brinco, nome, sexo, peso, data_nascimento } = req.body;

  // Validar campos obrigatórios
  const errors: string[] = [];

  if (!brinco) errors.push('Brinco é obrigatório');
  if (!nome) errors.push('Nome é obrigatório');
  if (!sexo) errors.push('Sexo é obrigatório');
  if (peso === undefined || peso === null) errors.push('Peso é obrigatório');
  if (!data_nascimento) errors.push('Data de nascimento é obrigatória');

  // Validar sexo
  if (sexo && sexo !== 'M' && sexo !== 'F') {
    errors.push('Sexo deve ser M (Macho) ou F (Fêmea)');
  }

  // Validar peso
  if (peso !== undefined && peso !== null && parseFloat(peso) <= 0) {
    errors.push('Peso deve ser maior que zero');
  }

  // Validar data de nascimento
  if (data_nascimento) {
    const data = new Date(data_nascimento);
    if (isNaN(data.getTime())) {
      errors.push('Data de nascimento inválida');
    }
    if (data > new Date()) {
      errors.push('Data de nascimento não pode ser no futuro');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors
    });
    return;
  }

  next();
};

/**
 * Middleware de validação para criação/atualização de produções
 */
export const validateProducao = (req: Request, res: Response, next: NextFunction): void => {
  const { animal_brinco, data_coleta, litros, periodo } = req.body;

  const errors: string[] = [];

  if (!animal_brinco) errors.push('Animal é obrigatório');
  if (!data_coleta) errors.push('Data da coleta é obrigatória');
  if (litros === undefined || litros === null) errors.push('Litros é obrigatório');
  if (!periodo) errors.push('Período é obrigatório');

  // Validar litros
  if (litros !== undefined && litros !== null && parseFloat(litros) <= 0) {
    errors.push('Litros deve ser maior que zero');
  }

  // Validar período
  if (periodo && !['Manha', 'Tarde', 'Noite'].includes(periodo)) {
    errors.push('Período deve ser Manha, Tarde ou Noite');
  }

  // Validar data
  if (data_coleta) {
    const data = new Date(data_coleta);
    if (isNaN(data.getTime())) {
      errors.push('Data da coleta inválida');
    }
    if (data > new Date()) {
      errors.push('Data da coleta não pode ser no futuro');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors
    });
    return;
  }

  next();
};

/**
 * Middleware de validação para criação/atualização de usuários
 */
export const validateUser = (req: Request, res: Response, next: NextFunction): void => {
  const { nome, email, password, cpf } = req.body;

  const errors: string[] = [];

  if (!nome) errors.push('Nome é obrigatório');
  if (!email) errors.push('Email é obrigatório');
  if (!cpf) errors.push('CPF é obrigatório');

  // Validar email
  if (email && !isValidEmail(email)) {
    errors.push('Email inválido');
  }

  // Validar CPF
  if (cpf && !isValidCpf(cpf)) {
    errors.push('CPF inválido');
  }

  // Validar senha (apenas para criação)
  if (req.method === 'POST' && !password) {
    errors.push('Senha é obrigatória');
  }
  if (password && password.length < 3) {
    errors.push('Senha deve ter no mínimo 3 caracteres');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors
    });
    return;
  }

  next();
};

/**
 * Validar formato de email
 */
function isValidEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/**
 * Validar CPF (mesma lógica do projeto original)
 */
function isValidCpf(cpf: string): boolean {
  if (!cpf) return false;

  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (cpfLimpo.length !== 11) return false;

  // Elimina CPFs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;

  // Cálculo do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;

  if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;

  // Cálculo do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;

  return parseInt(cpfLimpo.charAt(10)) === digito2;
}