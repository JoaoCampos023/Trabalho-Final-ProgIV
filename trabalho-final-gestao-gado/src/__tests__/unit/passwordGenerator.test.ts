import { PasswordGenerator } from '../../utils/passwordGenerator';

describe('PasswordGenerator', () => {
  describe('gerarSenha', () => {
    it('gera senha com o tamanho pedido', () => {
      expect(PasswordGenerator.gerarSenha(12).length).toBe(12);
      expect(PasswordGenerator.gerarSenha(8).length).toBe(8);
    });

    it('gera senhas diferentes em chamadas seguidas', () => {
      // Não é garantia matemática, mas a chance de colisão em 20 chars é
      // desprezível — se falhar, é sinal de que algo está fixo.
      const a = PasswordGenerator.gerarSenha(20);
      const b = PasswordGenerator.gerarSenha(20);
      expect(a).not.toBe(b);
    });

    it('inclui números quando useNumbers = true', () => {
      // Roda várias vezes porque pode sair uma senha sem número por azar.
      const senhas = Array.from({ length: 20 }, () => PasswordGenerator.gerarSenha(20, true));
      expect(senhas.some(s => /\d/.test(s))).toBe(true);
    });
  });

  describe('verificarForca', () => {
    it('classifica senha curta e simples como fraca', () => {
      const r = PasswordGenerator.verificarForca('abc');
      expect(r.level).toBe('Fraca');
    });

    it('classifica senha longa com maiúsculas, números e especiais como forte ou melhor', () => {
      const r = PasswordGenerator.verificarForca('SenhaForte#2024!');
      expect(['Forte', 'Muito Forte']).toContain(r.level);
    });

    it('detecta sequências comuns', () => {
      const r = PasswordGenerator.verificarForca('123456');
      expect(r.feedback.join(' ')).toMatch(/sequências comuns/i);
    });
  });
});