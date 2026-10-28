import { createServer } from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(root, 'data', 'kiptalent.sqlite');
mkdirSync(dirname(dataPath), { recursive: true });

const db = new DatabaseSync(dataPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    budget REAL NOT NULL,
    skills TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    source TEXT NOT NULL DEFAULT 'member' CHECK (source IN ('member', 'featured')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    bid_amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, freelancer_id)
  );
  CREATE TABLE IF NOT EXISTS freelancer_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    bio TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    hourly_rate REAL NOT NULL,
    skills TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Keep the landing page's featured marketplace cards in SQLite so they use the
// same profile and proposal APIs as member-created content.
if (!db.prepare('PRAGMA table_info(projects)').all().some((column) => column.name === 'source')) {
  db.exec("ALTER TABLE projects ADD COLUMN source TEXT NOT NULL DEFAULT 'member'");
}
if (!db.prepare('PRAGMA table_info(users)').all().some((column) => column.name === 'is_system')) {
  db.exec('ALTER TABLE users ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0');
}

const passwordHash = (password, salt) => scryptSync(password, salt, 64).toString('hex');
function seedMarketplaceAccount(id, fullName) {
  const salt = randomBytes(16).toString('hex');
  const email = `${id.replaceAll(':', '-') }@kiptalent.local`;
  db.prepare('INSERT OR IGNORE INTO users (id, full_name, email, password_salt, password_hash, is_system) VALUES (?, ?, ?, ?, ?, 1)')
    .run(id, fullName, email, salt, passwordHash(randomBytes(32).toString('hex'), salt));
}

const featuredProfiles = [
  ['Alex Morgan', 'Full Stack Developer', 'New York, USA', 45, ['React', 'Node.js', 'TypeScript'], 'I build fast, reliable web products from interface through API, with a focus on accessible and maintainable code.'],
  ['Sofia Chen', 'Senior UI/UX & Design Systems', 'Toronto, Canada', 65, ['Figma', 'Design Systems', 'Mobile UX'], 'I turn complex product workflows into clear interfaces and scalable design systems for web and mobile teams.'],
  ['Marcus Vance', 'Brand Identity & 3D Artist', 'London, UK', 55, ['Blender', 'Logo Design', 'Vector Art'], 'I create distinctive visual identities, polished 3D artwork, and production-ready brand assets.'],
  ['Amara Patel', 'Mobile Engineer (Flutter & Swift)', 'Bengaluru, India', 40, ['Flutter', 'Swift', 'Firebase'], 'I develop cross-platform mobile apps with thoughtful interactions, stable integrations, and clean architecture.'],
  ['Lucas Ribeiro', 'Motion Designer & Video Editor', 'São Paulo, Brazil', 50, ['After Effects', 'Premiere Pro', '3D Motion'], 'I edit social and product videos and create motion graphics built for clear storytelling across formats.'],
  ['Elena Rostova', 'Technical Writer & SEO Strategist', 'Berlin, Germany', 48, ['Content Strategy', 'SEO', 'Ghostwriting'], 'I write useful technical and search-focused content that makes complex topics easy for customers to understand.'],
];

featuredProfiles.forEach(([name, headline, location, hourlyRate, skills, bio], index) => {
  const id = `featured:freelancer:${index + 1}`;
  seedMarketplaceAccount(id, name);
  db.prepare(`INSERT OR IGNORE INTO freelancer_profiles (user_id, headline, bio, location, hourly_rate, skills)
    VALUES (?, ?, ?, ?, ?, ?)`).run(id, headline, bio, location, hourlyRate, JSON.stringify(skills));
});

