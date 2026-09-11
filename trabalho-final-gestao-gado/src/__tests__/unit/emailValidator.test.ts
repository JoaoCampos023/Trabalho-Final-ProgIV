import { EmailValidator } from '../../utils/emailValidator';

describe('EmailValidator', () => {
  describe('validar', () => {
    it('aceita emails válidos', () => {
      expect(EmailValidator.validar('user@example.com')).toBe(true);
      expect(EmailValidator.validar('nome.sobrenome@fazenda.com.br')).toBe(true);
    });

    it('rejeita emails sem @', () => {
      expect(EmailValidator.validar('userexample.com')).toBe(false);
    });

    it('rejeita emails sem domínio', () => {
      expect(EmailValidator.validar('user@')).toBe(false);
    });

    it('rejeita string vazia', () => {
      expect(EmailValidator.validar('')).toBe(false);
    });
  });

  describe('extrairDominio', () => {
    it('extrai o domínio corretamente', () => {
      expect(EmailValidator.extrairDominio('user@example.com')).toBe('example.com');
    });

    it('devolve null para email inválido', () => {
      expect(EmailValidator.extrairDominio('invalido')).toBeNull();
    });
  });

  describe('mascarar', () => {
    it('mascara o meio do usuário mantendo a primeira e última letra', () => {
      // "joao@email.com" → "j**o@email.com"
      const mascarado = EmailValidator.mascarar('joao@email.com');
      expect(mascarado).toBe('j**o@email.com');
    });

    it('devolve o próprio email se for inválido', () => {
      expect(EmailValidator.mascarar('invalido')).toBe('invalido');
    });
  });

  describe('isDominioComum', () => {
    it('reconhece gmail.com como comum', () => {
      expect(EmailValidator.isDominioComum('user@gmail.com')).toBe(true);
    });

    it('reconhece domínio corporativo como não comum', () => {
      expect(EmailValidator.isDominioComum('user@minhaempresa.com.br')).toBe(false);
    });
  });
});