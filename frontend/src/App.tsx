import { useCallback, useEffect, useRef, useState } from "react";
import {
  MusicSocket,
  type ServerState,
  type StatusPayload,
} from "./api/musicSocket";
import { StatusBar } from "./components/StatusBar";
import { TransportControls } from "./components/TransportControls";
import { MoodWheel } from "./mood/MoodWheel";
import type { WheelPick } from "./mood/wheel";
import { Room } from "./scene/Room";
import {
  PERSONAS,
  buildPrompt,
  clampBpm,
  type DjId,
} from "./djs/personas";
import "./App.css";

const WALK_DURATION_MS = 6000;

export default function App() {
  const [state, setState] = useState<ServerState>("stopped");
  const [statusMessage, setStatusMessage] = useState(
    "Spin the mood wheel. A DJ will walk to the booth.",
  );
  const [pick, setPick] = useState<WheelPick | null>(null);
  const [activeDjId, setActiveDjId] = useState<DjId | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);

  const socketRef = useRef<MusicSocket | null>(null);
  const isPlayingRef = useRef(false);
  const pendingPromptRef = useRef<string>("");
  const arrivedDjRef = useRef<DjId | null>(null);

  const handleStatus = useCallback((payload: StatusPayload) => {
    setState(payload.state);
    isPlayingRef.current = payload.state === "playing";
    if (payload.message) setStatusMessage(payload.message);
  }, []);

  const handleClose = useCallback(() => {
    setState("stopped");
    isPlayingRef.current = false;
    setStatusMessage("Disconnected from server.");
  }, []);

  useEffect(() => {
    socketRef.current = new MusicSocket(handleStatus, handleClose);
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [handleStatus, handleClose]);

  const isBusy = state === "connecting";
  const isPlaying = state === "playing";

  // Warming = there's an active DJ but they haven't been confirmed arrived
  // (or audio isn't yet flowing).
  const isWarming =
    activeDjId !== null && (arrivedDjRef.current !== activeDjId || !isPlaying);

  async function fireStartOrSteer(prompt: string) {
    if (!prompt) return;
    try {
      if (isPlayingRef.current) {
        await socketRef.current?.steer(prompt);
      } else {
        await socketRef.current?.start(prompt);
      }
    } catch {
      setState("error");
      setStatusMessage("Failed to play music.");
    }
  }

  function handlePick(p: WheelPick) {
    // Prime AudioContext synchronously inside the click handler.
    // Browsers only allow AudioContext to resume during a trusted user gesture;
    // doing it after the walk completes would silently fail. Keep this first.
    void socketRef.current?.primeAudio();

    setPick(p);
    const dj = PERSONAS[p.djId];
    const nextBpm = clampBpm(dj, p.energy);
    setBpm(nextBpm);
    const prompt = buildPrompt(dj, p.mood, nextBpm);
    pendingPromptRef.current = prompt;

    if (activeDjId === p.djId && arrivedDjRef.current === p.djId) {
      // Same DJ, already at booth: steer immediately with the new BPM/mood.
      setStatusMessage(`${dj.name} adjusting — ${p.mood.label}`);
      void fireStartOrSteer(prompt);
      return;
    }

    // New DJ (or same DJ still walking): reset arrival state and start the walk.
    arrivedDjRef.current = null;
    setActiveDjId(p.djId);
    setStatusMessage(`${dj.name} walking to the booth — ${p.mood.label}`);
  }

  const handleArrived = useCallback(() => {
    if (!activeDjId) return;
    arrivedDjRef.current = activeDjId;
    void fireStartOrSteer(pendingPromptRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDjId]);

  async function onStop() {
    try {
      await socketRef.current?.stop();
      setActiveDjId(null);
      arrivedDjRef.current = null;
      pendingPromptRef.current = "";
    } catch {
      setState("error");
      setStatusMessage("Failed to stop playback.");
    }
  }

  return (
    <main className="stage">
      <div className="stage-left">
        <Room
          activeDjId={activeDjId}
          bpm={bpm ?? undefined}
          isPlaying={isPlaying}
          isWarming={isWarming}
          walkDurationMs={WALK_DURATION_MS}
          onArrived={handleArrived}
        />
      </div>

      <aside className="stage-right">
        <header className="app-header">
          <h1>Mood Ring DJ</h1>
          <p>Pick a mood. A DJ walks to the booth.</p>
        </header>

        <MoodWheel
          onPick={handlePick}
          activeWedgeId={pick?.wedge.id ?? null}
          disabled={isBusy}
        />

        <div className="now-playing">
          {pick ? (
            <>
              <span className="np-mood">{pick.mood.label}</span>
              <span className="np-dot"> · </span>
              <span className="np-dj">
                {PERSONAS[pick.djId].name} ({PERSONAS[pick.djId].genre})
              </span>
              {bpm !== null && (
                <>
                  <span className="np-dot"> · </span>
                  <span className="np-bpm">{Math.round(bpm)} BPM</span>
                </>
              )}
            </>
          ) : (
            <span className="np-empty">No mood picked yet.</span>
          )}
        </div>

        <TransportControls
          canPlay={false}
          canStop={isPlaying || isBusy || activeDjId !== null}
          canSteer={false}
          onPlay={() => undefined}
          onStop={() => void onStop()}
          onSteer={() => undefined}
        />

        <StatusBar state={state} message={statusMessage} />

        <p className="tip">
          Tip: After you pick a new mood, the mix takes 5–10 seconds to settle.
        </p>
      </aside>
    </main>
  );
}