const featuredProjects = [
  ['SaaS Marketing & Web App', 'React & Next.js', 'Build a modern SaaS marketing website and web app from the supplied Figma designs. Include accessible responsive layouts and connect the main screens to the API.', 2500, ['React', 'Next.js', 'Tailwind CSS']],
  ['Rebrand & Complete Visual Identity System', 'Branding', 'Create a complete visual identity for a growing company, including logo guidelines, typography, color system, and a reusable set of brand assets.', 1500, ['Figma', 'Brand Guidelines', 'Typography']],
  ['Native iOS & Android Fitness Tracker App', 'Mobile App', 'Build a cross-platform fitness application and connect it with Apple HealthKit and Google Fit. Include onboarding, activity tracking, and clear progress views.', 5500, ['Flutter', 'REST API', 'HealthKit']],
  ['Product Explainer 3D Animation & Motion Video', '3D & Motion', 'Create a polished 60-second 3D product showcase that explains the hardware and key product benefits, with sound design and final social-ready exports.', 1800, ['Blender', 'After Effects', 'Sound Design']],
  ['High-Converting B2B Tech Content & Whitepaper', 'Copywriting', 'Research and write an authoritative cybersecurity whitepaper for enterprise buyers, with a clear structure, source citations, and a concise executive summary.', 1100, ['SEO Copywriting', 'Tech Writing', 'Research']],
  ['E-Commerce Performance Optimization & Custom Checkout', 'E-Commerce', 'Improve storefront Core Web Vitals and implement custom bundle checkout logic. Include before-and-after performance notes and a maintainable handoff.', 3000, ['Shopify Plus', 'Liquid', 'JavaScript']],
];

seedMarketplaceAccount('featured:project:client', 'KipTalent Featured Client');
featuredProjects.forEach(([title, category, description, budget, skills], index) => {
  db.prepare(`INSERT OR IGNORE INTO projects (id, client_id, title, category, description, budget, skills, source)
    VALUES (?, 'featured:project:client', ?, ?, ?, ?, ?, 'featured')`)
    .run(`featured:project:${index + 1}`, title, category, description, budget, JSON.stringify(skills));
});

const findUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const findUserById = db.prepare('SELECT id, full_name, email FROM users WHERE id = ?');
const findSession = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?');
const addUser = db.prepare('INSERT INTO users (id, full_name, email, password_salt, password_hash) VALUES (?, ?, ?, ?, ?)');
const addSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
const deleteExpiredSessions = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (user) => ({ id: user.id, fullName: user.full_name, email: user.email });

function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  addSession.run(hashToken(token), userId, expiresAt);
  return { accessToken: token, expiresAt };
}

