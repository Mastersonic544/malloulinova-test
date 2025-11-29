import React, { useEffect, useState } from 'react';
import { fetchPartners, createPartner, updatePartner, deletePartner, updatePartnerOrder } from '../services/partnerService.js';

const PartnersSection = ({ colors }) => {
  const [partners, setPartners] = useState([]);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    description: '',
    link_url: '',
    logo_url: '',
    bg_color: '#FFFFFF',
    visible: true
  });
  const [editingPartner, setEditingPartner] = useState(null);
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

  const resetStatus = () => {
    setStatusSuccess(null);
    setStatusError(null);
  };

  const loadPartners = async () => {
    resetStatus();
    try {
      setLoading(true);
      const list = await fetchPartners();
      setPartners(Array.isArray(list) ? list : []);
    } catch (e) {
      setPartners([]);
      setStatusError('Failed to load partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const sortedPartners = [...partners].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const handleCreatePartner = async () => {
    resetStatus();
    if (!partnerForm.name.trim()) {
      setStatusError('Name is required.');
      return;
    }
    try {
      const created = await createPartner({
        name: partnerForm.name.trim(),
        description: partnerForm.description.trim(),
        link_url: partnerForm.link_url.trim(),
        logo_url: partnerForm.logo_url.trim(),
        bg_color: partnerForm.bg_color || '#FFFFFF',
        visible: !!partnerForm.visible
      });
      setPartners((prev) => [...prev, created]);
      setPartnerForm({
        name: '',
        description: '',
        link_url: '',
        logo_url: '',
        bg_color: '#FFFFFF',
        visible: true
      });
      setStatusSuccess('Partner created.');
    } catch (e) {
      setStatusError('Failed to create partner.');
    }
  };

  const handleUpdatePartner = async (id) => {
    resetStatus();
    if (!editingPartner || editingPartner.id !== id) return;
    if (!editingPartner.name.trim()) {
      setStatusError('Name is required.');
      return;
    }
    try {
      const updated = await updatePartner(id, {
        name: editingPartner.name.trim(),
        description: editingPartner.description || '',
        link_url: editingPartner.link_url || '',
        logo_url: editingPartner.logo_url || '',
        bg_color: editingPartner.bg_color || '#FFFFFF',
        visible: !!editingPartner.visible
      });
      setPartners((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingPartner(null);
      setStatusSuccess('Partner updated.');
    } catch (e) {
      setStatusError('Failed to update partner.');
    }
  };

  const handleDeletePartner = async (id) => {
    resetStatus();
    try {
      await deletePartner(id);
      setPartners((prev) => prev.filter((p) => p.id !== id));
      setStatusSuccess('Partner deleted.');
    } catch (e) {
      setStatusError('Failed to delete partner.');
    }
  };

  const movePartner = async (id, direction) => {
    resetStatus();
    const sorted = [...partners].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    const index = sorted.findIndex((p) => p.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const orderedIds = reordered.map((p) => p.id);
    setPartners(reordered);
    try {
      await updatePartnerOrder(orderedIds);
      setStatusSuccess('Partner order updated.');
    } catch (e) {
      setStatusError('Failed to update partner order.');
      loadPartners();
    }
  };

  return (
    <section
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '18px',
        background: colors.card,
        boxShadow: colors.shadow
      }}
    >
      <h3 style={{ marginTop: 0, color: colors.dark }}>Manage Partners</h3>

      {statusSuccess && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46'
          }}
        >
          {statusSuccess}
        </div>
      )}
      {statusError && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b'
          }}
        >
          {statusError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>
            {editingPartner ? 'Edit Partner' : 'Add New Partner'}
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Name"
              value={editingPartner ? editingPartner.name : partnerForm.name}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({ ...editingPartner, name: e.target.value })
                  : setPartnerForm({ ...partnerForm, name: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Website link (https://...)"
              value={editingPartner ? editingPartner.link_url : partnerForm.link_url}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({ ...editingPartner, link_url: e.target.value })
                  : setPartnerForm({ ...partnerForm, link_url: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Logo URL (public image)"
              value={editingPartner ? editingPartner.logo_url : partnerForm.logo_url}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({ ...editingPartner, logo_url: e.target.value })
                  : setPartnerForm({ ...partnerForm, logo_url: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Background color (e.g. #FFFFFF)"
              value={editingPartner ? editingPartner.bg_color : partnerForm.bg_color}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({ ...editingPartner, bg_color: e.target.value })
                  : setPartnerForm({ ...partnerForm, bg_color: e.target.value })
              }
              style={inputStyle}
            />
            <textarea
              rows={4}
              placeholder="Short description"
              value={editingPartner ? editingPartner.description : partnerForm.description}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({ ...editingPartner, description: e.target.value })
                  : setPartnerForm({ ...partnerForm, description: e.target.value })
              }
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                color: colors.text
              }}
            >
              <input
                type="checkbox"
                checked={editingPartner ? !!editingPartner.visible : !!partnerForm.visible}
                onChange={(e) =>
                  editingPartner
                    ? setEditingPartner({ ...editingPartner, visible: e.target.checked })
                    : setPartnerForm({ ...partnerForm, visible: e.target.checked })
                }
              />
              Visible on site
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {editingPartner ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdatePartner(editingPartner.id)}
                    style={{
                      padding: '10px 14px',
                      background: colors.accent,
                      border: 'none',
                      color: '#fff',
                      borderRadius: 999,
                      cursor: 'pointer'
                    }}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPartner(null)}
                    style={{
                      padding: '10px 14px',
                      background: '#e2e8f0',
                      border: 'none',
                      color: colors.text,
                      borderRadius: 999,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCreatePartner}
                  style={{
                    padding: '10px 14px',
                    background: colors.accent,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 999,
                    cursor: 'pointer'
                  }}
                >
                  Add partner
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>Existing Partners</h4>
          {loading && (
            <div style={{ fontSize: 13, color: colors.muted }}>Loading…</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedPartners.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: colors.bg,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: '#fff',
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {p.logo_url ? (
                      <img
                        src={p.logo_url}
                        alt={p.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: colors.muted }}>No logo</span>
                    )}
                  </div>
                  <div>
                    <strong style={{ color: colors.dark }}>{p.name}</strong>
                    <div style={{ fontSize: 12, color: colors.muted }}>{p.link_url}</div>
                    {p.description && (
                      <div style={{ fontSize: 12, color: colors.muted }}>{p.description}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => movePartner(p.id, 'up')}
                      disabled={idx === 0}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5f5',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: 10,
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        opacity: idx === 0 ? 0.4 : 1
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => movePartner(p.id, 'down')}
                      disabled={idx === sortedPartners.length - 1}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5f5',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: 10,
                        cursor:
                          idx === sortedPartners.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: idx === sortedPartners.length - 1 ? 0.4 : 1
                      }}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPartner(p)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.primary,
                      fontSize: 13
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePartner(p.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: 13
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {sortedPartners.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: colors.muted }}>
                No partners yet. Add your first partner on the left.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
