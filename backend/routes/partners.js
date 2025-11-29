const express = require('express');

module.exports = function createPartnersRouter({ supabase, nanoid }) {
  const router = express.Router();

  // GET / - List all partners
  router.get('/', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (e) {
      console.error('GET /api/partners error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // POST / - Create partner
  router.post('/', express.json(), async (req, res) => {
    try {
      const { name, description = '', link_url = '', logo_url = '', bg_color = '#FFFFFF', visible = true } = req.body || {};
      if (!name) return res.status(400).json({ message: 'name is required' });

      const { data: maxPos } = await supabase
        .from('partners')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single();
      const position = (maxPos?.position || 0) + 1;

      const { data, error } = await supabase
        .from('partners')
        .insert({ id: nanoid(), name, description, link_url, logo_url, bg_color, visible, position, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (e) {
      console.error('POST /api/partners error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /:id - Update partner
  router.put('/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, link_url, logo_url, bg_color, visible } = req.body || {};
      const patch = {};
      if (typeof name === 'string') patch.name = name;
      if (typeof description === 'string') patch.description = description;
      if (typeof link_url === 'string') patch.link_url = link_url;
      if (typeof logo_url === 'string') patch.logo_url = logo_url;
      if (typeof bg_color === 'string') patch.bg_color = bg_color;
      if (typeof visible === 'boolean') patch.visible = visible;
      if (Object.keys(patch).length === 0) return res.status(400).json({ message: 'No fields to update' });

      const { data, error } = await supabase
        .from('partners')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (e) {
      console.error('PUT /api/partners/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // DELETE /:id - Delete partner
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, id });
    } catch (e) {
      console.error('DELETE /api/partners/:id error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  // PUT /order - Update ordering
  router.put('/order', express.json(), async (req, res) => {
    try {
      const { orderedIds } = req.body || {};
      if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array' });
      await Promise.all(orderedIds.map((id, idx) => supabase.from('partners').update({ position: idx }).eq('id', id)));
      res.json({ success: true });
    } catch (e) {
      console.error('PUT /api/partners/order error:', e);
      res.status(500).json({ message: e.message || 'Server error' });
    }
  });

  return router;
};
