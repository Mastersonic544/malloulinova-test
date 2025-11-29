import React, { useEffect, useMemo, useState } from 'react';
import { useContentData, addArticle, updateArticle, deleteArticle, setFeaturedIds } from '../data/content.js';
import { saveArticle, updateArticleRemote, updateArticleMedia, persistFeatured } from '../services/connectorService.js';
import { fetchTags } from '../services/tagService.js';

const ArticlesSection = ({ colors }) => {
  const { data, isLoading, error } = useContentData();

  const [tab, setTab] = useState('manage');
  const [statusSuccess, setStatusSuccess] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [newForm, setNewForm] = useState({
    title: '',
    fullBody: '',
    tags: []
  });
  const [newThumbFile, setNewThumbFile] = useState(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [newDocumentFiles, setNewDocumentFiles] = useState([]);
  const [isSavingNew, setIsSavingNew] = useState(false);

  const [editingArticle, setEditingArticle] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    fullBody: ''
  });
  const [editTags, setEditTags] = useState([]);
  const [editThumbFile, setEditThumbFile] = useState(null);
  const [editGalleryFiles, setEditGalleryFiles] = useState([]);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [editDocumentFiles, setEditDocumentFiles] = useState([]);
  const [clearDocuments, setClearDocuments] = useState(false);
  const [existingThumbUrl, setExistingThumbUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const featuredFromStore = useMemo(
    () => data.filter((a) => a.isFeatured).map((a) => a.id),
    [data]
  );
  const [featuredIds, setFeaturedIdsState] = useState([]);

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: '#fff',
    fontSize: 14
  };

  useEffect(() => {
    setFeaturedIdsState(featuredFromStore);
  }, [featuredFromStore]);

  useEffect(() => {
    let cancelled = false;
    const loadTags = async () => {
      try {
        setLoadingTags(true);
        const tags = await fetchTags();
        if (!cancelled) setAvailableTags(Array.isArray(tags) ? tags : []);
      } catch (e) {
        if (!cancelled) setAvailableTags([]);
      } finally {
        if (!cancelled) setLoadingTags(false);
      }
    };
    loadTags();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetStatus = () => {
    setStatusSuccess(null);
    setStatusError(null);
  };

  const handleToggleTagForNew = (id) => {
    setNewForm((prev) => {
      const has = prev.tags.includes(id);
      return {
        ...prev,
        tags: has ? prev.tags.filter((x) => x !== id) : [...prev.tags, id]
      };
    });
  };

  const handleToggleTagForEdit = (id) => {
    setEditTags((prev) => {
      const has = prev.includes(id);
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const handleToggleFeatured = async (id) => {
    resetStatus();
    let next;
    if (featuredIds.includes(id)) {
      next = featuredIds.filter((x) => x !== id);
    } else {
      next = [...featuredIds, id];
      if (next.length > 3) {
        next = next.slice(0, 3);
      }
    }
    setFeaturedIdsState(next);
    setFeaturedIds(next);
    try {
      await persistFeatured(next);
      setStatusSuccess('Featured articles updated.');
    } catch (e) {
      setStatusError('Failed to persist featured articles.');
    }
  };

  const handleCreateArticle = async (event) => {
    event.preventDefault();
    resetStatus();
    if (!newForm.title.trim()) {
      setStatusError('Title is required.');
      return;
    }
    if (!newThumbFile) {
      setStatusError('Thumbnail is required.');
      return;
    }
    if (!newForm.fullBody.trim()) {
      setStatusError('Description is required.');
      return;
    }
    setIsSavingNew(true);
    try {
      const created = await saveArticle(
        {
          title: newForm.title.trim(),
          body: newForm.fullBody.trim(),
          tags: newForm.tags
        },
        {
          thumbnailFile: newThumbFile,
          galleryFiles: newGalleryFiles,
          videoFile: newVideoFile,
          documentFiles: newDocumentFiles
        }
      );
      addArticle({
        id: created.id,
        title: created.title,
        shortDescription: '',
        fullBody: created.body || '',
        category: created.category || 'Uncategorized',
        thumbnailUrl: created.thumbnailUrl || '',
        mediaUrls: {
          gallery: created.galleryImageUrls || [],
          videos: created.videoUrl ? [created.videoUrl] : []
        },
        documents: created.documentUrls || [],
        isFeatured: !!created.isFeatured,
        tags: created.tags || [],
        createdAt: created.createdAt || null
      });
      setStatusSuccess('Article created.');
      setNewForm({ title: '', fullBody: '', tags: [] });
      setNewThumbFile(null);
      setNewGalleryFiles([]);
      setNewVideoFile(null);
      setNewDocumentFiles([]);
      setTab('manage');
    } catch (e) {
      setStatusError('Failed to create article.');
    } finally {
      setIsSavingNew(false);
    }
  };

  const beginEdit = (article) => {
    resetStatus();
    setEditingArticle(article);
    setEditForm({
      title: article.title || '',
      fullBody: article.fullBody || ''
    });
    setEditTags(article.tags || []);
    setExistingThumbUrl(article.thumbnailUrl || '');
    setEditThumbFile(null);
    setEditGalleryFiles([]);
    setEditVideoFile(null);
    setTab('edit');
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    resetStatus();
    if (!editingArticle) return;
    if (!editForm.title.trim() || !editForm.fullBody.trim()) {
      setStatusError('Title and main body are required.');
      return;
    }
    setIsSavingEdit(true);
    try {
      const meta = {
        title: editForm.title.trim(),
        body: editForm.fullBody.trim(),
        tags: editTags
      };
      const updatedMeta = await updateArticleRemote(editingArticle.id, meta);
      let mediaResp = null;
      if (editThumbFile || (editGalleryFiles && editGalleryFiles.length) || editVideoFile || (editDocumentFiles && editDocumentFiles.length) || clearDocuments) {
        mediaResp = await updateArticleMedia(editingArticle.id, {
          thumbnailFile: editThumbFile,
          galleryFiles: editGalleryFiles,
          videoFile: editVideoFile,
          documentFiles: editDocumentFiles,
          clearGallery: false,
          clearVideo: false,
          clearDocuments
        });
      }
      updateArticle(editingArticle.id, {
        title: (updatedMeta && updatedMeta.title) || meta.title,
        fullBody: (updatedMeta && updatedMeta.body) || meta.body,
        thumbnailUrl: (mediaResp && mediaResp.thumbnailUrl) || (updatedMeta && updatedMeta.thumbnailUrl) || existingThumbUrl,
        tags: (updatedMeta && updatedMeta.tags) || meta.tags,
        mediaUrls: {
          gallery: (mediaResp && mediaResp.galleryImageUrls) || editingArticle.mediaUrls?.gallery || [],
          videos: (mediaResp && mediaResp.videoUrl) ? [mediaResp.videoUrl] : (editingArticle.mediaUrls?.videos || [])
        },
        documents: (mediaResp && mediaResp.documentUrls) || (clearDocuments ? [] : (editingArticle.documents || []))
      });
      setStatusSuccess('Article updated.');
      setEditingArticle(null);
      setTab('manage');
    } catch (e) {
      setStatusError('Failed to update article.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteArticle = async (article) => {
    resetStatus();
    try {
      try {
        await fetch(`/api/articles/${encodeURIComponent(article.id)}`, { method: 'DELETE' });
      } catch (e) {}
      deleteArticle(article.id);
      setStatusSuccess('Article deleted.');
    } catch (e) {
      setStatusError('Failed to delete article.');
    }
  };

  const renderStatus = () => {
    if (statusSuccess) {
      return (
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
      );
    }
    if (statusError) {
      return (
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
      );
    }
    return null;
  };

  const headerTabs = [
    { id: 'manage', label: 'Manage Articles' },
    { id: 'new', label: 'New Article' }
  ];

  const renderTagBadges = (tags) => {
    if (!tags || !tags.length) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {tags.map((id) => {
          const tag = availableTags.find((t) => t.id === id);
          if (!tag) return null;
          return (
            <span
              key={id}
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: tag.color || colors.primary,
                color: 'white',
                fontSize: 10,
                fontWeight: 600
              }}
            >
              {tag.name}
            </span>
          );
        })}
      </div>
    );
  };

  const articlesList = data;

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {headerTabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  resetStatus();
                  setTab(t.id);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: active ? colors.primary : colors.border,
                  background: active ? colors.primary : 'transparent',
                  color: active ? '#fff' : colors.text,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {isLoading && (
          <div style={{ fontSize: 12, color: colors.muted }}>Loading articles…</div>
        )}
        {error && (
          <div style={{ fontSize: 12, color: '#b91c1c' }}>{error}</div>
        )}
      </div>

      {renderStatus()}

      {tab === 'new' && (
        <form
          onSubmit={handleCreateArticle}
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}
        >
          <input
            style={inputStyle}
            placeholder="Title (required)"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
          />
          <textarea
            rows={8}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Description (required)"
            value={newForm.fullBody}
            onChange={(e) => setNewForm({ ...newForm, fullBody: e.target.value })}
          />
          {/* Category removed: sorting is tag-based */}
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, color: colors.muted }}>
              Thumbnail (required, 16:9)
            </div>
            <input
              type="file"
              accept="image/*"
              style={inputStyle}
              onChange={(e) => setNewThumbFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, color: colors.muted }}>
              Gallery images (optional, multiple)
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              style={inputStyle}
              onChange={(e) => setNewGalleryFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, color: colors.muted }}>
              Video file (optional)
            </div>
            <input
              type="file"
              accept="video/*"
              style={inputStyle}
              onChange={(e) => setNewVideoFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, color: colors.muted }}>
              Documents (optional, PDF, multiple)
            </div>
            <input
              type="file"
              accept="application/pdf"
              multiple
              style={inputStyle}
              onChange={(e) => setNewDocumentFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.bg
            }}
          >
            <div
              style={{
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: colors.text
              }}
            >
              Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {loadingTags && (
                <div style={{ fontSize: 12, color: colors.muted }}>Loading tags…</div>
              )}
              {!loadingTags && availableTags.length === 0 && (
                <div style={{ fontSize: 12, color: colors.muted }}>
                  No tags yet. Create them in the Tags tab.
                </div>
              )}
              {availableTags.map((tag) => {
                const selected = newForm.tags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTagForNew(tag.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '2px solid',
                      borderColor: selected ? tag.color : colors.border,
                      background: selected ? tag.color : 'white',
                      color: selected ? 'white' : colors.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4
            }}
          >
            <div />
            <button
              type="submit"
              disabled={isSavingNew}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: 'none',
                background: colors.accent,
                color: '#fff',
                fontWeight: 600,
                cursor: isSavingNew ? 'not-allowed' : 'pointer',
                opacity: isSavingNew ? 0.6 : 1
              }}
            >
              {isSavingNew ? 'Saving…' : 'Create Article'}
            </button>
          </div>
        </form>
      )}

      {tab === 'manage' && (
        <div>
          <div
            className="manage-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12
            }}
          >
            {articlesList.map((a) => (
              <div
                key={a.id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#EEF5FA'
                }}
              >
                {a.thumbnailUrl && (
                  <img
                    src={a.thumbnailUrl}
                    alt={a.title}
                    style={{ width: '100%', display: 'block' }}
                  />
                )}
                <div style={{ padding: '12px 14px' }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.muted,
                      marginBottom: 6
                    }}
                  >
                    {a.category}
                  </div>
                  {renderTagBadges(a.tags)}
                  <strong
                    style={{
                      display: 'block',
                      color: colors.dark,
                      marginBottom: 4
                    }}
                  >
                    {a.title}
                  </strong>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {(a.fullBody || '').slice(0, 120)}{(a.fullBody || '').length > 120 ? '…' : ''}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 8
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={featuredIds.includes(a.id)}
                        onChange={() => handleToggleFeatured(a.id)}
                      />
                      <span>Featured</span>
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => beginEdit(a)}
                        style={{
                          padding: '8px 10px',
                          background: colors.primary,
                          border: 'none',
                          color: '#fff',
                          borderRadius: 10,
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(a)}
                        style={{
                          padding: '8px 10px',
                          background: '#fee2e2',
                          border: 'none',
                          color: '#b91c1c',
                          borderRadius: 10,
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            @media (max-width: 1024px) { .manage-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 640px) { .manage-grid { grid-template-columns: minmax(0, 1fr); } }
          `}</style>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: colors.muted
            }}
          >
            Featured limit: {featuredIds.length}/3
          </div>
        </div>
      )}

      {tab === 'edit' && editingArticle && (
        <form
          onSubmit={handleSaveEdit}
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 8 }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.dark
            }}
          >
            Editing: {editingArticle.title}
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.bg
            }}
          >
            <div
              style={{
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: colors.text
              }}
            >
              Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableTags.map((tag) => {
                const selected = editTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTagForEdit(tag.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '2px solid',
                      borderColor: selected ? tag.color : colors.border,
                      background: selected ? tag.color : 'white',
                      color: selected ? 'white' : colors.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
              {availableTags.length === 0 && (
                <div style={{ fontSize: 13, color: colors.muted }}>
                  No tags available.
                </div>
              )}
            </div>
          </div>
          <input
            style={inputStyle}
            placeholder="Title (required)"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <textarea
            rows={8}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Main article body (required)"
            value={editForm.fullBody}
            onChange={(e) => setEditForm({ ...editForm, fullBody: e.target.value })}
          />
          {/* Category is not editable here; it defaults on backend */}
          <div>
            <div style={{ display: 'block', marginBottom: 6, color: colors.muted, fontSize: 13 }}>
              Thumbnail (required, 16:9)
            </div>
            <input
              type="file"
              accept="image/*"
              style={inputStyle}
              onChange={(e) => setEditThumbFile(e.target.files ? e.target.files[0] : null)}
            />
            {!existingThumbUrl && !editThumbFile && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444' }}>
                A thumbnail is required.
              </div>
            )}
            {existingThumbUrl && (
              <div style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
                Current thumbnail is in use.
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'block', marginBottom: 6, color: colors.muted, fontSize: 13 }}>
              Gallery images (multiple)
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              style={inputStyle}
              onChange={(e) => setEditGalleryFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
          </div>
          <div>
            <div style={{ display: 'block', marginBottom: 6, color: colors.muted, fontSize: 13 }}>
              Video (optional)
            </div>
            <input
              type="file"
              accept="video/*"
              style={inputStyle}
              onChange={(e) => setEditVideoFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div>
            <div style={{ display: 'block', marginBottom: 6, color: colors.muted, fontSize: 13 }}>
              Documents (optional, PDF only, multiple)
            </div>
            <input
              type="file"
              accept="application/pdf"
              multiple
              style={inputStyle}
              onChange={(e) => setEditDocumentFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
              <input type="checkbox" checked={clearDocuments} onChange={(e) => setClearDocuments(e.target.checked)} />
              Clear existing documents
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={isSavingEdit}
              style={{
                padding: '10px 14px',
                background: colors.accent,
                border: 'none',
                color: '#fff',
                borderRadius: 999,
                boxShadow: '0 10px 24px rgba(254,119,67,0.25)',
                cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                opacity: isSavingEdit ? 0.6 : 1
              }}
            >
              {isSavingEdit ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isSavingEdit) return;
                setEditingArticle(null);
                setTab('manage');
              }}
              style={{
                padding: '10px 14px',
                background: '#e2e8f0',
                border: 'none',
                color: colors.text,
                borderRadius: 999,
                cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                opacity: isSavingEdit ? 0.6 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ArticlesSection;
