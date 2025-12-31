import { useEffect, useState, useCallback } from 'react';
import { onValue, ref, remove, runTransaction, set, update } from 'firebase/database';
import { getFirebaseDatabase } from '../firebaseClient';
import { GamePhase, GameState, Player } from '../types';

const GAME_PATH = 'games/default';

// --- ADMIN HOOK ---
export const useAdminGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    players: [],
    currentQuestion: null,
  });

  const db = getFirebaseDatabase();

  // Subscribe to remote state and player list
  useEffect(() => {
    const stateRef = ref(db, `${GAME_PATH}/state`);
    const playersRef = ref(db, `${GAME_PATH}/players`);

    const unsubscribeState = onValue(stateRef, (snap) => {
      const remoteState = snap.val();
      setGameState((prev) => ({
        ...prev,
        phase: remoteState?.phase ?? GamePhase.LOBBY,
        currentQuestion: remoteState?.currentQuestion ?? null,
      }));
    });

    const unsubscribePlayers = onValue(playersRef, (snap) => {
      const playersObject = snap.val() || {};
      const players: Player[] = Object.entries(playersObject).map(([id, value]: [string, any]) => ({
        id,
        nickname: value.nickname,
        score: value.score ?? 0,
        currentAnswer: value.currentAnswer ?? null,
        submittedAt: value.submittedAt ?? null,
        isOnline: value.isOnline ?? false,
      }));
      setGameState((prev) => ({ ...prev, players }));
    });

    return () => {
      unsubscribeState();
      unsubscribePlayers();
    };
  }, [db]);

  // Actions
  const startQuestion = (text: string, timeLimit: number) => {
    const endTime = Date.now() + timeLimit * 1000;
    const stateRef = ref(db, `${GAME_PATH}/state`);
    const updates: Record<string, any> = {};

    // Reset answers for all players
    gameState.players.forEach((player) => {
      updates[`${GAME_PATH}/players/${player.id}/currentAnswer`] = null;
      updates[`${GAME_PATH}/players/${player.id}/submittedAt`] = null;
    });

    update(ref(db), updates);
    set(stateRef, {
      phase: GamePhase.QUESTION_ACTIVE,
      currentQuestion: { text, timeLimit, endTime },
    });
  };

  const endQuestion = useCallback(() => {
    const stateRef = ref(db, `${GAME_PATH}/state`);
    set(stateRef, {
      phase: GamePhase.GRADING,
      currentQuestion: gameState.currentQuestion,
    });
  }, [db, gameState.currentQuestion]);

  const updateScore = (playerId: string, points: number) => {
    const scoreRef = ref(db, `${GAME_PATH}/players/${playerId}/score`);
    runTransaction(scoreRef, (current) => (current || 0) + points);
  };

  const showLeaderboard = () => {
    const stateRef = ref(db, `${GAME_PATH}/state`);
    set(stateRef, {
      phase: GamePhase.LEADERBOARD,
      currentQuestion: gameState.currentQuestion,
    });
  };

  const returnToLobby = () => {
    const stateRef = ref(db, `${GAME_PATH}/state`);
    set(stateRef, {
      phase: GamePhase.LOBBY,
      currentQuestion: null,
    });
  };

  const kickPlayer = (playerId: string) => {
    const playerRef = ref(db, `${GAME_PATH}/players/${playerId}`);
    remove(playerRef);
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
  const db = getFirebaseDatabase();

  useEffect(() => {
    const stateRef = ref(db, `${GAME_PATH}/state`);
    const playersRef = ref(db, `${GAME_PATH}/players`);

    // Join immediately
    const playerRef = ref(db, `${GAME_PATH}/players/${playerId}`);
    set(playerRef, {
      nickname,
      score: 0,
      currentAnswer: null,
      submittedAt: null,
      isOnline: true,
    });

    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(
      onValue(stateRef, (snap) => {
        const state = snap.val();
        setGameState((prev) => ({
          ...(prev || { players: [], phase: GamePhase.LOBBY, currentQuestion: null }),
          phase: state?.phase ?? GamePhase.LOBBY,
          currentQuestion: state?.currentQuestion ?? null,
        }));
      })
    );

    unsubscribers.push(
      onValue(playersRef, (snap) => {
        const playersObject = snap.val() || {};
        const players: Player[] = Object.entries(playersObject).map(([id, value]: [string, any]) => ({
          id,
          nickname: value.nickname,
          score: value.score ?? 0,
          currentAnswer: value.currentAnswer ?? null,
          submittedAt: value.submittedAt ?? null,
          isOnline: value.isOnline ?? false,
        }));

        setGameState((prev) =>
          prev
            ? {
                ...prev,
                players,
              }
            : {
                phase: GamePhase.LOBBY,
                players,
                currentQuestion: null,
              }
        );
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      remove(playerRef);
    };
  }, [db, playerId, nickname]);

  const submitAnswer = (answer: string) => {
    const playerRef = ref(db, `${GAME_PATH}/players/${playerId}`);
    update(playerRef, {
      currentAnswer: answer,
      submittedAt: Date.now(),
      isOnline: true,
    });
  };

  const myPlayer = gameState?.players.find((p) => p.id === playerId);

  return {
    gameState,
    myPlayer,
    submitAnswer,
  };
};
