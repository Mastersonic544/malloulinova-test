const BASE_URL = '/api';

export const fetchPartners = async () => {
  const res = await fetch(`${BASE_URL}/partners`);
  if (!res.ok) throw new Error('Failed to fetch partners');
  return res.json();
};

export const createPartner = async (data) => {
  const res = await fetch(`${BASE_URL}/partners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create partner');
  return res.json();
};

export const updatePartner = async (id, data) => {
  const res = await fetch(`${BASE_URL}/partners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update partner');
  return res.json();
};

export const deletePartner = async (id) => {
  const res = await fetch(`${BASE_URL}/partners/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete partner');
  return res.json();
};

export const updatePartnerOrder = async (orderedIds) => {
  const res = await fetch(`${BASE_URL}/partners/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to update partners order');
  return res.json();
};
