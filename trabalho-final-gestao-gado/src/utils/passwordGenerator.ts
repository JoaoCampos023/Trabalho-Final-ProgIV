/**
 * Utilitário para geração de senhas aleatórias
 */
export class PasswordGenerator {
  /**
   * Gera uma senha aleatória
   * @param length - Tamanho da senha (padrão: 8)
   * @param useNumbers - Incluir números (padrão: true)
   * @param useSpecialChars - Incluir caracteres especiais (padrão: false)
   * @returns Senha gerada
   */
  static gerarSenha(
    length: number = 8,
    useNumbers: boolean = true,
    useSpecialChars: boolean = false
  ): string {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    if (useNumbers) {
      chars += '0123456789';
    }
    
    if (useSpecialChars) {
      chars += '!@#$%^&*()_+-=';
    }

    let senha = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      senha += chars.charAt(randomIndex);
    }

    return senha;
  }

  /**
   * Gera uma senha fácil de memorizar (combinação de palavras)
   */
  static gerarSenhaMemoravel(): string {
    const adjetivos = ['Bravo', 'Forte', 'Rapido', 'Gentil', 'Sábio', 'Leal', 'Valente', 'Astuto'];
    const substantivos = ['Leao', 'Tigre', 'Fenix', 'Lobo', 'Águia', 'Dragão', 'Falcao', 'Pantera'];
    const numeros = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    const adjetivo = adjetivos[Math.floor(Math.random() * adjetivos.length)];
    const substantivo = substantivos[Math.floor(Math.random() * substantivos.length)];

    return `${adjetivo}${substantivo}${numeros}`;
  }

  /**
   * Verifica a força de uma senha
   * @param senha - Senha a ser avaliada
   * @returns Objeto com pontuação e descrição
   */
  static verificarForca(senha: string): {
    score: number;
    level: 'Fraca' | 'Média' | 'Forte' | 'Muito Forte';
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Comprimento
    if (senha.length >= 8) {
      score += 2;
    } else {
      feedback.push('Use pelo menos 8 caracteres');
    }

    // Letras maiúsculas e minúsculas
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) {
      score += 2;
    } else {
      feedback.push('Use letras maiúsculas e minúsculas');
    }

    // Números
    if (/\d/.test(senha)) {
      score += 1;
    } else {
      feedback.push('Inclua números');
    }

    // Caracteres especiais
    if (/[^a-zA-Z0-9]/.test(senha)) {
      score += 2;
    } else {
      feedback.push('Inclua caracteres especiais (!@#$% etc)');
    }

    // Evitar sequências comuns
    const patterns = ['123456', 'abcdef', 'qwerty', 'admin', 'senha', 'password'];
    const senhaLower = senha.toLowerCase();
    for (const pattern of patterns) {
      if (senhaLower.includes(pattern)) {
        score -= 1;
        feedback.push('Evite sequências comuns como ' + pattern);
        break;
      }
    }

    // Evitar repetições
    if (/(.)\1{2,}/.test(senha)) {
      score -= 1;
      feedback.push('Evite caracteres repetidos');
    }

    // Normalizar score
    if (score < 0) score = 0;
    if (score > 7) score = 7;

    // Determinar nível
    let level: 'Fraca' | 'Média' | 'Forte' | 'Muito Forte';
    if (score <= 2) level = 'Fraca';
    else if (score <= 4) level = 'Média';
    else if (score <= 6) level = 'Forte';
    else level = 'Muito Forte';

    return {
      score,
      level,
      feedback: feedback.length > 0 ? feedback : ['Senha forte!']
    };
  }
}