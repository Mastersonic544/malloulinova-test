import React, { useEffect, useState } from 'react';
import { fetchServices, createService, updateService, deleteService, updateServicesOrder } from '../services/serviceService.js';

const ServicesSection = ({ colors }) => {
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    image_url: '',
    visible: true
  });
  const [editingService, setEditingService] = useState(null);
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

  const loadServices = async () => {
    resetStatus();
    try {
      setLoading(true);
      const list = await fetchServices();
      setServices(Array.isArray(list) ? list : []);
    } catch (e) {
      setServices([]);
      setStatusError('Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const sortedServices = [...services].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const handleCreateService = async () => {
    resetStatus();
    if (!serviceForm.title.trim()) {
      setStatusError('Title is required.');
      return;
    }
    try {
      const created = await createService({
        title: serviceForm.title.trim(),
        description: serviceForm.description.trim(),
        image_url: serviceForm.image_url.trim(),
        visible: !!serviceForm.visible
      });
      setServices((prev) => [...prev, created]);
      setServiceForm({ title: '', description: '', image_url: '', visible: true });
      setStatusSuccess('Service created.');
    } catch (e) {
      setStatusError('Failed to create service.');
    }
  };

  const handleUpdateService = async (id) => {
    resetStatus();
    if (!editingService || editingService.id !== id) return;
    if (!editingService.title.trim()) {
      setStatusError('Title is required.');
      return;
    }
    try {
      const updated = await updateService(id, {
        title: editingService.title.trim(),
        description: editingService.description || '',
        image_url: editingService.image_url || '',
        visible: !!editingService.visible
      });
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingService(null);
      setStatusSuccess('Service updated.');
    } catch (e) {
      setStatusError('Failed to update service.');
    }
  };

  const handleDeleteService = async (id) => {
    resetStatus();
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      setStatusSuccess('Service deleted.');
    } catch (e) {
      setStatusError('Failed to delete service.');
    }
  };

  const moveService = async (id, direction) => {
    resetStatus();
    const sorted = [...services].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    const index = sorted.findIndex((s) => s.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const orderedIds = reordered.map((s) => s.id);
    setServices(reordered);
    try {
      await updateServicesOrder(orderedIds);
      setStatusSuccess('Service order updated.');
    } catch (e) {
      setStatusError('Failed to update service order.');
      loadServices();
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
      <h3 style={{ marginTop: 0, color: colors.dark }}>Manage Services</h3>

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
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Title"
              value={editingService ? editingService.title : serviceForm.title}
              onChange={(e) =>
                editingService
                  ? setEditingService({ ...editingService, title: e.target.value })
                  : setServiceForm({ ...serviceForm, title: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Image URL (public)"
              value={editingService ? editingService.image_url : serviceForm.image_url}
              onChange={(e) =>
                editingService
                  ? setEditingService({ ...editingService, image_url: e.target.value })
                  : setServiceForm({ ...serviceForm, image_url: e.target.value })
              }
              style={inputStyle}
            />
            <textarea
              rows={4}
              placeholder="Short description"
              value={editingService ? editingService.description : serviceForm.description}
              onChange={(e) =>
                editingService
                  ? setEditingService({ ...editingService, description: e.target.value })
                  : setServiceForm({ ...serviceForm, description: e.target.value })
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
                checked={editingService ? !!editingService.visible : !!serviceForm.visible}
                onChange={(e) =>
                  editingService
                    ? setEditingService({ ...editingService, visible: e.target.checked })
                    : setServiceForm({ ...serviceForm, visible: e.target.checked })
                }
              />
              Visible on site
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {editingService ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateService(editingService.id)}
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
                    onClick={() => setEditingService(null)}
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
                  onClick={handleCreateService}
                  style={{
                    padding: '10px 14px',
                    background: colors.accent,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 999,
                    cursor: 'pointer'
                  }}
                >
                  Add service
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>Existing Services</h4>
          {loading && (
            <div style={{ fontSize: 13, color: colors.muted }}>Loading…</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedServices.map((s, idx) => (
              <div
                key={s.id}
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
                      width: 64,
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
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.title}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: colors.muted }}>No image</span>
                    )}
                  </div>
                  <div>
                    <strong style={{ color: colors.dark }}>{s.title}</strong>
                    {s.description && (
                      <div style={{ fontSize: 12, color: colors.muted }}>{s.description}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => moveService(s.id, 'up')}
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
                      onClick={() => moveService(s.id, 'down')}
                      disabled={idx === sortedServices.length - 1}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5f5',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: 10,
                        cursor:
                          idx === sortedServices.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: idx === sortedServices.length - 1 ? 0.4 : 1
                      }}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingService(s)}
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
                    onClick={() => handleDeleteService(s.id)}
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
            {sortedServices.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: colors.muted }}>
                No services yet. Add your first service on the left.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
