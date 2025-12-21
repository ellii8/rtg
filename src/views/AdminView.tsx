import React, { useState, useEffect } from 'react';
import { useAdminGame } from '../services/gameService';
import { GamePhase } from '../types';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { Users, Play, Trophy, CheckCircle, XCircle, Home, LogOut, MessageSquare, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminView: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { gameState, startQuestion, endQuestion, updateScore, showLeaderboard, returnToLobby, kickPlayer } = useAdminGame();
  
  // Local state for form inputs
  const [questionText, setQuestionText] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);

  // Auto-end question when timer expires (handled by Timer component callback for UI, but backend logic is robust)
  const handleTimerExpire = () => {
    endQuestion();
  };

  return (
    <div className="min-h-screen bg-dark text-slate-200 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-surface p-4 rounded-xl shadow-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
             <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Yönetici Paneli</h1>
            <p className="text-sm text-slate-400">Aktif Oyuncu: <span className="text-primary font-bold">{gameState.players.length}</span></p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLogout} className="flex items-center gap-2">
          <LogOut size={18} /> Çıkış
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* LOBBY / NEW QUESTION PHASE */}
          {(gameState.phase === GamePhase.LOBBY || gameState.phase === GamePhase.LEADERBOARD) && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface p-6 rounded-2xl shadow-xl border border-slate-700"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="text-secondary" /> 
                Yeni Soru Hazırla
              </h2>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Sorunuzu buraya yazın..."
                className="w-full bg-dark border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-32 mb-4 text-lg"
              />
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Süre (Saniye)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full bg-dark border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-primary outline-none"
                    min="5"
                    max="300"
                  />
                </div>
                <Button 
                    onClick={() => {
                        if(!questionText.trim()) return;
                        startQuestion(questionText, timeLimit);
                    }} 
                    disabled={!questionText.trim()}
                    className="flex items-center gap-2 justify-center w-full sm:w-auto"
                >
                  <Play size={20} fill="currentColor" /> Başlat
                </Button>
              </div>
            </motion.div>
          )}

          {/* ACTIVE QUESTION PHASE */}
          {gameState.phase === GamePhase.QUESTION_ACTIVE && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface p-6 rounded-2xl shadow-xl border border-primary/30 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary animate-pulse"></div>
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-white">Soru Yayında!</h2>
                    <Button variant="danger" onClick={endQuestion} className="px-4 py-2 text-sm">
                        Süreyi Bitir
                    </Button>
                </div>
                
                <p className="text-xl md:text-3xl text-center font-bold text-white mb-8 p-4 bg-dark/50 rounded-xl border border-slate-700">
                    {gameState.currentQuestion?.text}
                </p>

                <div className="max-w-md mx-auto mb-8">
                    <Timer 
                        endTime={gameState.currentQuestion?.endTime || null} 
                        totalDuration={gameState.currentQuestion?.timeLimit || 30}
                        onExpire={handleTimerExpire}
                    />
                </div>

                {/* Live Answer Feed */}
                <div className="bg-dark/50 p-4 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                        <Activity size={16} /> Canlı Cevap Akışı (Anlık)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gameState.players.map(player => (
                            <div key={player.id} className={`p-2 rounded-lg border text-sm flex justify-between items-center ${player.currentAnswer ? 'bg-primary/20 border-primary/50' : 'bg-surface border-slate-700 opacity-50'}`}>
                                <span className="font-bold truncate">{player.nickname}</span>
                                {player.currentAnswer ? (
                                    <span className="text-white truncate max-w-[80px] bg-dark/50 px-2 py-0.5 rounded">{player.currentAnswer}</span>
                                ) : (
                                    <span className="text-xs">Bekliyor...</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
          )}

          {/* GRADING PHASE */}
          {gameState.phase === GamePhase.GRADING && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface p-6 rounded-2xl shadow-xl border border-secondary/30"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Değerlendirme</h2>
                    <Button variant="primary" onClick={showLeaderboard} className="flex items-center gap-2">
                        <Trophy size={18} /> Sıralamayı Göster
                    </Button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {gameState.players.map(player => (
                        <div key={player.id} className="bg-dark p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-white text-lg">{player.nickname}</span>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {player.submittedAt ? `${((player.submittedAt - (gameState.currentQuestion!.endTime! - gameState.currentQuestion!.timeLimit! * 1000)) / 1000).toFixed(2)}s` : 'Cevap yok'}
                                    </span>
                                </div>
                                <div className="p-3 bg-surface rounded-lg text-slate-200 border border-slate-600 break-words min-h-[3rem] flex items-center">
                                    {player.currentAnswer || <span className="text-slate-600 italic">Cevap verilmedi</span>}
                                </div>
                            </div>
                            
                            {/* Grading Buttons - Only enabled if answer exists */}
                            {player.currentAnswer && (
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={() => updateScore(player.id, 10)}
                                        className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors border border-green-500/50"
                                        title="Doğru (+10)"
                                    >
                                        <CheckCircle size={24} />
                                    </button>
                                    <button 
                                        onClick={() => updateScore(player.id, -5)}
                                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/50"
                                        title="Yanlış (-5)"
                                    >
                                        <XCircle size={24} />
                                    </button>
                                </div>
                            )}
                            <div className="text-xl font-bold w-16 text-center text-secondary">
                                {player.score}p
                            </div>
                        </div>
                    ))}
                    {gameState.players.length === 0 && (
                         <div className="text-center text-slate-500 py-8">Oyuncu yok.</div>
                    )}
                </div>
            </motion.div>
          )}

          {/* LEADERBOARD PHASE */}
          {gameState.phase === GamePhase.LEADERBOARD && (
             <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-surface p-6 rounded-2xl shadow-xl border border-yellow-500/30 text-center"
         >
             <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
             <h2 className="text-3xl font-bold text-white mb-8">Puan Durumu</h2>
             
             <div className="space-y-2 mb-8 max-w-lg mx-auto">
                {[...gameState.players].sort((a,b) => b.score - a.score).map((player, index) => (
                    <div 
                        key={player.id} 
                        className={`p-4 rounded-xl flex justify-between items-center ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-dark border border-slate-700'}`}
                    >
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>
                                {index + 1}
                            </span>
                            <span className="text-xl font-bold text-white">{player.nickname}</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">{player.score}p</span>
                    </div>
                ))}
             </div>

             <Button onClick={returnToLobby} variant="outline" className="mx-auto flex items-center gap-2">
                 <Home size={18} /> Lobiye Dön
             </Button>
         </motion.div>
          )}

        </div>

        {/* Sidebar: Player List */}
        <div className="bg-surface p-4 rounded-2xl shadow-lg border border-slate-700 h-fit max-h-screen overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Katılımcılar</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded">{gameState.players.length}</span>
          </h3>
          <div className="space-y-2">
            {[...gameState.players].sort((a,b) => b.score - a.score).map((player) => (
              <div key={player.id} className="flex justify-between items-center p-3 bg-dark rounded-lg border border-slate-700 group hover:border-slate-500 transition-colors">
                <div>
                    <div className="font-bold text-slate-200">{player.nickname}</div>
                    <div className="text-xs text-slate-500">Puan: {player.score}</div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Status Indicator */}
                    {gameState.phase === GamePhase.QUESTION_ACTIVE && (
                         player.currentAnswer ? 
                         <span className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> : 
                         <span className="w-3 h-3 bg-slate-600 rounded-full"></span>
                    )}
                    <button 
                        onClick={() => kickPlayer(player.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded"
                        title="At"
                    >
                        <XCircle size={16} />
                    </button>
                </div>
              </div>
            ))}
            {gameState.players.length === 0 && (
                <div className="text-center text-slate-500 py-4 italic text-sm">
                    Henüz kimse katılmadı. <br/> Yeni sekmede açıp test edin.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};