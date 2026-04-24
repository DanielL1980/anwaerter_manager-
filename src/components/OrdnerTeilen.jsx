import { useState, useEffect } from 'react';
import { Share2, X, Copy, Check, Clock, Users, Trash2, Shield, ShieldOff } from 'lucide-react';
import { erstelleOrdnerEinladung, getOrdnerZugaenge, updateOrdnerZugang, deleteOrdnerZugang } from '../lib/db';

function OrdnerTeilen({ anwaerterId, anwaerterName }) {
  const [offen, setOffen] = useState(false);
  const [ansicht, setAnsicht] = useState('haupt'); // haupt | link | zugaenge
  const [link, setLink] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState('');
  const [zugaenge, setZugaenge] = useState([]);
  const [zugriffTyp, setZugriffTyp] = useState('schreiben');

  const ladeZugaenge = async () => {
    try {
      const z = await getOrdnerZugaenge(anwaenterId);
      setZugaenge(z);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (offen && ansicht === 'zugaenge') ladeZugaenge();
  }, [offen, ansicht]);

  const handleLinkErstellen = async () => {
    setLaedt(true);
    setFehler('');
    try {
      const url = await erstelleOrdnerEinladung(anwaerterId, anwaerterName, zugriffTyp);
      setLink(url);
      setAnsicht('link');
    } catch (e) {
      setFehler('Fehler: ' + e.message);
    }
    setLaedt(false);
  };

  const handleKopieren = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2500);
  };

  const handleZugriffAendern = async (zugangId, neuerZugriff) => {
    await updateOrdnerZugang(zugangId, neuerZugriff);
    await ladeZugaenge();
  };

  const handleWiderrufen = async (zugangId) => {
    if (!window.confirm('Zugriff wirklich widerrufen?')) return;
    await deleteOrdnerZugang(zugangId);
    await ladeZugaenge();
  };

  return (
    <>
      <button onClick={() => { setOffen(true); setAnsicht('haupt'); setLink(''); setFehler(''); }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm font-medium">
        <Share2 size={16} />
        <span className="hidden sm:inline">Teilen</span>
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold">Ordner teilen</h3>
                <p className="text-indigo-200 text-sm">{anwaerterName} – alle Auswertungen</p>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {ansicht === 'haupt' && (
                <>
                  {/* Zugriff-Typ */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Zugriff für Kollegen:</p>
                    <div className="flex gap-2">
                      <button onClick={() => setZugriffTyp('lesen')}
                        className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition ${zugriffTyp === 'lesen' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}>
                        <Shield size={16} /> Nur lesen
                      </button>
                      <button onClick={() => setZugriffTyp('schreiben')}
                        className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition ${zugriffTyp === 'schreiben' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500'}`}>
                        <ShieldOff size={16} /> Lesen & Schreiben
                      </button>
                    </div>
                  </div>

                  <button onClick={handleLinkErstellen} disabled={laedt}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition text-left">
                    <span className="text-2xl">{laedt ? '⏳' : '🔗'}</span>
                    <div>
                      <p className="font-bold text-slate-800">{laedt ? 'Wird erstellt...' : 'Einladungslink erstellen'}</p>
                      <p className="text-xs text-slate-500">7 Tage gültig – per WhatsApp, E-Mail oder SMS teilen</p>
                    </div>
                  </button>

                  <button onClick={() => { setAnsicht('zugaenge'); ladeZugaenge(); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left">
                    <span className="text-2xl"><Users size={24} className="text-blue-500" /></span>
                    <div>
                      <p className="font-bold text-slate-800">Zugänge verwalten</p>
                      <p className="text-xs text-slate-500">Bestehende Zugänge einsehen, einschränken oder widerrufen</p>
                    </div>
                  </button>

                  {fehler && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{fehler}</p>}
                </>
              )}

              {ansicht === 'link' && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-emerald-700 mb-1">✅ Einladungslink erstellt!</p>
                    <p className="text-xs text-emerald-600">Zugriff: {zugriffTyp === 'lesen' ? 'Nur lesen' : 'Lesen & Schreiben'} · 7 Tage gültig</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Link:</p>
                    <p className="text-xs text-slate-700 break-all font-mono">{link}</p>
                  </div>
                  <button onClick={handleKopieren}
                    className={`w-full py-3 rounded-xl font-bold transition active:scale-95 flex items-center justify-center gap-2 ${kopiert ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
                    {kopiert ? <Check size={18} /> : <Copy size={18} />}
                    {kopiert ? 'Link kopiert!' : 'Link kopieren'}
                  </button>
                  <button onClick={() => setAnsicht('haupt')}
                    className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
                    Zurück
                  </button>
                </>
              )}

              {ansicht === 'zugaenge' && (
                <>
                  <p className="text-sm font-semibold text-slate-700">Aktive Zugänge:</p>
                  {zugaenge.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-500">Noch keine Zugänge vergeben.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {zugaenge.map(z => (
                        <div key={z.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">Gast-ID: {z.gastId?.slice(0, 8)}...</p>
                            <p className="text-xs text-slate-400">{z.zugriff === 'lesen' ? '👁 Nur lesen' : '✏️ Lesen & Schreiben'}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleZugriffAendern(z.id, z.zugriff === 'lesen' ? 'schreiben' : 'lesen')}
                              className="p-1.5 rounded-lg hover:bg-slate-200 transition text-slate-500"
                              title={z.zugriff === 'lesen' ? 'Schreibzugriff erteilen' : 'Nur Lesezugriff'}
                            >
                              {z.zugriff === 'lesen' ? <ShieldOff size={14} /> : <Shield size={14} />}
                            </button>
                            <button
                              onClick={() => handleWiderrufen(z.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 transition text-red-400"
                              title="Zugriff widerrufen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setAnsicht('haupt')}
                    className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
                    Zurück
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrdnerTeilen;
