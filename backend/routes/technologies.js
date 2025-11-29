const express = require('express');

module.exports = function createTechnologiesRouter({ supabase, nanoid }) {
  const router = express.Router();

  // GET / - List all technologies
  router.get('/', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('technologies')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (e) {
      console.error('GET /api/technologies error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // POST / - Create a technology
  router.post('/', express.json(), async (req, res) => {
    try {
      const { name, visible = true } = req.body || {};
      if (!name) return res.status(400).json({ message: 'name is required' });

      const { data: maxPos } = await supabase
        .from('technologies')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single();
      const position = (maxPos?.position || 0) + 1;

      const { data, error } = await supabase
        .from('technologies')
        .insert({ id: nanoid(), name, visible, position, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (e) {
      console.error('POST /api/technologies error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /:id - Update a technology
  router.put('/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, visible } = req.body || {};
      const patch = {};
      if (typeof name === 'string') patch.name = name;
      if (typeof visible === 'boolean') patch.visible = visible;
      if (Object.keys(patch).length === 0) return res.status(400).json({ message: 'No fields to update' });

      const { data, error } = await supabase
        .from('technologies')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (e) {
      console.error('PUT /api/technologies/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // DELETE /:id - Delete a technology
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('technologies').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, id });
    } catch (e) {
      console.error('DELETE /api/technologies/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /order - Update ordering
  router.put('/order', express.json(), async (req, res) => {
    try {
      const { orderedIds } = req.body || {};
      if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array' });
      await Promise.all(orderedIds.map((id, idx) => supabase.from('technologies').update({ position: idx }).eq('id', id)));
      res.json({ success: true });
    } catch (e) {
      console.error('PUT /api/technologies/order error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  return router;
}
