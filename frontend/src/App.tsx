import { useCallback, useEffect, useRef, useState } from "react";
import {
  MusicSocket,
  type ServerState,
  type StatusPayload,
} from "./api/musicSocket";
import { Navbar } from "./components/Navbar";
import { WordCloud } from "./components/WordCloud";
import {
  MAX_MOOD_SELECTIONS,
  MIN_MOOD_SELECTIONS,
} from "./constants/moodWords";
import { moodsToPrompt } from "./utils/promptFromMoods";
import "./App.css";

export default function App() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [state, setState] = useState<ServerState>("stopped");
  const [statusMessage, setStatusMessage] = useState("Preparing studio…");

  const socketRef = useRef<MusicSocket | null>(null);

  const handleStatus = useCallback((payload: StatusPayload) => {
    setState(payload.state);
    if (payload.message) {
      setStatusMessage(payload.message);
    }
  }, []);

  const handleClose = useCallback(() => {
    setState("stopped");
    setStatusMessage("Disconnected from server.");
  }, []);

  useEffect(() => {
    const socket = new MusicSocket(handleStatus, handleClose);
    socketRef.current = socket;
    socket.connect();
    void socket.warm();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handleStatus, handleClose]);

  const isConnecting = state === "connecting";
  const isWarming = state === "warming";
  const isBusy = isConnecting || isWarming;
  const isPlaying = state === "playing";
  const isError = state === "error";
  const agentReady = !isConnecting;
  const selectionFull = selectedWords.length >= MAX_MOOD_SELECTIONS;

  const canPlay =
    !isBusy &&
    !isPlaying &&
    selectedWords.length >= MIN_MOOD_SELECTIONS &&
    selectedWords.length <= MAX_MOOD_SELECTIONS &&
    (state === "stopped" || isError);
  const canStop = isPlaying || isBusy;

  const toggleWord = (word: string) => {
    setSelectedWords((prev) => {
      if (prev.includes(word)) {
        return prev.filter((w) => w !== word);
      }
      if (prev.length >= MAX_MOOD_SELECTIONS) {
        return prev;
      }
      return [...prev, word];
    });
  };

  const startGeneration = async () => {
    if (selectedWords.length < MIN_MOOD_SELECTIONS) return;

    const prompt = moodsToPrompt(selectedWords);

    try {
      await socketRef.current?.start(prompt);
    } catch {
      setState("error");
      setStatusMessage("Failed to start playback.");
    }
  };

  const onStop = async () => {
    try {
      await socketRef.current?.stop();
      void socketRef.current?.warm();
    } catch {
      setState("error");
      setStatusMessage("Failed to stop playback.");
    }
  };

  const onReset = () => {
    setSelectedWords([]);
    setResetKey((k) => k + 1);
    if (isPlaying || isBusy) {
      void onStop();
    }
  };

  return (
    <div className="studio-app word-cloud-app">
      <Navbar agentReady={agentReady} onReset={onReset} />

      <main className="word-cloud-main">
        <WordCloud
          resetKey={resetKey}
          selected={selectedWords}
          onToggle={toggleWord}
          onPlay={() => void startGeneration()}
          onStop={() => void onStop()}
          isPlaying={isPlaying}
          isBusy={isBusy}
          canPlay={canPlay}
          canStop={canStop}
          selectionFull={selectionFull}
        />

        <p className="studio-status" role="status">
          {statusMessage}
        </p>
      </main>
    </div>
  );
}
