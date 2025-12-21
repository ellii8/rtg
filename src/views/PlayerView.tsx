import React, { useState } from 'react';
import { usePlayerGame } from '../services/gameService';
import { GamePhase } from '../types';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { motion } from 'framer-motion';
import { Send, Clock, Coffee, Award } from 'lucide-react';

interface PlayerViewProps {
  nickname: string;
  playerId: string;
  onLogout: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ nickname, playerId, onLogout }) => {
  const { gameState, myPlayer, submitAnswer } = usePlayerGame(playerId, nickname);
  const [answer, setAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset local state when phase changes
  React.useEffect(() => {
    if (gameState?.phase === GamePhase.QUESTION_ACTIVE) {
      setAnswer('');
      setIsSubmitted(false);
    }
  }, [gameState?.phase]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Sunucuya bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  // Handle kick or refresh loss
  if (gameState.players.length > 0 && !myPlayer) {
     return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-center">
            <h2 className="text-2xl text-red-500 font-bold mb-2">Bağlantı Koptu</h2>
            <p className="text-slate-400 mb-6">Oyundan çıkarılmış veya bağlantınız kopmuş olabilir.</p>
            <Button onClick={onLogout}>Giriş Ekranına Dön</Button>
        </div>
     );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    submitAnswer(answer);
    setIsSubmitted(true);
  };

  // Helper to get rank
  const getRank = () => {
      const sortedPlayers = [...gameState.players].sort((a,b) => b.score - a.score);
      const index = sortedPlayers.findIndex(p => p.id === playerId);
      return index + 1;
  };

  return (
    <div className="min-h-screen bg-dark text-slate-200 flex flex-col">
      {/* Top Bar */}
      <div className="bg-surface p-4 border-b border-slate-700 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-sm">
                {nickname.substring(0,2).toUpperCase()}
            </div>
            <span className="font-bold text-white">{nickname}</span>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-dark px-3 py-1 rounded-full border border-slate-600 text-sm">
                 <span className="text-secondary font-bold">{myPlayer?.score || 0}</span> Puan
             </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full relative">
        
        {/* LOBBY PHASE */}
        {gameState.phase === GamePhase.LOBBY && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center w-full"
          >
            <Coffee className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Hazır Ol!</h2>
            <p className="text-slate-400 mb-8">Yönetici oyunu başlatmak üzere...</p>
            <div className="bg-surface p-4 rounded-xl border border-slate-700 animate-pulse">
                <p className="text-sm">Lütfen ekranı kapatma.</p>
            </div>
          </motion.div>
        )}

        {/* QUESTION PHASE */}
        {gameState.phase === GamePhase.QUESTION_ACTIVE && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full"
          >
            {/* Question Text for Player */}
            <div className="bg-surface p-6 rounded-2xl shadow-xl border border-slate-700 mb-6 text-center">
                 <h3 className="text-lg font-medium text-slate-300 mb-2">Soru</h3>
                 <p className="text-xl font-bold text-white">{gameState.currentQuestion?.text}</p>
            </div>

            <div className="mb-6">
                 <Timer 
                    endTime={gameState.currentQuestion?.endTime || null} 
                    totalDuration={gameState.currentQuestion?.timeLimit || 30}
                 />
            </div>

            {isSubmitted ? (
                 <div className="bg-green-500/10 border border-green-500/50 p-8 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                        <Send size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Cevap Gönderildi!</h3>
                    <p className="text-green-400">Diğerlerinin bitirmesini bekle...</p>
                    <p className="mt-4 text-slate-400 text-sm">Cevabın: <span className="text-white font-bold">{answer}</span></p>
                 </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Cevabını buraya yaz..."
                        className="w-full bg-surface border-2 border-slate-600 rounded-2xl p-4 text-white text-lg placeholder-slate-500 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-32"
                        autoFocus
                    />
                    <Button type="submit" fullWidth disabled={!answer.trim()} className="text-lg h-14">
                        CEVABI GÖNDER
                    </Button>
                </form>
            )}
          </motion.div>
        )}

        {/* GRADING PHASE (WAITING) */}
        {gameState.phase === GamePhase.GRADING && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center w-full"
            >
                <Clock className="w-20 h-20 text-secondary mx-auto mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold text-white mb-2">Süre Doldu!</h2>
                <p className="text-slate-400">Yönetici cevapları değerlendiriyor.</p>
                <div className="mt-8 p-4 bg-surface rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-500 mb-1">Senin Cevabın</p>
                    <p className="text-white text-lg font-medium">{myPlayer?.currentAnswer || "-"}</p>
                </div>
            </motion.div>
        )}

        {/* LEADERBOARD PHASE */}
        {gameState.phase === GamePhase.LEADERBOARD && (
             <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center w-full bg-surface p-6 rounded-2xl shadow-2xl border border-yellow-500/30"
             >
                <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Sonuçlar</h2>
                
                <div className="mt-4 mb-6 p-4 bg-dark/50 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Sıralaman</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-white">#{getRank()}</span>
                        <span className="text-slate-500">/ {gameState.players.length}</span>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <p className="text-left text-sm text-slate-400 pl-2">Lider Tablosu</p>
                    {[...gameState.players].sort((a,b) => b.score - a.score).slice(0, 3).map((p, i) => (
                        <div key={p.id} className={`flex justify-between items-center p-2 rounded-lg ${p.id === playerId ? 'bg-primary/20 border border-primary/50' : 'bg-dark border border-slate-700'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>{i+1}</span>
                                <span className="font-bold text-white text-sm">{p.nickname}</span>
                            </div>
                            <span className="text-secondary font-bold text-sm">{p.score}p</span>
                        </div>
                    ))}
                </div>
                
                <p className="text-slate-400 text-xs">Bir sonraki tur için bekle...</p>
             </motion.div>
        )}

      </div>
    </div>
  );
};