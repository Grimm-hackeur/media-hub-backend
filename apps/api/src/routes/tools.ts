import { Router } from 'express';
import type { makeLimiters } from '../middleware/rateLimit.js';
import { csrfIfSession } from '../middleware/http.js';
import { analyzeSchema, searchSchema, type ToolsService } from '../services/tools.service.js';

/** Public tools (anonymous visitors allowed, rate-limited). A signed-in user additionally gets history, and must send the CSRF token. */
export function toolsRouter(tools: ToolsService, lim: ReturnType<typeof makeLimiters>) {
  const r = Router();
  r.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  r.get('/', async (_req, res) => { res.json(await tools.list()); });

  r.get('/music/search', lim.tools, async (req, res) => { res.json(await tools.search(searchSchema.parse(req.query), req.auth?.user ?? null)); });
  r.post('/music/search', csrfIfSession, lim.tools, async (req, res) => { res.json(await tools.search(searchSchema.parse(req.body), req.auth?.user ?? null)); });

  /** Releases the links once the server-side wait (ad time) is over. */
  r.post('/jobs/:jobId/claim', csrfIfSession, lim.claim, async (req, res) => { res.json(await tools.claim(String(req.params.jobId), req.auth?.user ?? null)); });

  r.post('/:id/analyze', csrfIfSession, lim.tools, async (req, res) => {
    res.json(await tools.analyze(String(req.params.id), analyzeSchema.parse(req.body).url, req.auth?.user ?? null));
  });
  return r;
}
