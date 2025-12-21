import { useEffect, useState, useCallback, useRef } from 'react';
import { ChannelEvent, GamePhase, GameState, Player } from '../types';

const CHANNEL_NAME = 'quiz_master_channel_v1';

// --- ADMIN HOOK ---
export const useAdminGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    players: [],
    currentQuestion: null,
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const gameStateRef = useRef<GameState>(gameState);

  // Keep Ref in sync with State to access latest state inside event listeners
  useEffect(() => {
    gameStateRef.current = gameState;
    
    // Broadcast state whenever it changes (Single Source of Truth)
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'ADMIN_UPDATE_STATE',
        payload: gameState,
      });
    }
  }, [gameState]);

  // Initialize Channel & Heartbeat
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ChannelEvent>) => {
      const { type, payload } = event.data;

      if (type === 'PLAYER_JOIN') {
        // 1. Immediately send current state so player gets off "Connecting..." screen
        // This sends the state *before* the player is added to the list, but it renders the UI.
        // The subsequent setGameState will trigger the useEffect to send the updated list.
        channel.postMessage({
            type: 'ADMIN_UPDATE_STATE',
            payload: gameStateRef.current,
        });

        // 2. Add player to state
        setGameState((prev) => {
          if (prev.players.find((p) => p.id === payload.id)) return prev;
          const newPlayers = [
            ...prev.players,
            {
              id: payload.id,
              nickname: payload.nickname,
              score: 0,
              currentAnswer: null,
              submittedAt: null,
              isOnline: true,
            },
          ];
          return { ...prev, players: newPlayers };
        });
      }

      if (type === 'PLAYER_SUBMIT') {
        setGameState((prev) => {
            // Only accept answers if question is active
            if (prev.phase !== GamePhase.QUESTION_ACTIVE) return prev;
            
            const updatedPlayers = prev.players.map((p) =>
                p.id === payload.id ? { ...p, currentAnswer: payload.answer, submittedAt: Date.now() } : p
            );
            return { ...prev, players: updatedPlayers };
        });
      }
    };

    // Periodic Sync (Heartbeat): Broadcast state every 3 seconds to ensure consistency
    // This fixes issues where a packet might be dropped or a tab was asleep.
    const syncInterval = setInterval(() => {
        if (channelRef.current) {
            channelRef.current.postMessage({
                type: 'ADMIN_UPDATE_STATE',
                payload: gameStateRef.current,
            });
        }
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      channel.close();
    };
  }, []);

  // Actions
  const startQuestion = (text: string, timeLimit: number) => {
    const endTime = Date.now() + timeLimit * 1000;
    setGameState((prev) => ({
      ...prev,
      phase: GamePhase.QUESTION_ACTIVE,
      currentQuestion: { text, timeLimit, endTime },
      players: prev.players.map(p => ({ ...p, currentAnswer: null, submittedAt: null })) // Reset answers
    }));
  };

  const endQuestion = useCallback(() => {
    setGameState((prev) => {
        if (prev.phase === GamePhase.GRADING) return prev;
        return {
            ...prev,
            phase: GamePhase.GRADING,
        };
    });
  }, []);

  const updateScore = (playerId: string, points: number) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, score: p.score + points } : p
      ),
    }));
  };

  const showLeaderboard = () => {
    setGameState((prev) => ({ ...prev, phase: GamePhase.LEADERBOARD }));
  };

  const returnToLobby = () => {
    setGameState((prev) => ({ 
        ...prev, 
        phase: GamePhase.LOBBY,
        currentQuestion: null
    }));
  };

  const kickPlayer = (playerId: string) => {
      setGameState(prev => ({
          ...prev,
          players: prev.players.filter(p => p.id !== playerId)
      }));
  };

  return {
    gameState,
    startQuestion,
    endQuestion,
    updateScore,
    showLeaderboard,
    returnToLobby,
    kickPlayer
  };
};

// --- PLAYER HOOK ---
export const usePlayerGame = (playerId: string, nickname: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    // Listen for state updates from Admin
    channel.onmessage = (event: MessageEvent<ChannelEvent>) => {
      if (event.data.type === 'ADMIN_UPDATE_STATE') {
        setGameState(event.data.payload);
      }
    };

    // Join immediately
    channel.postMessage({
      type: 'PLAYER_JOIN',
      payload: { id: playerId, nickname },
    });
    
    // Retry join after 1 second if no state received (Handling potential race condition)
    const retryTimeout = setTimeout(() => {
         if (!channelRef.current) return;
         channel.postMessage({
            type: 'PLAYER_JOIN',
            payload: { id: playerId, nickname },
        });
    }, 1000);

    return () => {
      clearTimeout(retryTimeout);
      channel.close();
    };
  }, [playerId, nickname]);

  const submitAnswer = (answer: string) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'PLAYER_SUBMIT',
        payload: { id: playerId, answer },
      });
    }
  };

  const myPlayer = gameState?.players.find((p) => p.id === playerId);

  return {
    gameState,
    myPlayer,
    submitAnswer,
  };
};