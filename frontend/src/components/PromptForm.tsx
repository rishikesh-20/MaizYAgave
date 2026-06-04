interface PromptFormProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PromptForm({ value, onChange, disabled }: PromptFormProps) {
  return (
    <div>
      <label className="prompt-label" htmlFor="music-prompt">
        Describe the music
      </label>
      <textarea
        id="music-prompt"
        className="prompt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Minimal techno, driving kick, dark synth pads, 128 BPM"
        rows={4}
      />
    </div>
  );
}
