import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { RelatorioController } from '../controllers/RelatorioController';

const router = Router();
const relatorioController = new RelatorioController();

// Todos os relatórios exigem login.
router.use(authMiddleware);

// ---- Consultas (JSON) ----
router.get('/producao', relatorioController.getRelatorioProducao.bind(relatorioController));
router.get('/rebanho', relatorioController.getRelatorioRebanho.bind(relatorioController));
router.get('/graficos/producao', relatorioController.getDadosGraficoProducao.bind(relatorioController));

// ---- Exportação (arquivo binário) ----
// Mesmos filtros da tela: a URL de exportar carrega os query params atuais,
// então o arquivo baixado bate com o que o usuário está vendo.
router.get('/producao/pdf', relatorioController.exportarProducaoPDF.bind(relatorioController));
router.get('/producao/excel', relatorioController.exportarProducaoExcel.bind(relatorioController));
router.get('/rebanho/pdf', relatorioController.exportarRebanhoPDF.bind(relatorioController));
router.get('/rebanho/excel', relatorioController.exportarRebanhoExcel.bind(relatorioController));

export default router;