import { CpfValidator } from '../../utils/cpfValidator';

/**
 * CpfValidator é função pura — o caso mais barato e mais valioso de testar.
 * Cobre: válidos, inválidos, formatados, limpeza e geração para teste.
 */
describe('CpfValidator', () => {
  describe('validar', () => {
    it('aceita CPF válido sem formatação', () => {
      // 111.444.777-35 é um CPF válido amplamente usado em exemplos.
      expect(CpfValidator.validar('11144477735')).toBe(true);
    });

    it('aceita CPF válido com formatação', () => {
      expect(CpfValidator.validar('111.444.777-35')).toBe(true);
    });

    it('rejeita CPF com dígitos verificadores errados', () => {
      expect(CpfValidator.validar('11144477700')).toBe(false);
    });

    it('rejeita CPF com todos os dígitos iguais', () => {
      expect(CpfValidator.validar('11111111111')).toBe(false);
      expect(CpfValidator.validar('00000000000')).toBe(false);
    });

    it('rejeita CPF com quantidade errada de dígitos', () => {
      expect(CpfValidator.validar('123')).toBe(false);
      expect(CpfValidator.validar('123456789012')).toBe(false);
    });

    it('rejeita string vazia ou nula', () => {
      expect(CpfValidator.validar('')).toBe(false);
      expect(CpfValidator.validar(null as any)).toBe(false);
    });
  });

  describe('formatar', () => {
    it('formata CPF de 11 dígitos', () => {
      expect(CpfValidator.formatar('11144477735')).toBe('111.444.777-35');
    });

    it('devolve o original se não tiver 11 dígitos', () => {
      expect(CpfValidator.formatar('123')).toBe('123');
    });
  });

  describe('limpar', () => {
    it('remove pontos, traços e espaços', () => {
      expect(CpfValidator.limpar('111.444.777-35')).toBe('11144477735');
    });
  });

  describe('gerarParaTeste', () => {
    it('gera um CPF que passa na própria validação', () => {
      const cpf = CpfValidator.gerarParaTeste();
      expect(cpf).toHaveLength(11);
      expect(CpfValidator.validar(cpf)).toBe(true);
    });
  });
});