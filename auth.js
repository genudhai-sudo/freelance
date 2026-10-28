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
  if (!response.ok) throw new Error(body.error || 'The local API request failed.');
  return body;
}

function saveSession(result) {
  localStorage.setItem(TOKEN_KEY, result.accessToken);
  return { data: { user: result.user, session: { access_token: result.accessToken, expires_at: result.expiresAt } }, error: null };
}

export async function signUp({ fullName, email, password }) {
  return saveSession(await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  }));
}

export async function signIn({ email, password }) {
  return saveSession(await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }));
}

export async function requestPasswordReset(email) {
  return request('/auth/password-reset', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function updatePassword({ password, resetToken }) {
  const result = await request('/auth/password', { method: 'PUT', body: JSON.stringify({ password, resetToken }) });
  localStorage.removeItem(TOKEN_KEY);
  return result;
}

export async function signOut() {
  try { await request('/auth/logout', { method: 'POST' }); }
  finally { localStorage.removeItem(TOKEN_KEY); }
}

export async function getCurrentUser() {
  try { return (await request('/auth/me')).user; }
  catch (error) {
    if (error.message === 'Sign in to continue.') localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}
