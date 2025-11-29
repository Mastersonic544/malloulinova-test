import React, { useEffect, useState } from 'react';
import { fetchTags, createTag, updateTag, deleteTag } from '../services/tagService.js';

const TagsSection = ({ colors }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [newTagForm, setNewTagForm] = useState({ name: '', description: '', color: '#447D9B' });
  const [editingTag, setEditingTag] = useState(null);
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

  const loadTags = async () => {
    resetStatus();
    try {
      setLoading(true);
      const tags = await fetchTags();
      setAvailableTags(Array.isArray(tags) ? tags : []);
    } catch (e) {
      setAvailableTags([]);
      setStatusError('Failed to load tags.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreateTag = async () => {
    resetStatus();
    if (!newTagForm.name.trim()) {
      setStatusError('Tag name is required.');
      return;
    }
    try {
      const created = await createTag({
        name: newTagForm.name.trim(),
        description: newTagForm.description.trim(),
        color: newTagForm.color
      });
      setAvailableTags((prev) => [...prev, created]);
      setNewTagForm({ name: '', description: '', color: '#447D9B' });
      setStatusSuccess('Tag created.');
    } catch (e) {
      setStatusError('Failed to create tag.');
    }
  };

  const handleUpdateTag = async (id) => {
    resetStatus();
    if (!editingTag || editingTag.id !== id) return;
    if (!editingTag.name.trim()) {
      setStatusError('Tag name is required.');
      return;
    }
    try {
      const updated = await updateTag(id, {
        name: editingTag.name.trim(),
        description: editingTag.description || '',
        color: editingTag.color || '#447D9B'
      });
      setAvailableTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingTag(null);
      setStatusSuccess('Tag updated.');
    } catch (e) {
      setStatusError('Failed to update tag.');
    }
  };

  const handleDeleteTag = async (id) => {
    resetStatus();
    try {
      await deleteTag(id);
      setAvailableTags((prev) => prev.filter((t) => t.id !== id));
      setStatusSuccess('Tag deleted.');
    } catch (e) {
      setStatusError('Failed to delete tag.');
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
      <h3 style={{ marginTop: 0, color: colors.dark }}>Manage Tags</h3>

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

      <div style={{ marginBottom: '2rem', padding: '1rem', background: colors.bg, borderRadius: '12px' }}>
        <h4 style={{ marginTop: 0, fontSize: '1rem', color: colors.dark }}>Create New Tag</h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          <input
            placeholder="Tag name"
            value={newTagForm.name}
            onChange={(e) => setNewTagForm({ ...newTagForm, name: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)"
            value={newTagForm.description}
            onChange={(e) => setNewTagForm({ ...newTagForm, description: e.target.value })}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: colors.text }}>Color:</span>
            <input
              type="color"
              value={newTagForm.color}
              onChange={(e) => setNewTagForm({ ...newTagForm, color: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loading ? 0.6 : 1
              }}
            >
              Create Tag
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: '1rem', color: colors.dark }}>
          Existing Tags ({availableTags.length})
        </h4>
        {loading && (
          <div style={{ fontSize: 13, color: colors.muted }}>Loading tags…</div>
        )}
        <div style={{ display: 'grid', gap: '12px' }}>
          {availableTags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: colors.bg,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`
              }}
            >
              {editingTag && editingTag.id === tag.id ? (
                <div style={{ display: 'flex', gap: '12px', flex: 1, alignItems: 'center' }}>
                  <input
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    style={{ width: 50, height: 40, border: 'none', borderRadius: 8 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateTag(tag.id)}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTag(null)}
                    style={{
                      padding: '8px 16px',
                      background: colors.muted,
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: tag.color
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: colors.text }}>{tag.name}</div>
                      {tag.description && (
                        <div style={{ fontSize: 12, color: colors.muted }}>{tag.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setEditingTag(tag)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: colors.primary,
                        border: `1px solid ${colors.primary}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TagsSection;
