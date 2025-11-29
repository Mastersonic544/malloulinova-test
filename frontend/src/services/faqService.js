const BASE_URL = '/api';

export const fetchFaqs = async () => {
  const res = await fetch(`${BASE_URL}/faqs`);
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
};

export const createFaq = async (faqData) => {
  const res = await fetch(`${BASE_URL}/faqs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faqData),
  });
  if (!res.ok) throw new Error('Failed to create FAQ');
  return res.json();
};

export const updateFaq = async (id, faqData) => {
  const res = await fetch(`${BASE_URL}/faqs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faqData),
  });
  if (!res.ok) throw new Error('Failed to update FAQ');
  return res.json();
};

export const deleteFaq = async (id) => {
  const res = await fetch(`${BASE_URL}/faqs/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete FAQ');
  return res.json();
};

export const updateFaqOrder = async (orderedIds) => {
  const res = await fetch(`${BASE_URL}/faqs/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to update FAQ order');
  return res.json();
};
