const BASE_URL = '/api';

export const fetchTeam = async () => {
  const res = await fetch(`${BASE_URL}/team`);
  if (!res.ok) throw new Error('Failed to fetch team');
  return res.json();
};

export const createTeamMember = async (data) => {
  const res = await fetch(`${BASE_URL}/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create team member');
  return res.json();
};

export const updateTeamMember = async (id, data) => {
  const res = await fetch(`${BASE_URL}/team/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update team member');
  return res.json();
};

export const deleteTeamMember = async (id) => {
  const res = await fetch(`${BASE_URL}/team/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete team member');
  return res.json();
};

export const updateTeamOrder = async (orderedIds) => {
  const res = await fetch(`${BASE_URL}/team/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to update team order');
  return res.json();
};
