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

const STEER_DEBOUNCE_MS = 350;
const WARMING_MS = 6000;

export default function App() {
  const [state, setState] = useState<ServerState>("stopped");
  const [statusMessage, setStatusMessage] = useState(
    "Spin the mood wheel. A DJ will take the booth.",
  );
  const [pick, setPick] = useState<WheelPick | null>(null);
  const [activeDjId, setActiveDjId] = useState<DjId | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [isWarming, setIsWarming] = useState(false);
  const socketRef = useRef<MusicSocket | null>(null);
  const steerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPromptRef = useRef<string>("");
  const isPlayingRef = useRef(false);

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

  function triggerWarm() {
    setIsWarming(true);
    if (warmTimerRef.current) clearTimeout(warmTimerRef.current);
    warmTimerRef.current = setTimeout(() => setIsWarming(false), WARMING_MS);
  }

  async function startWithPrompt(prompt: string) {
    lastPromptRef.current = prompt;
    triggerWarm();
    try {
      await socketRef.current?.start(prompt);
    } catch {
      setState("error");
      setStatusMessage("Failed to start playback.");
    }
  }

  async function steerWithPrompt(prompt: string) {
    if (prompt === lastPromptRef.current) return;
    lastPromptRef.current = prompt;
    triggerWarm();
    try {
      await socketRef.current?.steer(prompt);
    } catch {
      setState("error");
      setStatusMessage("Failed to update sound.");
    }
  }

  function handlePick(p: WheelPick) {
    // CRITICAL: prime AudioContext synchronously inside this click handler.
    // The debounce below would otherwise drop us outside the user gesture
    // and the browser would refuse to start audio.
    void socketRef.current?.primeAudio();

    setPick(p);
    const dj = PERSONAS[p.djId];
    const nextBpm = clampBpm(dj, p.energy);
    setBpm(nextBpm);
    setActiveDjId(p.djId);
    setStatusMessage(`${dj.name} taking the booth — ${p.mood.label}`);

    const prompt = buildPrompt(dj, p.mood, nextBpm);
    if (steerTimerRef.current) clearTimeout(steerTimerRef.current);
    steerTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        void steerWithPrompt(prompt);
      } else {
        void startWithPrompt(prompt);
      }
    }, STEER_DEBOUNCE_MS);
  }

  async function onStop() {
    try {
      await socketRef.current?.stop();
      setActiveDjId(null);
      setIsWarming(false);
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
          isWarming={isWarming}
        />
      </div>

      <aside className="stage-right">
        <header className="app-header">
          <h1>Mood Ring DJ</h1>
          <p>Pick a mood. A DJ takes the booth.</p>
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
          canStop={isPlaying || isBusy}
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
