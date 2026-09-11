import { AnimalService } from '../../services/AnimalService';
import { AnimalRepository } from '../../repositories/AnimalRepository';
import { ProducaoRepository } from '../../repositories/ProducaoRepository';

jest.mock('../../repositories/AnimalRepository');
jest.mock('../../repositories/ProducaoRepository');

/**
 * Testa as validações de cadastro de animal — as regras que garantem
 * consistência do rebanho e evitam dados absurdos.
 */
describe('AnimalService', () => {
  let service: AnimalService;
  let animalRepo: jest.Mocked<AnimalRepository>;

  beforeEach(() => {
    service = new AnimalService();
    animalRepo = new AnimalRepository() as jest.Mocked<AnimalRepository>;
    (service as any).animalRepository = animalRepo;
    (service as any).producaoRepository = new ProducaoRepository();
  });

  const dadosBase = {
    brinco: 1001,
    nome: 'Mimosa',
    sexo: 'F' as const,
    raca: 'Holandesa',
    peso: 450,
    data_nascimento: new Date(2020, 0, 1),
    ativo: true
  };

  describe('cadastrarAnimal', () => {
    it('rejeita nome vazio', async () => {
      await expect(service.cadastrarAnimal({ ...dadosBase, nome: '  ' })).rejects.toThrow(/nome/i);
    });

    it('rejeita peso zero ou negativo', async () => {
      await expect(service.cadastrarAnimal({ ...dadosBase, peso: 0 })).rejects.toThrow(/peso/i);
      await expect(service.cadastrarAnimal({ ...dadosBase, peso: -10 })).rejects.toThrow(/peso/i);
    });

    it('rejeita peso acima do máximo (5000 kg)', async () => {
      await expect(service.cadastrarAnimal({ ...dadosBase, peso: 6000 })).rejects.toThrow(/peso/i);
    });

    it('rejeita data de nascimento no futuro', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      await expect(service.cadastrarAnimal({ ...dadosBase, data_nascimento: amanha })).rejects.toThrow(
        /futuro/i
      );
    });

    it('rejeita data que resultaria em idade maior que 50 anos', async () => {
      const antiga = new Date();
      antiga.setFullYear(antiga.getFullYear() - 60);
      await expect(service.cadastrarAnimal({ ...dadosBase, data_nascimento: antiga })).rejects.toThrow(
        /idade maior/i
      );
    });

    it('rejeita brinco já existente', async () => {
      animalRepo.brincoExiste.mockResolvedValue(true);
      await expect(service.cadastrarAnimal(dadosBase)).rejects.toThrow(/brinco/i);
    });

    it('cadastra animal válido', async () => {
      animalRepo.brincoExiste.mockResolvedValue(false);
      animalRepo.create.mockResolvedValue({
        ...dadosBase,
        criado_em: new Date(),
        atualizado_em: new Date()
      } as any);

      await expect(service.cadastrarAnimal(dadosBase)).resolves.toBeDefined();
      expect(animalRepo.create).toHaveBeenCalled();
    });
  });
});