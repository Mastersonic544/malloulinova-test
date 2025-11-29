// Tag management service
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchTags = async () => {
  const res = await fetch(`${BASE_URL}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
};

export const createTag = async (tagData) => {
  const res = await fetch(`${BASE_URL}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData)
  });
  if (!res.ok) throw new Error('Failed to create tag');
  return res.json();
};

export const updateTag = async (id, tagData) => {
  const res = await fetch(`${BASE_URL}/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData)
  });
  if (!res.ok) throw new Error('Failed to update tag');
  return res.json();
};

export const deleteTag = async (id) => {
  const res = await fetch(`${BASE_URL}/tags/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete tag');
  return res.json();
};
