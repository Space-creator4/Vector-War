import { Crosshair, LogIn, RadioTower, Send, ShieldPlus, Wifi, WifiOff } from "lucide-react";
import { UNIT_TYPES } from "../../../shared/constants/game.js";
import { authUrl } from "../api/client.js";

export default function CommandPanel({
  token,
  connected,
  gameState,
  selectedUnit,
  pendingTarget,
  events,
  onCreateCountry,
  onSendMove
}) {
  const me = gameState?.me;

  return (
    <aside className="command-panel">
      <header className="panel-header">
        <div>
          <h1>Vector War</h1>
          <p>{me ? `${me.username} · ${me.role}` : "Real-time command"}</p>
        </div>
        <div className={connected ? "socket ok" : "socket"}>
          {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>
      </header>

      {!token ? (
        <a className="primary-action" href={authUrl()}>
          <LogIn size={18} />
          Login with Discord
        </a>
      ) : !me?.country_id ? (
        <button className="primary-action" onClick={onCreateCountry}>
          <ShieldPlus size={18} />
          Spawn Country
        </button>
      ) : (
        <section className="status-grid">
          <div>
            <span>Units</span>
            <strong>{gameState?.units?.length ?? 0}</strong>
          </div>
          <div>
            <span>Orders</span>
            <strong>{gameState?.orders?.length ?? 0}</strong>
          </div>
        </section>
      )}

      <section className="unit-card">
        <div className="section-title">
          <Crosshair size={17} />
          Selection
        </div>
        {selectedUnit ? (
          <>
            <div className="selected-unit">
              <span className="selected-symbol">{UNIT_TYPES[selectedUnit.type]?.icon || "●"}</span>
              <div>
                <strong>{UNIT_TYPES[selectedUnit.type]?.label || "Unknown Contact"}</strong>
                <p>{selectedUnit.health ?? "?"}% strength</p>
              </div>
            </div>
            <button className="secondary-action" disabled={!pendingTarget} onClick={onSendMove}>
              <Send size={17} />
              Move to Target
            </button>
            {pendingTarget && <p className="coordinates">{pendingTarget.lat.toFixed(4)}, {pendingTarget.lng.toFixed(4)}</p>}
          </>
        ) : (
          <p className="muted">Select a blue unit, then click the map to set a destination.</p>
        )}
      </section>

      <section>
        <div className="section-title">
          <RadioTower size={17} />
          Combat Feed
        </div>
        <div className="event-list">
          {events.length === 0 && <p className="muted">Awaiting contact.</p>}
          {events.map((event, index) => (
            <div className="event-row" key={`${event.type}-${index}`}>
              <strong>{event.type.replaceAll("_", " ")}</strong>
              <span>{event.damage ? `${event.damage} damage` : event.unit_id || event.order_id || "live"}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
