const BASE_URL = '/api';

export const fetchTechnologies = async () => {
  const res = await fetch(`${BASE_URL}/technologies`);
  if (!res.ok) throw new Error('Failed to fetch technologies');
  return res.json();
};

export const createTechnology = async (data) => {
  const res = await fetch(`${BASE_URL}/technologies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create technology');
  return res.json();
};

export const updateTechnology = async (id, data) => {
  const res = await fetch(`${BASE_URL}/technologies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update technology');
  return res.json();
};

export const deleteTechnology = async (id) => {
  const res = await fetch(`${BASE_URL}/technologies/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete technology');
  return res.json();
};

export const updateTechnologiesOrder = async (orderedIds) => {
  const res = await fetch(`${BASE_URL}/technologies/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to update technologies order');
  return res.json();
};
