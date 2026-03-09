import { useState, useEffect, useRef } from "react";
import { getOfflineCacheStatus, cacheAllOfflineAssets } from "../utils/offlineCache";
import { THEME } from "../theme";

interface Props {
  onClose: () => void;
}

type Phase = "checking" | "idle" | "downloading" | "done";

export function OfflineCacheModal({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [cached, setCached] = useState(0);
  const [total, setTotal] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    getOfflineCacheStatus().then((status) => {
      setCached(status.cached);
      setTotal(status.total);
      setPhase("idle");
    });
  }, []);

  async function handleDownload() {
    cancelledRef.current = false;
    setPhase("downloading");
    await cacheAllOfflineAssets((done, total) => {
      setCached(done);
      setTotal(total);
    }, cancelledRef);
    if (!cancelledRef.current) setPhase("done");
  }

  const progressPct = total > 0 ? Math.round((cached / total) * 100) : 0;
  const allCached = cached >= total && total > 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== "downloading") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: THEME.bg.panel,
          border: `1px solid ${THEME.border.medium}`,
          borderRadius: 12,
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Heading */}
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: THEME.text.primary,
            ...THEME.heading,
          }}
        >
          {phase === "done" || (phase === "idle" && allCached)
            ? "Offline Ready"
            : "Enable Offline Play"}
        </div>

        {phase === "checking" && (
          <p style={{ margin: 0, color: THEME.text.secondary, fontSize: 14, lineHeight: 1.6 }}>
            Checking cache...
          </p>
        )}

        {phase === "idle" && !allCached && (
          <p style={{ margin: 0, color: THEME.text.secondary, fontSize: 14, lineHeight: 1.6 }}>
            Sprites and game data are cached automatically after your first
            visit.
            <span style={{ display: "block", marginTop: 8 }}>
              Download all backgrounds, music, and sound effects (~33 MB) so
              every part of the game works offline.
            </span>
            {cached > 0 && (
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  color: THEME.text.tertiary,
                }}
              >
                {cached} of {total} already cached.
              </span>
            )}
          </p>
        )}

        {phase === "idle" && allCached && (
          <p style={{ margin: 0, color: "#4ade80", fontSize: 14, lineHeight: 1.6 }}>
            All {total} files are cached. The game is fully playable offline.
          </p>
        )}

        {phase === "downloading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, color: THEME.text.secondary, fontSize: 14 }}>
              Downloading... {cached} / {total} files
            </p>
            <div
              style={{
                height: 8,
                background: THEME.bg.elevated,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: THEME.accent,
                  borderRadius: 4,
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>
        )}

        {phase === "done" && (
          <p style={{ margin: 0, color: "#4ade80", fontSize: 14, lineHeight: 1.6 }}>
            All {total} files are now cached. The game is fully playable
            offline.
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          {phase === "idle" && !allCached && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 20px",
                  ...THEME.button.secondary,
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: "8px 20px",
                  ...THEME.button.primary,
                  fontSize: 14,
                }}
              >
                Download All
              </button>
            </>
          )}
          {(phase === "idle" && allCached) || phase === "done" ? (
            <button
              onClick={onClose}
              style={{
                padding: "8px 20px",
                ...THEME.button.primary,
                fontSize: 14,
              }}
            >
              Close
            </button>
          ) : null}
          {phase === "downloading" && (
            <button
              onClick={() => {
                cancelledRef.current = true;
                onClose();
              }}
              style={{
                padding: "8px 20px",
                ...THEME.button.secondary,
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
