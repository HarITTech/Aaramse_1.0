import express from 'express';
import { checkHealth } from './health.controller.js';

const router = express.Router();

// Maps to /api/health
router.get('/', checkHealth);

export default router;
