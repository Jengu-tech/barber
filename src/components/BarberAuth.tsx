import React, { useState, useEffect } from 'react';
import { dbSignIn, dbSignUp, dbInsertShop, supabase } from '../lib/supabase';
import { Mail, Lock, Store, MapPin, Phone, ArrowRight, ShieldCheck, HelpCircle, Scissors, ClipboardList, Sparkles, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface AuthProps {
  navigate: (path: string) => void;
  onAuthSuccess?: () => void;
}

export function BarberLogin({ navigate, onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await dbSignIn(email, password);
      if (onAuthSuccess) onAuthSuccess();
      navigate('/barber/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f3] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-sm bg-white rounded-3xl p-8 border border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8/10">
          <div className="p-3 bg-neutral-900 rounded-full mb-3 shadow-md shadow-neutral-900/10">
            <span className="text-white text-lg font-black tracking-wider uppercase font-mono">B</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-sans">
            Barber<span className="text-amber-500">_Pro</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-mono font-bold tracking-tight uppercase">
            Connexion Barbier
          </p>
        </div>



        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-150 rounded-xl text-red-650 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1.5 font-mono">
              Adresse Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="coiffeur@barberpro.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1.5 font-mono">
              Mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md shadow-neutral-900/10 active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          {/* Quick Demo Login Option */}
          <button
            type="button"
            onClick={() => {
              setEmail('coiffeur@barberpro.fr');
              setPassword('123456');
            }}
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs py-2 rounded-xl transition-all border border-neutral-250 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Remplir les identifiants démo
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-5 text-center border-t border-neutral-100 pt-4">
          <button
            onClick={() => navigate('/barber/register')}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-bold hover:underline cursor-pointer"
          >
            Pas encore de compte ? <span className="text-amber-600">Créer ma boutique</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function BarberRegister({ navigate }: AuthProps) {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create account with Supabase Auth
      await dbSignUp(email, password);

      // 2. Inserts a row in the shops table with name, address, phone
      try {
        await dbInsertShop({
          name: shopName,
          address,
          phone,
        });
      } catch (dbErr: any) {
        console.warn("Could not insert shop row natively. Moving forward with local sync.", dbErr);
      }

      // Update name locally in BarberContext
      localStorage.setItem('barberq_shop_name', shopName);

      // 3. Redirect to setup setup
      navigate('/barber/setup');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f3] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-sm bg-white rounded-3xl p-8 border border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-neutral-900 rounded-full mb-3 shadow-md shadow-neutral-900/10">
            <span className="text-white text-lg font-black tracking-wider uppercase font-mono">B</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-sans">
            Barber<span className="text-amber-500">_Pro</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-mono font-bold tracking-tight uppercase">
            Créer ma Boutique de Barbier
          </p>
        </div>



        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-150 rounded-xl text-red-650 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1 font-mono">
              Nom de la boutique *
            </label>
            <div className="relative font-medium text-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Store className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Ex. Salon Gold Star"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1 font-mono">
              Adresse physique *
            </label>
            <div className="relative font-medium text-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Rue de Rivoli, Paris"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1 font-mono">
              Téléphone *
            </label>
            <div className="relative font-medium text-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1 font-mono">
              Adresse Email *
            </label>
            <div className="relative font-medium text-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="patron@barberpro.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-650 text-[11px] font-bold uppercase tracking-wider mb-1 font-mono">
              Mot de passe (min 6 caractères) *
            </label>
            <div className="relative font-medium text-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm pl-10.5 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1.5 focus:ring-neutral-900 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md shadow-neutral-900/10 active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Création en cours..." : "Créer ma boutique"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-5 text-center border-t border-neutral-100 pt-4">
          <button
            onClick={() => navigate('/barber/login')}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-bold hover:underline cursor-pointer"
          >
            Déjà un compte ? <span className="text-amber-600">Se connecter</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function BarberSetup({ navigate }: AuthProps) {
  const [shopId, setShopId] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_id') || 'default-shop';
  });
  const [shopName, setShopName] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_name') || 'Salon Barber_Pro';
  });

  useEffect(() => {
    async function loadShopId() {
      try {
        if (!supabase) return;
        const { data } = await supabase.from('shops').select('id, name').limit(1);
        if (data && data.length > 0) {
          setShopId(data[0].id);
          setShopName(data[0].name);
          localStorage.setItem('barberq_shop_id', data[0].id);
          localStorage.setItem('barberq_shop_name', data[0].name);
        }
      } catch (err) {
        console.error("Failed to load shop ID in setup screen:", err);
      }
    }
    loadShopId();
  }, []);

  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  const qrUrl = origin + '/shop/' + shopId;

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'barber-pro-qrcode.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f3] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col items-center text-center"
      >
        <div className="p-4 bg-green-50 text-green-600 rounded-full mb-3">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black text-neutral-900 font-sans">
          Boutique créée !
        </h1>
        <p className="text-sm text-neutral-600 mt-2 max-w-xs font-medium">
          Félicitations, votre espace <span className="text-neutral-900 font-bold">{shopName}</span> est configuré et prêt pour vos clients.
        </p>

        {/* QR Code representation */}
        <div className="my-5 p-4 bg-neutral-50 rounded-2xl border border-neutral-150 w-full flex flex-col items-center">
          <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Votre QR Code Client
          </h3>
          <div className="bg-white p-2.5 rounded-xl inline-block shadow-sm mb-3">
            <QRCode
              id="qr-canvas"
              value={qrUrl}
              size={256}
              level="H"
              includeMargin={true}
              className="block animate-fade-in max-w-[140px] h-auto"
            />
          </div>
          <p className="text-[10px] font-mono text-neutral-500 font-bold max-w-full break-all bg-neutral-100 p-2 rounded-lg border border-neutral-200 mb-3 select-all">
            {qrUrl}
          </p>
          <button
            onClick={downloadQRCode}
            type="button"
            className="text-xs text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-sm font-semibold cursor-pointer active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger PNG
          </button>
        </div>

        <div className="w-full mb-6 bg-neutral-50 rounded-2xl p-4.5 border border-neutral-150 text-left space-y-3.5">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">1</div>
            <div>
              <h3 className="text-xs font-bold text-neutral-850 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5 text-amber-600" /> Vos Coiffeurs</h3>
              <p className="text-[11px] text-neutral-500 font-medium">Configurez l'équipe de barbiers et personnalisez les spécialités.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">2</div>
            <div>
              <h3 className="text-xs font-bold text-neutral-850 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-amber-600" /> Prestations & Tarifs</h3>
              <p className="text-[11px] text-neutral-500 font-medium">Créez votre carte de services personnalisée (coupe, barbe, soins).</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/barber/dashboard')}
          className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-extrabold text-sm py-3 px-6 rounded-xl transition-all shadow-md shadow-neutral-900/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          Lancer mon Tableau de Bord
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
