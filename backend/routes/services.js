const express = require('express');

module.exports = function createServicesRouter({ supabase, nanoid }) {
  const router = express.Router();

  // GET / - List all services (expertise)
  router.get('/', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (e) {
      console.error('GET /api/services error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // POST / - Create a service
  router.post('/', express.json(), async (req, res) => {
    try {
      const { title, description = '', image_url = '', visible = true } = req.body || {};
      if (!title) return res.status(400).json({ message: 'title is required' });

      const { data: maxPos } = await supabase
        .from('services')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single();
      const position = (maxPos?.position || 0) + 1;

      const { data, error } = await supabase
        .from('services')
        .insert({ id: nanoid(), title, description, image_url, visible, position, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (e) {
      console.error('POST /api/services error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /:id - Update a service
  router.put('/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, image_url, visible } = req.body || {};
      const patch = {};
      if (typeof title === 'string') patch.title = title;
      if (typeof description === 'string') patch.description = description;
      if (typeof image_url === 'string') patch.image_url = image_url;
      if (typeof visible === 'boolean') patch.visible = visible;
      if (Object.keys(patch).length === 0) return res.status(400).json({ message: 'No fields to update' });

      const { data, error } = await supabase
        .from('services')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (e) {
      console.error('PUT /api/services/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // DELETE /:id - Delete a service
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, id });
    } catch (e) {
      console.error('DELETE /api/services/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /order - Update ordering
  router.put('/order', express.json(), async (req, res) => {
    try {
      const { orderedIds } = req.body || {};
      if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array' });
      await Promise.all(orderedIds.map((id, idx) => supabase.from('services').update({ position: idx }).eq('id', id)));
      res.json({ success: true });
    } catch (e) {
      console.error('PUT /api/services/order error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  return router;
}
