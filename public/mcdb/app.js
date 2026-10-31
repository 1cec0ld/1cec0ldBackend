const API = '/api/v1/mc/tables';
const LIMIT = 100;
const state = { table: null, offset: 0, sort: null, dir: 'desc', filters: {} };
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function getJson(url) {
  const r = await fetch(url);
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || r.statusText);
  return body;
}

async function loadTables() {
  try {
    const { tables } = await getJson(API);
    $('tables').innerHTML = '';
    tables.forEach(t => {
      const b = document.createElement('button');
      b.innerHTML = `<span>${esc(t.name)}</span><small>${t.rows.toLocaleString()}</small>`;
      b.onclick = () => { state.table = t.name; state.offset = 0; state.sort = null; state.filters = {}; loadRows(); };
      b.dataset.name = t.name;
      $('tables').appendChild(b);
    });
    if (!tables.length) $('tables').textContent = 'No tables found.';
  } catch (e) { $('tables').textContent = 'Error: ' + e.message; }
}

async function loadRows() {
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.name === state.table));
  const q = new URLSearchParams({ limit: LIMIT, offset: state.offset, dir: state.dir, ...state.filters });
  if (state.sort) q.set('sort', state.sort);
  let data;
  try { data = await getJson(`${API}/${encodeURIComponent(state.table)}?${q}`); }
  catch (e) { $('grid').innerHTML = `<tr><td>Error: ${esc(e.message)}</td></tr>`; return; }

  const cols = data.columns.map(c => c.name);
  $('fcol').innerHTML = cols.map(c => `<option>${esc(c)}</option>`).join('');
  $('filters').innerHTML = Object.entries(state.filters)
    .map(([k, v]) => `<button data-k="${esc(k)}">${esc(k)} = ${esc(v)} ✕</button>`).join(' ');
  $('filters').querySelectorAll('button').forEach(b => b.onclick = () => { delete state.filters[b.dataset.k]; state.offset = 0; loadRows(); });

  const arrow = c => c === state.sort ? (state.dir === 'asc' ? ' ▲' : ' ▼') : '';
  $('grid').innerHTML =
    `<thead><tr>${cols.map(c => `<th data-c="${esc(c)}">${esc(c)}${arrow(c)}</th>`).join('')}</tr></thead><tbody>` +
    data.rows.map(r => `<tr>${cols.map(c => r[c] === null
      ? '<td class="null">null</td>'
      : `<td title="${esc(r[c])}">${esc(r[c])}</td>`).join('')}</tr>`).join('') + '</tbody>';
  $('grid').querySelectorAll('th').forEach(th => th.onclick = () => {
    state.dir = state.sort === th.dataset.c && state.dir === 'desc' ? 'asc' : 'desc';
    state.sort = th.dataset.c; state.offset = 0; loadRows();
  });

  const end = Math.min(data.offset + data.rows.length, data.total);
  $('page').textContent = data.total ? `${data.offset + 1}–${end} of ${data.total.toLocaleString()}` : '0 rows';
  $('prev').disabled = data.offset === 0;
  $('next').disabled = end >= data.total;
}

$('prev').onclick = () => { state.offset = Math.max(0, state.offset - LIMIT); loadRows(); };
$('next').onclick = () => { state.offset += LIMIT; loadRows(); };
$('fadd').onclick = () => {
  if (!state.table) return;
  state.filters[$('fcol').value] = $('fval').value; $('fval').value = ''; state.offset = 0; loadRows();
};
$('fval').onkeydown = e => { if (e.key === 'Enter') $('fadd').click(); };
loadTables();
