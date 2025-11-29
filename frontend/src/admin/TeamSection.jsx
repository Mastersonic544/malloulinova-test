import React, { useEffect, useState } from 'react';
import { fetchTeam, createTeamMember, updateTeamMember, deleteTeamMember, updateTeamOrder } from '../services/teamService.js';

const TeamSection = ({ colors }) => {
  const [team, setTeam] = useState([]);
  const [teamForm, setTeamForm] = useState({
    name: '',
    title: '',
    bio: '',
    linkedin: '',
    image_url: '',
    visible: true
  });
  const [editingTeam, setEditingTeam] = useState(null);
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

  const loadTeam = async () => {
    resetStatus();
    try {
      setLoading(true);
      const list = await fetchTeam();
      setTeam(Array.isArray(list) ? list : []);
    } catch (e) {
      setTeam([]);
      setStatusError('Failed to load team.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const sortedTeam = [...team].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const handleCreateTeam = async () => {
    resetStatus();
    if (!teamForm.name.trim()) {
      setStatusError('Name is required.');
      return;
    }
    try {
      const created = await createTeamMember({
        name: teamForm.name.trim(),
        title: teamForm.title.trim(),
        bio: teamForm.bio.trim(),
        linkedin: teamForm.linkedin.trim(),
        image_url: teamForm.image_url.trim(),
        visible: !!teamForm.visible
      });
      setTeam((prev) => [...prev, created]);
      setTeamForm({
        name: '',
        title: '',
        bio: '',
        linkedin: '',
        image_url: '',
        visible: true
      });
      setStatusSuccess('Team member created.');
    } catch (e) {
      setStatusError('Failed to create team member.');
    }
  };

  const handleUpdateTeam = async (id) => {
    resetStatus();
    if (!editingTeam || editingTeam.id !== id) return;
    if (!editingTeam.name.trim()) {
      setStatusError('Name is required.');
      return;
    }
    try {
      const updated = await updateTeamMember(id, {
        name: editingTeam.name.trim(),
        title: editingTeam.title || '',
        bio: editingTeam.bio || '',
        linkedin: editingTeam.linkedin || '',
        image_url: editingTeam.image_url || '',
        visible: !!editingTeam.visible
      });
      setTeam((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditingTeam(null);
      setStatusSuccess('Team member updated.');
    } catch (e) {
      setStatusError('Failed to update team member.');
    }
  };

  const handleDeleteTeam = async (id) => {
    resetStatus();
    try {
      await deleteTeamMember(id);
      setTeam((prev) => prev.filter((m) => m.id !== id));
      setStatusSuccess('Team member deleted.');
    } catch (e) {
      setStatusError('Failed to delete team member.');
    }
  };

  const moveTeam = async (id, direction) => {
    resetStatus();
    const sorted = [...team].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    const index = sorted.findIndex((m) => m.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const orderedIds = reordered.map((m) => m.id);
    setTeam(reordered);
    try {
      await updateTeamOrder(orderedIds);
      setStatusSuccess('Team order updated.');
    } catch (e) {
      setStatusError('Failed to update team order.');
      loadTeam();
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
      <h3 style={{ marginTop: 0, color: colors.dark }}>Manage Team</h3>

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
            {editingTeam ? 'Edit Team Member' : 'Add New Team Member'}
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Name"
              value={editingTeam ? editingTeam.name : teamForm.name}
              onChange={(e) =>
                editingTeam
                  ? setEditingTeam({ ...editingTeam, name: e.target.value })
                  : setTeamForm({ ...teamForm, name: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Title"
              value={editingTeam ? editingTeam.title : teamForm.title}
              onChange={(e) =>
                editingTeam
                  ? setEditingTeam({ ...editingTeam, title: e.target.value })
                  : setTeamForm({ ...teamForm, title: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="LinkedIn URL"
              value={editingTeam ? editingTeam.linkedin : teamForm.linkedin}
              onChange={(e) =>
                editingTeam
                  ? setEditingTeam({ ...editingTeam, linkedin: e.target.value })
                  : setTeamForm({ ...teamForm, linkedin: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Image URL (public)"
              value={editingTeam ? editingTeam.image_url : teamForm.image_url}
              onChange={(e) =>
                editingTeam
                  ? setEditingTeam({ ...editingTeam, image_url: e.target.value })
                  : setTeamForm({ ...teamForm, image_url: e.target.value })
              }
              style={inputStyle}
            />
            <textarea
              rows={5}
              placeholder="Short bio"
              value={editingTeam ? editingTeam.bio : teamForm.bio}
              onChange={(e) =>
                editingTeam
                  ? setEditingTeam({ ...editingTeam, bio: e.target.value })
                  : setTeamForm({ ...teamForm, bio: e.target.value })
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
                checked={editingTeam ? !!editingTeam.visible : !!teamForm.visible}
                onChange={(e) =>
                  editingTeam
                    ? setEditingTeam({ ...editingTeam, visible: e.target.checked })
                    : setTeamForm({ ...teamForm, visible: e.target.checked })
                }
              />
              Visible on site
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {editingTeam ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateTeam(editingTeam.id)}
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
                    onClick={() => setEditingTeam(null)}
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
                  onClick={handleCreateTeam}
                  style={{
                    padding: '10px 14px',
                    background: colors.accent,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 999,
                    cursor: 'pointer'
                  }}
                >
                  Add team member
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>Existing Team</h4>
          {loading && (
            <div style={{ fontSize: 13, color: colors.muted }}>Loading…</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedTeam.map((m, idx) => (
              <div
                key={m.id}
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
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: colors.muted }}>No image</span>
                    )}
                  </div>
                  <div>
                    <strong style={{ color: colors.dark }}>{m.name}</strong>
                    <div style={{ fontSize: 12, color: colors.muted }}>{m.title}</div>
                    {m.linkedin && (
                      <div style={{ fontSize: 12, color: colors.muted }}>{m.linkedin}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => moveTeam(m.id, 'up')}
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
                      onClick={() => moveTeam(m.id, 'down')}
                      disabled={idx === sortedTeam.length - 1}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5f5',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: 10,
                        cursor:
                          idx === sortedTeam.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: idx === sortedTeam.length - 1 ? 0.4 : 1
                      }}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTeam(m)}
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
                    onClick={() => handleDeleteTeam(m.id)}
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
            {sortedTeam.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: colors.muted }}>
                No team members yet. Add your first member on the left.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
