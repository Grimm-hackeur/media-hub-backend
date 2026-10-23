import { useState } from 'react';
import { Eye } from 'lucide-react';
import { isDemo, setDemoRole, useDemoRole, type DemoRole } from '../lib/demo';
import { useNavigate } from 'react-router-dom';
import { cx } from './ui';

/** Preview-only control (hidden in real builds). Switches which screens are visible; nothing is simulated server-side. */
export function DemoSwitch() {
  const role = useDemoRole();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  if (!isDemo) return null;
  const opts: [DemoRole, string][] = [['visitor', 'Visiteur'], ['user', 'Utilisateur'], ['admin', 'Admin']];
  return (
    <div className="fixed bottom-[72px] right-3 z-50 flex flex-col-reverse items-end md:bottom-4 md:right-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Options d'aperçu"
        className="flex h-9 items-center gap-2 rounded-full border border-line-strong bg-panel px-3 text-xs font-medium text-soft shadow-lg hover:text-white">
        <Eye size={14} aria-hidden />Aperçu : {opts.find((o) => o[0] === role)![1]}
      </button>
      {open && (
        <div className="mh-fade mb-2 w-56 rounded-xl border border-line bg-panel p-3 text-xs shadow-2xl">
          <p className="mb-2 text-muted">Mode aperçu. Choisissez le profil à visualiser. Aucune donnée réelle, rien n'est enregistré.</p>
          <div className="grid grid-cols-3 gap-1">
            {opts.map(([r, l]) => (
              <button key={r} type="button" onClick={() => { setDemoRole(r); setOpen(false); if (r === 'admin') nav('/admin'); else nav('/'); }}
                className={cx('h-8 rounded-md border text-xs font-medium', role === r ? 'border-accent text-white' : 'border-line text-soft hover:text-white')}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
