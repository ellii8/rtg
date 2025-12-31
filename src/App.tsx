import React, { useState, useEffect } from 'react';
import { AdminView } from './views/AdminView';
import { PlayerView } from './views/PlayerView';
import { Button } from './components/Button';
import { Shield, User, PlayCircle } from 'lucide-react';

// Simple ID generator to avoid external dependencies for this demo
const generateId = () => Math.random().toString(36).substr(2, 9);

enum AppMode {
  SELECTION = 'SELECTION',
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
}

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.SELECTION);
  const [nickname, setNickname] = useState('');
  const [playerId, setPlayerId] = useState('');

  // Persist session slightly to handle reloads
  useEffect(() => {
    const savedMode = localStorage.getItem('qm_mode');
    const savedId = localStorage.getItem('qm_id');
    const savedNick = localStorage.getItem('qm_nick');

    if (savedMode === AppMode.ADMIN) {
        setMode(AppMode.ADMIN);
    } else if (savedMode === AppMode.PLAYER && savedId && savedNick) {
        setMode(AppMode.PLAYER);
        setPlayerId(savedId);
        setNickname(savedNick);
    }
  }, []);

  const handleAdminLogin = () => {
    setMode(AppMode.ADMIN);
    localStorage.setItem('qm_mode', AppMode.ADMIN);
  };

  const handlePlayerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    const newId = generateId();
    setPlayerId(newId);
    setMode(AppMode.PLAYER);
    
    localStorage.setItem('qm_mode', AppMode.PLAYER);
    localStorage.setItem('qm_id', newId);
    localStorage.setItem('qm_nick', nickname);
  };

  const handleLogout = () => {
    setMode(AppMode.SELECTION);
    setNickname('');
    setPlayerId('');
    localStorage.clear();
    window.location.reload(); // Hard reset state
  };

  if (mode === AppMode.ADMIN) {
    return <AdminView onLogout={handleLogout} />;
  }

  if (mode === AppMode.PLAYER) {
    return <PlayerView nickname={nickname} playerId={playerId} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
                RTG Quiz
            </h1>
            <p className="text-slate-400 text-lg">Gerçek zamanlı bilgi yarışması platformu.</p>
        </div>

        <div className="bg-surface/50 backdrop-blur-lg border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-8">
            
            {/* Player Join Form */}
            <form onSubmit={handlePlayerLogin} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Nick girin"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-dark/80 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        maxLength={12}
                    />
                </div>
                <Button type="submit" fullWidth disabled={!nickname.trim()} className="text-lg shadow-primary/40">
                    <PlayCircle className="inline-block mr-2 w-5 h-5" /> Oyuna Katıl
                </Button>
            </form>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">veya</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Admin Button */}
            <Button variant="secondary" fullWidth onClick={handleAdminLogin} className="flex items-center justify-center gap-2">
                <Shield size={18} /> Yönetici Olarak Başla
            </Button>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-xs max-w-xs mx-auto">
            Nick girin ve soruyu bekleyin!
        </p>
      </div>
    </div>
  );
}

export default App;