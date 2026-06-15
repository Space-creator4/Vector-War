import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api/client.js";
import TacticalMap from "./map/TacticalMap.jsx";
import CommandPanel from "./ui/CommandPanel.jsx";
import { useGameSocket } from "./websocket/useGameSocket.js";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("vector-war-token") || "");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [httpState, setHttpState] = useState(null);
  const [error, setError] = useState("");
  const socket = useGameSocket(token);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("token");
    if (!incoming) return;
    localStorage.setItem("vector-war-token", incoming);
    setToken(incoming);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!token) return;
    api("/state", { token })
      .then(setHttpState)
      .catch((err) => setError(err.message));
  }, [token]);

  const gameState = socket.state || httpState;
  const selectedLiveUnit = useMemo(
    () => gameState?.units?.find((unit) => unit.unit_id === selectedUnit?.unit_id) || selectedUnit,
    [gameState?.units, selectedUnit]
  );

  const createCountry = useCallback(async () => {
    setError("");
    try {
      const name = `Country ${Math.floor(Math.random() * 9000 + 1000)}`;
      await api("/create-platoon", {
        token,
        method: "POST",
        body: { name, lat: 51.5072, lng: -0.1276 }
      });
      setHttpState(await api("/state", { token }));
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const sendMove = useCallback(async () => {
    if (!selectedLiveUnit || !pendingTarget) return;
    setError("");
    try {
      await api("/command", {
        token,
        method: "POST",
        body: {
          unit_id: selectedLiveUnit.unit_id,
          end_lat: pendingTarget.lat,
          end_lng: pendingTarget.lng
        }
      });
      setPendingTarget(null);
    } catch (err) {
      setError(err.message);
    }
  }, [pendingTarget, selectedLiveUnit, token]);

  return (
    <main className="app-shell">
      <TacticalMap
        units={gameState?.units || []}
        selectedUnitId={selectedLiveUnit?.unit_id}
        onSelectUnit={setSelectedUnit}
        onMapCommand={setPendingTarget}
      />
      <CommandPanel
        token={token}
        connected={socket.connected}
        gameState={gameState}
        selectedUnit={selectedLiveUnit}
        pendingTarget={pendingTarget}
        events={socket.events}
        onCreateCountry={createCountry}
        onSendMove={sendMove}
      />
      {error && <div className="toast">{error}</div>}
    </main>
  );
}
