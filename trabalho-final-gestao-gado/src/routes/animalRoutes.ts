import { Router } from 'express';
import { AnimalController } from '../controllers/AnimalController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const animalController = new AnimalController();

// ============================================
// ROTAS PÚBLICAS (não requerem autenticação)
// ============================================

// Nenhuma rota pública para animais

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

// Todas as rotas de animal requerem autenticação
router.use(authMiddleware);

// ============================================
// ROTAS DE CONSULTA (disponíveis para todos os usuários autenticados)
// ============================================

// Listar todos os animais com filtros
router.get('/', animalController.listarTodos.bind(animalController));

// Buscar animal por brinco
router.get('/:brinco', animalController.buscarPorBrinco.bind(animalController));

// Buscar árvore genealógica
router.get('/:brinco/tree', animalController.buscarArvoreGenealogica.bind(animalController));

// Buscar machos para seleção (pais)
router.get('/machos/selecao', animalController.buscarMachosParaSelecao.bind(animalController));

// Buscar fêmeas para seleção (mães)
router.get('/femeas/selecao', animalController.buscarFemeasParaSelecao.bind(animalController));

// Estatísticas do rebanho
router.get('/stats', animalController.getStats.bind(animalController));

// ============================================
// ROTAS DE ESCRITA (CRUD)
// ============================================

// Cadastrar novo animal
router.post('/', animalController.criar.bind(animalController));

// Atualizar animal
router.put('/:brinco', animalController.atualizar.bind(animalController));

// Remover animal (soft delete)
router.delete('/:brinco', animalController.remover.bind(animalController));

// Excluir animal permanentemente
router.delete('/:brinco/permanent', animalController.excluirPermanentemente.bind(animalController));

export default router;