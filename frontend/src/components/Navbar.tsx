interface NavbarProps {
  agentReady: boolean;
  onReset: () => void;
}

export function Navbar({ agentReady, onReset }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon" aria-hidden="true">
          ⚗
        </span>
        <span className="brand-text">BEATLAB AI</span>
      </div>

      <div className="navbar-links">
        <a href="#" className="nav-link active">
          Studio
        </a>
        <a href="#" className="nav-link">
          Vault
        </a>
        <a href="#" className="nav-link">
          Collab
        </a>
      </div>

      <div className="navbar-status">
        <span
          className={`agent-badge ${agentReady ? "ready" : "busy"}`}
          title={agentReady ? "Agent ready" : "Agent busy"}
        >
          <span className="agent-dot" />
          {agentReady ? "AGENT READY" : "AGENT BUSY"}
        </span>
        <button
          type="button"
          className="reset-btn"
          onClick={onReset}
          aria-label="Reset selections and playback"
        >
          Reset
        </button>
      </div>
    </nav>
  );
}
