import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { RelatorioController } from '../controllers/RelatorioController';

const router = Router();
const relatorioController = new RelatorioController();

router.use(authMiddleware);

router.get('/producao', relatorioController.getRelatorioProducao.bind(relatorioController));
router.get('/producao/pdf', relatorioController.exportarPDF.bind(relatorioController));
router.get('/producao/excel', relatorioController.exportarExcel.bind(relatorioController));
router.get('/rebanho', relatorioController.getRelatorioRebanho.bind(relatorioController));
router.get('/rebanho/pdf', relatorioController.exportarPDFRebanho.bind(relatorioController));
router.get('/graficos/producao', relatorioController.getDadosGraficoProducao.bind(relatorioController));
router.get('/graficos/rebanho', relatorioController.getDadosGraficoRebanho.bind(relatorioController));
router.get('/dashboard', relatorioController.getDashboardData.bind(relatorioController));

// ✅ ENDPOINT DE DEBUG
router.get('/debug', relatorioController.debugDados.bind(relatorioController));

export default router;