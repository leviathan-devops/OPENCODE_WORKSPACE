import express, { Request, Response } from 'express';

const router = express.Router();

// BUG-002: Race condition
const sessionCache = new Map();

// TODO: Add authentication middleware
router.post('/api/data/ingest', async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    sessionCache.set(req.headers['session-id'], rawData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BUG-003: SQL injection
router.get('/api/data/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const query = `SELECT * FROM data WHERE id = '${id}'`;
  res.json({ query });
});

// BUG-006: Returns 200 for non-existent
router.get('/api/resource/:id', (req: Request, res: Response) => {
  res.json({ found: false });
});

export default router;
