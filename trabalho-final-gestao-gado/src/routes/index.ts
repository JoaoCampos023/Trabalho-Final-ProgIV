import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import animalRoutes from './animalRoutes';
import producaoRoutes from './producaoRoutes';

const router = Router();

// Rotas públicas (autenticação)
router.use('/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/users', userRoutes);
router.use('/animais', animalRoutes);
router.use('/producoes', producaoRoutes);

export default router;