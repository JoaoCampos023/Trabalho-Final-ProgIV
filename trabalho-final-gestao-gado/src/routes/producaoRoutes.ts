import { Router } from 'express';
import { ProducaoController } from '../controllers/ProducaoController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const producaoController = new ProducaoController();

// ============================================
// ROTAS PÚBLICAS (não requerem autenticação)
// ============================================

// Nenhuma rota pública para produções

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

// Todas as rotas de produção requerem autenticação
router.use(authMiddleware);

// ============================================
// ROTAS DE CONSULTA
// ============================================

// Listar todas as produções com filtros
router.get('/', producaoController.listarTodos.bind(producaoController));

// Buscar produção por ID
router.get('/:id', producaoController.buscarPorId.bind(producaoController));

// Buscar produções por animal
router.get('/animal/:brinco', producaoController.listarPorAnimal.bind(producaoController));

// Buscar últimas N produções
router.get('/ultimas/:quantidade', producaoController.listarUltimas.bind(producaoController));

// Obter top vacas produtoras
router.get('/top-vacas', producaoController.getTopVacas.bind(producaoController));

// Obter produção dos últimos N dias
router.get('/producao-dia', producaoController.getProducaoPorDia.bind(producaoController));

// Obter estatísticas de produção
router.get('/stats', producaoController.getStats.bind(producaoController));

// Gerar relatório completo
router.get('/relatorio', producaoController.gerarRelatorio.bind(producaoController));

// ============================================
// ROTAS DE ESCRITA (CRUD)
// ============================================

// Registrar nova produção
router.post('/', producaoController.criar.bind(producaoController));

// Atualizar produção
router.put('/:id', producaoController.atualizar.bind(producaoController));

// Excluir produção
router.delete('/:id', producaoController.excluir.bind(producaoController));

export default router;