function readJson(req) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16_384) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolveBody(body ? JSON.parse(body) : {}); }
      catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function authenticatedUser(req) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = findSession.get(tokenHash);
  if (!session || session.expires_at <= Date.now()) {
    deleteSession.run(tokenHash);
    return null;
  }
  return findUserById.get(session.user_id) ?? null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true, database: 'sqlite' });
    }

    if (req.method === 'GET' && url.pathname === '/api/stats') {
      const count = (sql) => db.prepare(sql).get().count;
      return send(res, 200, {
        members: count('SELECT COUNT(*) AS count FROM users WHERE is_system = 0'),
        openProjects: count("SELECT COUNT(*) AS count FROM projects WHERE status = 'open'"),
        freelancerProfiles: count('SELECT COUNT(*) AS count FROM freelancer_profiles'),
        proposals: count('SELECT COUNT(*) AS count FROM proposals'),
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const viewer = authenticatedUser(req);
      const rows = db.prepare(`SELECT p.id, p.title, p.category, p.description, p.budget, p.skills, p.status, p.source, p.created_at,
        CASE WHEN p.source = 'featured' THEN 'Featured client' ELSE u.full_name END AS client_name,
        CASE WHEN p.client_id = ? THEN 1 ELSE 0 END AS is_owner,
        (SELECT COUNT(*) FROM proposals pr WHERE pr.project_id = p.id) AS proposals
        FROM projects p JOIN users u ON u.id = p.client_id WHERE p.status = 'open' ORDER BY p.created_at DESC LIMIT 100`).all(viewer?.id ?? '');
      return send(res, 200, { projects: rows.map((p) => ({ ...p, skills: JSON.parse(p.skills) })) });
    }

    const proposalsMatch = decodeURIComponent(url.pathname).match(/^\/api\/projects\/([\w:-]+)\/proposals$/);
    if (req.method === 'GET' && proposalsMatch) {
      const user = authenticatedUser(req);
      if (!user) return send(res, 401, { error: 'Sign in to view project proposals.' });
      const project = db.prepare('SELECT id, client_id FROM projects WHERE id = ?').get(proposalsMatch[1]);
      if (!project) return send(res, 404, { error: 'Project not found.' });
      if (project.client_id !== user.id) return send(res, 403, { error: 'Only the project owner can view its proposals.' });
      const rows = db.prepare(`SELECT p.id, p.cover_letter AS coverLetter, p.bid_amount AS bidAmount, p.created_at AS createdAt,
        u.full_name AS freelancerName, f.headline, f.location, f.skills
        FROM proposals p JOIN users u ON u.id = p.freelancer_id
        LEFT JOIN freelancer_profiles f ON f.user_id = u.id
        WHERE p.project_id = ? ORDER BY p.created_at DESC`).all(project.id);
      return send(res, 200, { proposals: rows.map((p) => ({ ...p, skills: p.skills ? JSON.parse(p.skills) : [] })) });
    }

    if (req.method === 'GET' && url.pathname === '/api/freelancers') {
      const profiles = db.prepare(`SELECT u.id, u.full_name AS name, f.headline AS role, f.bio, f.location,
        f.hourly_rate AS rate, f.skills, f.updated_at FROM freelancer_profiles f
        JOIN users u ON u.id = f.user_id ORDER BY f.updated_at DESC LIMIT 100`).all();
      return send(res, 200, { freelancers: profiles.map((p) => ({ ...p, skills: JSON.parse(p.skills) })) });
    }

    if (req.method === 'GET' && url.pathname === '/api/profile') {
      const user = authenticatedUser(req);
      if (!user) return send(res, 401, { error: 'Sign in to manage your profile.' });
      const profile = db.prepare('SELECT headline, bio, location, hourly_rate AS hourlyRate, skills FROM freelancer_profiles WHERE user_id = ?').get(user.id);
      return send(res, 200, { user: publicUser(user), profile: profile ? { ...profile, skills: JSON.parse(profile.skills) } : null });
    }

    if (req.method === 'PUT' && url.pathname === '/api/profile') {
      const user = authenticatedUser(req);
      if (!user) return send(res, 401, { error: 'Sign in to manage your profile.' });
      const { headline, bio, location = '', hourlyRate, skills = [] } = await readJson(req);
      const cleanHeadline = String(headline ?? '').trim();
      const cleanBio = String(bio ?? '').trim();
      const cleanLocation = String(location ?? '').trim();
      const rate = Number(hourlyRate);
      const cleanSkills = Array.isArray(skills) ? skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 15) : [];
      if (cleanHeadline.length < 3 || cleanHeadline.length > 100) return send(res, 400, { error: 'Profile headline must be 3–100 characters.' });
      if (cleanBio.length < 20 || cleanBio.length > 2000) return send(res, 400, { error: 'Profile bio must be 20–2000 characters.' });
      if (cleanLocation.length > 100) return send(res, 400, { error: 'Location must be 100 characters or fewer.' });
      if (!Number.isFinite(rate) || rate < 1 || rate > 100000) return send(res, 400, { error: 'Enter a valid hourly rate.' });
      if (!cleanSkills.length) return send(res, 400, { error: 'Add at least one skill.' });
      db.prepare(`INSERT INTO freelancer_profiles (user_id, headline, bio, location, hourly_rate, skills, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET headline = excluded.headline, bio = excluded.bio,
          location = excluded.location, hourly_rate = excluded.hourly_rate, skills = excluded.skills, updated_at = CURRENT_TIMESTAMP`)
        .run(user.id, cleanHeadline, cleanBio, cleanLocation, rate, JSON.stringify(cleanSkills));
      return send(res, 200, { profile: { headline: cleanHeadline, bio: cleanBio, location: cleanLocation, hourlyRate: rate, skills: cleanSkills } });
    }

    if (req.method === 'POST' && url.pathname === '/api/projects') {
      const user = authenticatedUser(req);
      if (!user) return send(res, 401, { error: 'Sign in to post a project.' });
      const { title, category, description, budget, skills = [] } = await readJson(req);
      const cleanTitle = String(title ?? '').trim();
      const cleanCategory = String(category ?? '').trim();
      const cleanDescription = String(description ?? '').trim();
      const amount = Number(budget);
      const cleanSkills = Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 12) : [];
      if (cleanTitle.length < 5 || cleanTitle.length > 120) return send(res, 400, { error: 'Project title must be 5–120 characters.' });
      if (!cleanCategory || cleanCategory.length > 80) return send(res, 400, { error: 'Choose a project category.' });
      if (cleanDescription.length < 20 || cleanDescription.length > 5000) return send(res, 400, { error: 'Project description must be 20–5000 characters.' });
      if (!Number.isFinite(amount) || amount < 1 || amount > 10000000) return send(res, 400, { error: 'Enter a valid budget.' });
      const id = randomUUID();
      db.prepare('INSERT INTO projects (id, client_id, title, category, description, budget, skills) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, user.id, cleanTitle, cleanCategory, cleanDescription, amount, JSON.stringify(cleanSkills));
      return send(res, 201, { project: { id, title: cleanTitle, category: cleanCategory, description: cleanDescription, budget: amount, skills: cleanSkills, status: 'open', source: 'member', is_owner: 1, client_name: user.full_name, proposals: 0 } });
    }

    const proposalMatch = decodeURIComponent(url.pathname).match(/^\/api\/projects\/([\w:-]+)\/proposals$/);
    if (req.method === 'POST' && proposalMatch) {
      const user = authenticatedUser(req);
      if (!user) return send(res, 401, { error: 'Sign in to submit a proposal.' });
      const project = db.prepare('SELECT id, client_id, status FROM projects WHERE id = ?').get(proposalMatch[1]);
      if (!project || project.status !== 'open') return send(res, 404, { error: 'This project is no longer available.' });
      if (project.client_id === user.id) return send(res, 403, { error: 'You cannot submit a proposal to your own project.' });
      const { coverLetter, bidAmount } = await readJson(req);
      const message = String(coverLetter ?? '').trim();
      const amount = Number(bidAmount);
      if (message.length < 20 || message.length > 3000) return send(res, 400, { error: 'Proposal message must be 20–3000 characters.' });
      if (!Number.isFinite(amount) || amount < 1 || amount > 10000000) return send(res, 400, { error: 'Enter a valid proposed amount.' });
      try {
        const id = randomUUID();
        db.prepare('INSERT INTO proposals (id, project_id, freelancer_id, cover_letter, bid_amount) VALUES (?, ?, ?, ?, ?)').run(id, project.id, user.id, message, amount);
        return send(res, 201, { proposal: { id } });
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return send(res, 409, { error: 'You have already submitted a proposal for this project.' });
        throw error;
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/preview') {
      const users = db.prepare('SELECT full_name, email, created_at FROM users WHERE is_system = 0 ORDER BY created_at DESC').all();
      const rows = users.map((user) => `<tr><td>${escapeHtml(user.full_name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.created_at)}</td></tr>`).join('');
      const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Local SQLite data</title><style>body{font:15px system-ui,sans-serif;max-width:960px;margin:48px auto;padding:0 20px;color:#172b27;background:#f5f8f7}h1{margin-bottom:6px}.muted{color:#5d706a}table{width:100%;border-collapse:collapse;background:white;border:1px solid #dce6e2;border-radius:12px;overflow:hidden;margin-top:22px}th,td{text-align:left;padding:14px 16px;border-bottom:1px solid #e7eeeb}th{background:#e8f3f0;font-size:13px}tr:last-child td{border-bottom:0}.count{display:inline-block;padding:7px 11px;background:#dff4ed;border-radius:20px;font-weight:650}.empty{padding:18px;background:white;border-radius:10px}</style><h1>Local SQLite accounts</h1><p class="muted">This preview reads from data/kiptalent.sqlite on this computer.</p><p class="count">${users.length} account${users.length === 1 ? '' : 's'}</p>${users.length ? `<table><thead><tr><th>Name</th><th>Email</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="empty">No accounts yet. Create one using Sign Up in the app.</p>'}<p class="muted">Passwords and session tokens are never shown here.</p></html>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(html);
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
      const { fullName, email, password } = await readJson(req);
      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      const normalizedName = String(fullName ?? '').trim();
      if (!normalizedName || normalizedName.length > 120) return send(res, 400, { error: 'Enter your name (up to 120 characters).' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) return send(res, 400, { error: 'Enter a valid email address.' });
      if (typeof password !== 'string' || password.length < 8 || password.length > 256) return send(res, 400, { error: 'Password must be between 8 and 256 characters.' });
      if (findUserByEmail.get(normalizedEmail)) return send(res, 409, { error: 'An account with this email already exists.' });

      const id = randomUUID();
      const salt = randomBytes(16).toString('hex');
      addUser.run(id, normalizedName, normalizedEmail, salt, passwordHash(password, salt));
      deleteExpiredSessions.run(Date.now());
      const user = findUserById.get(id);
      return send(res, 201, { user: publicUser(user), ...createSession(id) });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const { email, password } = await readJson(req);
      const user = findUserByEmail.get(String(email ?? '').trim().toLowerCase());
      if (!user || user.is_system || typeof password !== 'string') return send(res, 401, { error: 'Email or password is incorrect.' });
      const candidate = Buffer.from(passwordHash(password, user.password_salt), 'hex');
      const stored = Buffer.from(user.password_hash, 'hex');
      if (candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) return send(res, 401, { error: 'Email or password is incorrect.' });
      deleteExpiredSessions.run(Date.now());
      return send(res, 200, { user: publicUser(user), ...createSession(user.id) });
    }

    if (req.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = authenticatedUser(req);
      return user ? send(res, 200, { user: publicUser(user) }) : send(res, 401, { error: 'Sign in to continue.' });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (token) deleteSession.run(hashToken(token));
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset') {
      const { email } = await readJson(req);
      const user = findUserByEmail.get(String(email ?? '').trim().toLowerCase());
      db.prepare('DELETE FROM password_resets WHERE expires_at <= ?').run(Date.now());
      if (user) {
        const token = randomBytes(32).toString('base64url');
        db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
        db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
          .run(hashToken(token), user.id, Date.now() + 15 * 60 * 1000);
        console.log(`\nLocal password reset token (expires in 15 minutes): ${token}\n`);
      }
      return send(res, 200, { ok: true, message: 'If an account exists, a reset token was printed in the terminal running the local API.' });
    }

    if (req.method === 'PUT' && url.pathname === '/api/auth/password') {
      const { password, resetToken } = await readJson(req);
      if (typeof password !== 'string' || password.length < 8 || password.length > 256) return send(res, 400, { error: 'Password must be between 8 and 256 characters.' });
      if (typeof resetToken !== 'string' || !resetToken) return send(res, 400, { error: 'Enter the reset token printed in the local API terminal.' });
      const tokenHash = hashToken(resetToken.trim());
      const reset = db.prepare('SELECT user_id, expires_at FROM password_resets WHERE token_hash = ?').get(tokenHash);
      if (!reset || reset.expires_at <= Date.now()) {
        db.prepare('DELETE FROM password_resets WHERE token_hash = ?').run(tokenHash);
        return send(res, 400, { error: 'That reset token is invalid or expired. Request a new one.' });
      }
      const salt = randomBytes(16).toString('hex');
      db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, passwordHash(password, salt), reset.user_id);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(reset.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(reset.user_id);
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: 'API route not found.' });
  } catch (error) {
    if (!res.headersSent && !res.destroyed) {
      const status = error.status ?? (error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : 500);
      send(res, status, { error: status === 500 ? 'The local API could not complete the request.' : error.message });
    }
  }
});

const port = Number(process.env.API_PORT || 3001);
server.listen(port, '127.0.0.1', () => console.log(`SQLite API ready at http://127.0.0.1:${port}`));

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
