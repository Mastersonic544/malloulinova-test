import React, { useEffect, useState } from 'react';
import { fetchTechnologies, createTechnology, updateTechnology, deleteTechnology, updateTechnologiesOrder } from '../services/technologyService.js';

const TechnologiesSection = ({ colors }) => {
  const [items, setItems] = useState([]);
  const [techForm, setTechForm] = useState({ name: '', visible: true });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: '#fff',
    fontSize: 14
  };

  const resetStatus = () => { setStatusSuccess(null); setStatusError(null); };

  const load = async () => {
    resetStatus();
    try {
      setLoading(true);
      const list = await fetchTechnologies();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setItems([]);
      setStatusError('Failed to load technologies.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sorted = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const handleCreate = async () => {
    resetStatus();
    if (!techForm.name.trim()) { setStatusError('Name is required.'); return; }
    try {
      const created = await createTechnology({ name: techForm.name.trim(), visible: !!techForm.visible });
      setItems(prev => [...prev, created]);
      setTechForm({ name: '', visible: true });
      setStatusSuccess('Technology added.');
    } catch (e) { setStatusError('Failed to add technology.'); }
  };

  const handleUpdate = async (id) => {
    resetStatus();
    if (!editing || editing.id !== id) return;
    if (!editing.name.trim()) { setStatusError('Name is required.'); return; }
    try {
      const updated = await updateTechnology(id, { name: editing.name.trim(), visible: !!editing.visible });
      setItems(prev => prev.map(it => it.id === id ? updated : it));
      setEditing(null);
      setStatusSuccess('Technology updated.');
    } catch (e) { setStatusError('Failed to update technology.'); }
  };

  const handleDelete = async (id) => {
    resetStatus();
    try {
      await deleteTechnology(id);
      setItems(prev => prev.filter(it => it.id !== id));
      setStatusSuccess('Technology deleted.');
    } catch (e) { setStatusError('Failed to delete technology.'); }
  };

  const move = async (id, direction) => {
    resetStatus();
    const order = [...sorted];
    const idx = order.findIndex(it => it.id === id);
    if (idx === -1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= order.length) return;
    const reordered = [...order];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(target, 0, moved);
    setItems(reordered);
    try {
      await updateTechnologiesOrder(reordered.map(it => it.id));
      setStatusSuccess('Order updated.');
    } catch (e) { setStatusError('Failed to update order.'); load(); }
  };

  return (
    <section style={{ border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '18px', background: colors.card, boxShadow: colors.shadow }}>
      <h3 style={{ marginTop: 0, color: colors.dark }}>Manage Technologies</h3>

      {statusSuccess && (
        <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}>{statusSuccess}</div>
      )}
      {statusError && (
        <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>{statusError}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>{editing ? 'Edit Technology' : 'Add New Technology'}</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Name"
              value={editing ? editing.name : techForm.name}
              onChange={(e) => editing ? setEditing({ ...editing, name: e.target.value }) : setTechForm({ ...techForm, name: e.target.value })}
              style={inputStyle}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: colors.text }}>
              <input
                type="checkbox"
                checked={editing ? !!editing.visible : !!techForm.visible}
                onChange={(e) => editing ? setEditing({ ...editing, visible: e.target.checked }) : setTechForm({ ...techForm, visible: e.target.checked })}
              />
              Visible on site
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {editing ? (
                <>
                  <button type="button" onClick={() => handleUpdate(editing.id)} style={{ padding: '10px 14px', background: colors.accent, border: 'none', color: '#fff', borderRadius: 999, cursor: 'pointer' }}>Save changes</button>
                  <button type="button" onClick={() => setEditing(null)} style={{ padding: '10px 14px', background: '#e2e8f0', border: 'none', color: colors.text, borderRadius: 999, cursor: 'pointer' }}>Cancel</button>
                </>
              ) : (
                <button type="button" onClick={handleCreate} style={{ padding: '10px 14px', background: colors.accent, border: 'none', color: '#fff', borderRadius: 999, cursor: 'pointer' }}>Add technology</button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>Existing Technologies</h4>
          {loading && <div style={{ fontSize: 13, color: colors.muted }}>Loading…</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sorted.map((t, idx) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: colors.bg, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div><strong style={{ color: colors.dark }}>{t.name}</strong></div>
                  <div style={{ fontSize: 12, color: colors.muted }}>{t.visible === false ? 'Hidden' : 'Visible'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button type="button" onClick={() => move(t.id, 'up')} disabled={idx === 0} style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5f5', background: '#eff6ff', color: '#1d4ed8', fontSize: 10, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                    <button type="button" onClick={() => move(t.id, 'down')} disabled={idx === sorted.length - 1} style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5f5', background: '#eff6ff', color: '#1d4ed8', fontSize: 10, cursor: idx === sorted.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === sorted.length - 1 ? 0.4 : 1 }}>↓</button>
                  </div>
                  <button type="button" onClick={() => setEditing(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.primary, fontSize: 13 }}>Edit</button>
                  <button type="button" onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>Delete</button>
                </div>
              </div>
            ))}
            {sorted.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: colors.muted }}>No technologies yet. Add your first technology on the left.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologiesSection;
