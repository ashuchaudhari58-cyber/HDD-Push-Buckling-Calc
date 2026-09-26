import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { runProject } from '../engine/index.js';
import { buildSteps } from '../engine/steps.js';
import { newProject, migrate, uid, PRESETS } from '../engine/presets.js';
import { libraryProps } from '../engine/materials.js';

const K_WORK = 'hddps.working.v2';
const K_LIB = 'hddps.library.v2';
const K_UI = 'hddps.ui.v2';

const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

const strip = (p) => { const { updatedAt, ...rest } = p; return JSON.stringify(rest); };

function setPath(obj, path, value) {
  const keys = path.split('.');
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = out, src = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = Array.isArray(src[k]) ? [...src[k]] : { ...src[k] };
    cur = cur[k]; src = src[k];
  }
  cur[keys[keys.length - 1]] = value;
  return out;
}
export function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }

function init() {
  const lib = read(K_LIB, []).map((e) => ({ ...e, project: migrate(e.project) }));
  const work = read(K_WORK, null);
  const project = work ? migrate(work.project) : newProject('sample-steel');
  const savedHash = work ? work.savedHash : null;
  return { project, savedHash, library: lib, history: [], future: [] };
}

function reducer(s, a) {
  switch (a.type) {
    case 'set': {
      let p = setPath(s.project, a.path, a.value);
      // material / grade change → apply library properties (explicit, reported by toast)
      if (a.path === 'pipe.material' || a.path === 'pipe.steelGrade' || a.path === 'pipe.hdpeGrade') {
        const grade = p.pipe.material === 'steel' ? p.pipe.steelGrade : p.pipe.hdpeGrade;
        p = { ...p, pipe: { ...p.pipe, ...libraryProps(p.pipe.material, grade) } };
        if (a.path === 'pipe.material') p.pipe.contents = p.pipe.material === 'hdpe' ? 'mud' : 'empty';
      }
      if (a.path === 'pipe.nps') {
        const od = a.odIn; if (od) p = setPath(p, 'pipe.odIn', od);
      }
      p.updatedAt = Date.now();
      return { ...s, project: p, history: [...s.history.slice(-60), s.project], future: [] };
    }
    case 'patch': {
      const p = { ...s.project, ...a.patch, updatedAt: Date.now() };
      return { ...s, project: p, history: [...s.history.slice(-60), s.project], future: [] };
    }
    case 'undo': {
      if (!s.history.length) return s;
      const prev = s.history[s.history.length - 1];
      return { ...s, project: prev, history: s.history.slice(0, -1), future: [s.project, ...s.future] };
    }
    case 'redo': {
      if (!s.future.length) return s;
      return { ...s, project: s.future[0], future: s.future.slice(1), history: [...s.history, s.project] };
    }
    case 'load':
      return { ...s, project: a.project, savedHash: a.saved ? strip(a.project) : null, history: [], future: [] };
    case 'saved':
      return { ...s, project: a.project, library: a.library, savedHash: strip(a.project) };
    case 'library':
      return { ...s, library: a.library };
    default:
      return s;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [s, dispatch] = useReducer(reducer, undefined, init);
  const [toast, setToast] = useState(null);
  const [ui, setUi] = useState(() => read(K_UI, { theme: 'dark', collapsed: false }));
  const tRef = useRef();

  const notify = useCallback((msg, kind = 'info') => {
    setToast({ msg, kind }); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // autosave the working copy (draft) — survives reloads; explicit Save writes to the library
  useEffect(() => { write(K_WORK, { project: s.project, savedHash: s.savedHash }); }, [s.project, s.savedHash]);
  useEffect(() => { write(K_UI, ui); document.documentElement.dataset.theme = ui.theme; }, [ui]);

  const results = useMemo(() => {
    try { return runProject(s.project); } catch (e) { console.error(e); return null; }
  }, [s.project]);
  const steps = useMemo(() => {
    try { return results ? buildSteps(s.project, results) : null; } catch (e) { console.error(e); return null; }
  }, [s.project, results]);

  const dirty = s.savedHash !== strip(s.project);
  const inLibrary = s.library.some((e) => e.id === s.project.id);

  const api = useMemo(() => ({
    set: (path, value, extra = {}) => dispatch({ type: 'set', path, value, ...extra }),
    patch: (patch) => dispatch({ type: 'patch', patch }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    save: () => {
      const p = { ...s.project, updatedAt: Date.now() };
      const entry = { id: p.id, project: p, savedAt: Date.now(), summary: summaryOf(p, results) };
      const lib = [entry, ...s.library.filter((e) => e.id !== p.id)];
      if (!write(K_LIB, lib)) { notify('Could not save — browser storage is unavailable or full.', 'fail'); return; }
      dispatch({ type: 'saved', project: p, library: lib });
      notify(`Saved “${p.meta.name}” · Rev ${p.meta.revision}`, 'ok');
    },
    newRevision: (rev, description, by) => {
      const p = { ...s.project };
      p.meta = { ...p.meta, revision: rev, date: new Date().toISOString().slice(0, 10), status: 'Draft' };
      p.revisions = [...(p.revisions || []), { rev, date: p.meta.date, by: by || p.meta.preparedBy || '', description }];
      p.updatedAt = Date.now();
      dispatch({ type: 'patch', patch: p });
      notify(`Revision ${rev} started — save to keep it.`);
    },
    duplicate: () => {
      const p = JSON.parse(JSON.stringify(s.project));
      p.id = uid(); p.meta.name = `${p.meta.name} (copy)`; p.createdAt = p.updatedAt = Date.now();
      dispatch({ type: 'load', project: p, saved: false });
      notify('Duplicated — this is a new unsaved project.');
    },
    newFrom: (key) => {
      const p = newProject(key);
      dispatch({ type: 'load', project: p, saved: false });
      notify(`New project from template: ${PRESETS.find((x) => x.key === key)?.title || key}`);
    },
    open: (id) => {
      const e = s.library.find((x) => x.id === id);
      if (e) { dispatch({ type: 'load', project: migrate(e.project), saved: true }); notify(`Opened “${e.project.meta.name}”`); }
    },
    remove: (id) => {
      const lib = s.library.filter((e) => e.id !== id);
      write(K_LIB, lib); dispatch({ type: 'library', library: lib }); notify('Project removed from this browser.');
    },
    exportFile: (proj = s.project) => {
      const blob = new Blob([JSON.stringify({ app: 'HDD Push & Buckling Studio', schema: proj.schema, exportedAt: new Date().toISOString(), project: proj }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(proj.meta.docNo || 'project').replace(/[^\w.-]+/g, '_')}_Rev${proj.meta.revision}.hddpf.json`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    },
    importFile: async (file) => {
      try {
        const txt = await file.text();
        const obj = JSON.parse(txt);
        const p = migrate(obj.project || obj);
        dispatch({ type: 'load', project: p, saved: false });
        notify(`Imported “${p.meta.name}” — review and Save to keep it in this browser.`, 'ok');
      } catch { notify('That file is not a valid project file.', 'fail'); }
    },
    reset: () => {
      const key = s.project.template || 'sample-steel';
      const fresh = newProject(key);
      fresh.id = s.project.id; fresh.meta = s.project.meta; fresh.revisions = s.project.revisions;
      dispatch({ type: 'load', project: fresh, saved: false });
      notify('Inputs reset to the template defaults (project information kept).');
    },
    setUi: (patch) => setUi((u) => ({ ...u, ...patch })),
    notify,
  }), [s.project, s.library, results, notify]);

  const value = { ...s, results, steps, dirty, inLibrary, ui, toast, ...api };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function summaryOf(p, r) {
  return {
    name: p.meta.name, docNo: p.meta.docNo, revision: p.meta.revision, status: p.meta.status,
    material: p.pipe.material, force: r?.Fmax ?? null, overall: r?.overall?.state ?? null, location: p.meta.location,
  };
}

export function useStore() { return useContext(Ctx); }
