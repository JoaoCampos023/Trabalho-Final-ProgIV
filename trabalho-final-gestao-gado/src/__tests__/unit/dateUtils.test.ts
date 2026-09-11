import { DateUtils } from '../../utils/dateUtils';

describe('DateUtils', () => {
  describe('formatarDataBr', () => {
    it('formata como dd/mm/aaaa', () => {
      expect(DateUtils.formatarDataBr(new Date(2024, 0, 5))).toBe('05/01/2024');
      expect(DateUtils.formatarDataBr(new Date(2024, 11, 31))).toBe('31/12/2024');
    });
  });

  describe('formatarDataIso', () => {
    it('formata como aaaa-mm-dd com zero à esquerda', () => {
      expect(DateUtils.formatarDataIso(new Date(2024, 0, 5))).toBe('2024-01-05');
    });

    it('usa getters locais, não UTC — testa virada de dia perto da meia-noite', () => {
      // 23h de 31/12/2024 local. Em UTC-3, o UTC já virou dia 01/01/2025.
      // formatarDataIso precisa devolver 2024-12-31, não 2025-01-01.
      const d = new Date(2024, 11, 31, 23, 0, 0);
      expect(DateUtils.formatarDataIso(d)).toBe('2024-12-31');
    });
  });

  describe('calcularIdade', () => {
    it('conta anos corretamente quando o aniversário já passou este ano', () => {
      const hoje = new Date();
      const nasc = new Date(hoje.getFullYear() - 30, 0, 1); // 1º de janeiro
      expect(DateUtils.calcularIdade(nasc)).toBeGreaterThanOrEqual(30);
    });

    it('decrementa a idade quando o aniversário ainda não chegou', () => {
      const hoje = new Date();
      // Nasceu em 31 de dezembro de (ano - 30). Se hoje for antes disso,
      // a idade é 29.
      const nasc = new Date(hoje.getFullYear() - 30, 11, 31);
      const esperada = hoje.getMonth() === 11 && hoje.getDate() >= 31 ? 30 : 29;
      expect(DateUtils.calcularIdade(nasc)).toBe(esperada);
    });
  });

  describe('isDataFutura e isDataPassada', () => {
    it('reconhece datas futuras e passadas', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);

      expect(DateUtils.isDataFutura(amanha)).toBe(true);
      expect(DateUtils.isDataPassada(ontem)).toBe(true);
      expect(DateUtils.isDataFutura(ontem)).toBe(false);
    });
  });
});