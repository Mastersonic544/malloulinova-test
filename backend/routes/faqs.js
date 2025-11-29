const express = require('express');

module.exports = function createFaqsRouter({ supabase, nanoid, express: _express }) {
  const router = express.Router();

  // GET / - List all FAQs
  router.get('/', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (e) {
      console.error('GET /api/faqs error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // POST / - Create FAQ
  router.post('/', express.json(), async (req, res) => {
    try {
      const { question, answer } = req.body || {};
      if (!question || !answer) {
        return res.status(400).json({ message: 'Question and answer are required' });
      }

      const { data: maxPos } = await supabase
        .from('faqs')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPos?.position || 0) + 1;

      const { data, error } = await supabase
        .from('faqs')
        .insert({ id: nanoid(), question, answer, position: newPosition, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (e) {
      console.error('POST /api/faqs error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /:id - Update FAQ
  router.put('/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { question, answer } = req.body || {};
      const patch = {};
      if (question) patch.question = question;
      if (answer) patch.answer = answer;
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      const { data, error } = await supabase
        .from('faqs')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (e) {
      console.error('PUT /api/faqs/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // DELETE /:id - Delete FAQ
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, id });
    } catch (e) {
      console.error('DELETE /api/faqs/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /order - Update FAQ order
  router.put('/order', express.json(), async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ message: 'orderedIds must be an array' });
      }
      await Promise.all(orderedIds.map((id, index) => supabase.from('faqs').update({ position: index }).eq('id', id)));
      res.json({ success: true });
    } catch (e) {
      console.error('PUT /api/faqs/order error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  return router;
}
