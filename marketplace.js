const TOKEN_KEY = 'kiptalent_api_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The marketplace request failed.');
  return body;
}

export async function getProjects() {
  return (await request('/projects')).projects;
}

export async function getMarketplaceStats() {
  return request('/stats');
}

export async function getFreelancers() {
  return (await request('/freelancers')).freelancers;
}

export async function getMyProfile() {
  return request('/profile');
}

export async function saveMyProfile(profile) {
  return request('/profile', { method: 'PUT', body: JSON.stringify(profile) });
}

export async function createProject(project) {
  return (await request('/projects', { method: 'POST', body: JSON.stringify(project) })).project;
}

export async function submitProposal(projectId, proposal) {
  return request(`/projects/${encodeURIComponent(projectId)}/proposals`, {
    method: 'POST',
    body: JSON.stringify(proposal),
  });
}

export async function getProjectProposals(projectId) {
  return (await request(`/projects/${encodeURIComponent(projectId)}/proposals`)).proposals;
}
