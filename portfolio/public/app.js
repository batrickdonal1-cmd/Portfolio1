const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.json(); });

const ICONS = {
  github: '<path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/>',
  twitter: '<path d="M18.9 2H22l-7.2 8.2L23.3 22h-6.7l-5.2-6.8L5.4 22H2.3l7.7-8.8L1.9 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z"/>',
  linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.09V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.32-1.96 2.69V21h-4V9.5Z"/>',
  mail: '<path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13Zm2.2.5L12 12.2 19.8 6H4.2Z"/>',
  resume: '<path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM8 13h8v1.5H8V13Zm0 3.5h8V18H8v-1.5Z"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

const GRADIENTS = [
  ['#6a5cff', '#c46bd1'], ['#1fa2a6', '#3f6fe0'], ['#e8865a', '#c2427a'], ['#3e8f5a', '#a6c04a'],
  ['#7a5af8', '#2fb8e8'], ['#d1556b', '#e8b25a']
];

async function init() {
  // ----- profile -----
  const p = await get('/api/profile').catch(() => null);
  if (p) {
    document.title = `${p.name} | Portfolio`;
    $('name').textContent = p.name;
    $('tagline').textContent = p.tagline;
    $('role').textContent = `${p.age} • ${p.role}`;
    $('bio').innerHTML = esc(p.bio).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    $('avatar').textContent = (p.name || '?').trim()[0].toUpperCase();
    $('copy').textContent = `© ${new Date().getFullYear()} ${p.name}.`;

    const s = p.socials;
    $('icons').innerHTML = ['github', 'twitter', 'linkedin']
      .map(k => `<a href="${esc(s[k])}" target="_blank" rel="noopener" aria-label="${k}">${icon(k)}</a>`).join('');
    $('pills').innerHTML =
      ['github', 'twitter', 'linkedin'].map(k => `<a href="${esc(s[k])}" target="_blank" rel="noopener">${icon(k)}${k[0].toUpperCase() + k.slice(1)}</a>`).join('') +
      `<a href="mailto:${esc(p.email)}">${icon('mail')}Mail</a>` +
      `<a href="${esc(s.resume)}">${icon('resume')}Resume</a>`;
    $('chips').innerHTML = p.stack.map(t => `<li>${esc(t)}</li>`).join('');

    $('ghTitle').textContent = `GitHub contributions · @${p.github}`;
    const img = new Image();
    img.alt = `GitHub contribution graph for ${p.github}`;
    img.src = `https://ghchart.rshah.org/46d17a/${encodeURIComponent(p.github)}`;
    img.onload = () => { $('gh').innerHTML = ''; $('gh').appendChild(img); };
    img.onerror = () => { $('gh').innerHTML = `<p>Contribution graph unavailable. <a href="${esc(s.github)}" target="_blank" rel="noopener">View on GitHub</a></p>`; };
    $('gh').innerHTML = '<p class="empty">Loading graph…</p>';
  }

  // ----- projects -----
  get('/api/projects').then(list => {
    $('projectGrid').innerHTML = list.length ? list.map((pr, i) => {
      const [a, b] = GRADIENTS[i % GRADIENTS.length];
      const links = [
        pr.live && pr.live !== '#' ? `<a href="${esc(pr.live)}" target="_blank" rel="noopener">Live site</a>` : '',
        pr.repo && pr.repo !== '#' ? `<a href="${esc(pr.repo)}" target="_blank" rel="noopener">Source</a>` : ''
      ].join('');
      return `<article class="card">
        <div class="thumb" style="background:linear-gradient(135deg,${a},${b})">${esc(pr.title[0])}</div>
        <h3>${esc(pr.title)}</h3>
        <p>${esc(pr.description)}</p>
        <ul class="tags">${pr.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        ${links ? `<div class="links">${links}</div>` : ''}
      </article>`;
    }).join('') : '<p class="empty">No projects yet. Add one to data/profile.json.</p>';
  }).catch(() => $('projectGrid').innerHTML = '<p class="empty">Could not load projects. Refresh to try again.</p>');

  // ----- learning -----
  get('/api/learning').then(list => {
    $('learnList').innerHTML = list.map(l => `<li>
      <b>${esc(l.title)}</b><span class="status">${esc(l.status)}</span>
      <small>${esc(l.note)}</small>
      <div class="bar" role="progressbar" aria-valuenow="${l.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(l.title)} progress"><i style="width:${l.progress}%"></i></div>
    </li>`).join('');
  }).catch(() => $('learnList').innerHTML = '<li class="empty">Could not load this list.</li>');

  // ----- leetcode -----
  get('/api/leetcode').then(d => {
    const row = (cls, label, n, tot) =>
      `<div class="lc-row ${cls}"><span>${label}</span><div class="track"><i style="width:${tot ? Math.min(100, n / tot * 100) : 0}%"></i></div><em>${n} / ${tot}</em></div>`;
    $('lc').innerHTML = `
      <div class="lc-top">
        <div class="lc-total">${d.solved}<span>problems solved${d.ranking ? ` · rank ${Number(d.ranking).toLocaleString()}` : ''}</span></div>
        <a href="https://leetcode.com/u/${encodeURIComponent(d.username)}" target="_blank" rel="noopener">@${esc(d.username)} on LeetCode</a>
      </div>
      <div class="lc-rows">
        ${row('e', 'Easy', d.easy, d.totalEasy)}
        ${row('m', 'Medium', d.medium, d.totalMedium)}
        ${row('h', 'Hard', d.hard, d.totalHard)}
      </div>
      ${d.live ? '' : '<p class="lc-note">Showing saved numbers. Set your username in data/profile.json to load live stats.</p>'}`;
  }).catch(() => $('lc').innerHTML = '<p class="empty">Could not load LeetCode stats.</p>');

  // ----- visitor counter (once per browser session) -----
  const counted = sessionStorage.getItem('counted');
  fetch(counted ? '/api/visits' : '/api/visit', { method: counted ? 'GET' : 'POST' })
    .then(r => r.json()).then(v => {
      sessionStorage.setItem('counted', '1');
      $('visits').textContent = `${v.visits.toLocaleString()} visitors`;
    }).catch(() => {});
}

// ----- contact form -----
$('contactForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, msg = $('formMsg'), btn = $('sendBtn');
  const body = Object.fromEntries(new FormData(f));
  msg.className = ''; msg.textContent = '';
  btn.disabled = true;
  try {
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Something went wrong.');
    msg.className = 'ok'; msg.textContent = 'Message sent. Thanks for reaching out.';
    f.reset();
  } catch (err) {
    msg.className = 'err'; msg.textContent = err.message;
  } finally { btn.disabled = false; }
});

init();
