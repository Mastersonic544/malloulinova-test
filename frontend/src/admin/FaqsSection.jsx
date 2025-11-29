import React, { useEffect, useState } from 'react';
import { fetchFaqs, createFaq, updateFaq, deleteFaq, updateFaqOrder } from '../services/faqService.js';

const FaqsSection = ({ colors }) => {
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [editingFaq, setEditingFaq] = useState(null);
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

  const loadFaqs = async () => {
    resetStatus();
    try {
      setLoading(true);
      const list = await fetchFaqs();
      setFaqs(Array.isArray(list) ? list : []);
    } catch (e) {
      setFaqs([]);
      setStatusError('Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const sortedFaqs = [...faqs].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const handleCreateFaq = async () => {
    resetStatus();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      setStatusError('Question and answer are required.');
      return;
    }
    try {
      const created = await createFaq({
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim()
      });
      setFaqs((prev) => [...prev, created]);
      setFaqForm({ question: '', answer: '' });
      setStatusSuccess('FAQ created.');
    } catch (e) {
      setStatusError('Failed to create FAQ.');
    }
  };

  const handleUpdateFaq = async (id) => {
    resetStatus();
    if (!editingFaq || editingFaq.id !== id) return;
    if (!editingFaq.question.trim() || !editingFaq.answer.trim()) {
      setStatusError('Question and answer are required.');
      return;
    }
    try {
      const updated = await updateFaq(id, {
        question: editingFaq.question.trim(),
        answer: editingFaq.answer.trim()
      });
      setFaqs((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingFaq(null);
      setStatusSuccess('FAQ updated.');
    } catch (e) {
      setStatusError('Failed to update FAQ.');
    }
  };

  const handleDeleteFaq = async (id) => {
    resetStatus();
    try {
      await deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      setStatusSuccess('FAQ deleted.');
    } catch (e) {
      setStatusError('Failed to delete FAQ.');
    }
  };

  const moveFaq = async (id, direction) => {
    resetStatus();
    const sorted = [...faqs].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    const index = sorted.findIndex((f) => f.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const orderedIds = reordered.map((f) => f.id);
    setFaqs(reordered);
    try {
      await updateFaqOrder(orderedIds);
      setStatusSuccess('FAQ order updated.');
    } catch (e) {
      setStatusError('Failed to update FAQ order.');
      loadFaqs();
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
      <h3 style={{ marginTop: 0, color: colors.dark }}>Manage FAQs</h3>

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
            {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Question"
              value={editingFaq ? editingFaq.question : faqForm.question}
              onChange={(e) =>
                editingFaq
                  ? setEditingFaq({ ...editingFaq, question: e.target.value })
                  : setFaqForm({ ...faqForm, question: e.target.value })
              }
              style={inputStyle}
            />
            <textarea
              rows={5}
              placeholder="Answer"
              value={editingFaq ? editingFaq.answer : faqForm.answer}
              onChange={(e) =>
                editingFaq
                  ? setEditingFaq({ ...editingFaq, answer: e.target.value })
                  : setFaqForm({ ...faqForm, answer: e.target.value })
              }
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              {editingFaq ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateFaq(editingFaq.id)}
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
                    onClick={() => setEditingFaq(null)}
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
                  onClick={handleCreateFaq}
                  style={{
                    padding: '10px 14px',
                    background: colors.accent,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 999,
                    cursor: 'pointer'
                  }}
                >
                  Add FAQ
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ marginTop: 0, color: colors.dark }}>Existing FAQs</h4>
          {loading && (
            <div style={{ fontSize: 13, color: colors.muted }}>Loading…</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedFaqs.map((faq, idx) => (
              <div
                key={faq.id}
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
                <div>
                  <strong style={{ color: colors.dark }}>{faq.question}</strong>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      margin: '4px 0 0'
                    }}
                  >
                    {faq.answer}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => moveFaq(faq.id, 'up')}
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
                      onClick={() => moveFaq(faq.id, 'down')}
                      disabled={idx === sortedFaqs.length - 1}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5f5',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: 10,
                        cursor:
                          idx === sortedFaqs.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: idx === sortedFaqs.length - 1 ? 0.4 : 1
                      }}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingFaq(faq)}
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
                    onClick={() => handleDeleteFaq(faq.id)}
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
            {sortedFaqs.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: colors.muted }}>
                No FAQs yet. Add your first FAQ on the left.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqsSection;
