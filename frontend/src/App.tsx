import { useCallback, useEffect, useRef, useState } from "react";
import {
  MusicSocket,
  type ServerState,
  type StatusPayload,
} from "./api/musicSocket";
import { MoodWheel } from "./components/MoodWheel";
import {
  buildMoodPrompt,
  getMoodById,
  type MoodEntry,
  type MoodSectorId,
} from "./data/moods";

const DEFAULT_MOOD_ID = "joyful";

export default function App() {
  const [selectedMoodId, setSelectedMoodId] = useState<string>(DEFAULT_MOOD_ID);
  const [lastPlayedPrompt, setLastPlayedPrompt] = useState("");
  const [state, setState] = useState<ServerState>("stopped");
  const [statusMessage, setStatusMessage] = useState(
    "Tap a mood or press play to begin."
  );
  const socketRef = useRef<MusicSocket | null>(null);
  const steerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    socketRef.current = new MusicSocket(handleStatus, handleClose);
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [handleStatus, handleClose]);

  const selectedMood = getMoodById(selectedMoodId) ?? getMoodById(DEFAULT_MOOD_ID)!;
  const activeSector: MoodSectorId | null = selectedMood.sector;

  const isPlaying = state === "playing";
  const isBusy = state === "connecting";

  const startMood = useCallback(async (mood: MoodEntry) => {
    const prompt = buildMoodPrompt(mood);
    try {
      setLastPlayedPrompt(prompt);
      await socketRef.current?.start(prompt);
      setStatusMessage(`Playing ${mood.label.toLowerCase()}…`);
    } catch {
      setState("error");
      setStatusMessage("Failed to start playback.");
    }
  }, []);

  const steerMood = useCallback(async (mood: MoodEntry) => {
    const prompt = buildMoodPrompt(mood);
    if (prompt === lastPlayedPrompt) return;

    try {
      await socketRef.current?.steer(prompt);
      setLastPlayedPrompt(prompt);
      setStatusMessage(`Shifting to ${mood.label.toLowerCase()}…`);
    } catch {
      setState("error");
      setStatusMessage("Failed to update sound.");
    }
  }, [lastPlayedPrompt]);

  const onSelectMood = useCallback(
    (mood: MoodEntry) => {
      setSelectedMoodId(mood.id);

      if (steerTimerRef.current) {
        clearTimeout(steerTimerRef.current);
      }

      if (isPlaying) {
        steerTimerRef.current = setTimeout(() => {
          void steerMood(mood);
        }, 250);
        return;
      }

      if (!isBusy && (state === "stopped" || state === "error")) {
        void startMood(mood);
      }
    },
    [isPlaying, isBusy, state, startMood, steerMood]
  );

  const onPlayStop = useCallback(async () => {
    if (isPlaying || isBusy) {
      try {
        await socketRef.current?.stop();
        setStatusMessage("Playback stopped.");
      } catch {
        setState("error");
        setStatusMessage("Failed to stop playback.");
      }
      return;
    }

    void startMood(selectedMood);
  }, [isPlaying, isBusy, selectedMood, startMood]);

  return (
    <MoodWheel
      selectedMoodId={selectedMoodId}
      activeSector={activeSector}
      state={state}
      statusMessage={statusMessage}
      onSelectMood={onSelectMood}
      onPlayStop={() => void onPlayStop()}
    />
  );
}
