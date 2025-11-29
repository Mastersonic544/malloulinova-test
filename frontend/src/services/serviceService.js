const BASE_URL = '/api';

export const fetchServices = async () => {
  const res = await fetch(`${BASE_URL}/services`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
};

export const createService = async (data) => {
  const res = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create service');
  return res.json();
};

export const updateService = async (id, data) => {
  const res = await fetch(`${BASE_URL}/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update service');
  return res.json();
};

export const deleteService = async (id) => {
  const res = await fetch(`${BASE_URL}/services/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete service');
  return res.json();
};

export const updateServicesOrder = async (orderedIds) => {
  const res = await fetch(`${BASE_URL}/services/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to update services order');
  return res.json();
};
