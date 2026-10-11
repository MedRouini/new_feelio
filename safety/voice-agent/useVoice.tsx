"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TOOL_ARGS, parseToolCall, type ToolCall, type ToolName } from "./tools";

// The browser side of a voice talk (D-068): the only client code that touches the ElevenLabs SDK (the
// lint rule keeps provider SDKs under safety/). It asks our session gate for a token (every check is on
// the server), connects over WebRTC, and hands validated client tool calls to the screen. Feelio's
// words were checked by our safety proxy before ElevenLabs spoke them. No audio is stored by us.

export type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "ended";
export type StartResult = { ok: true } | { ok: false; reason: string };

const ALL_TOOLS = Object.keys(TOOL_ARGS) as ToolName[];

async function post(body: unknown): Promise<Response> {
  return fetch("/api/child/voice/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  return <ConversationProvider>{children}</ConversationProvider>;
}

export function useFeelioVoice({ onTool }: { onTool: (call: ToolCall) => void }) {
  const conv = useConversation();
  const [state, setState] = useState<VoiceState>("idle");
  const [deadline, setDeadline] = useState<number | null>(null);
  const session = useRef<string | null>(null);
  const toolRef = useRef(onTool);
  useEffect(() => {
    toolRef.current = onTool;
  }, [onTool]);

  const finish = useCallback(() => {
    const id = session.current;
    session.current = null;
    setDeadline(null);
    setState((s) => (s === "idle" ? s : "ended"));
    if (id) void post({ action: "end", sessionId: id }).catch(() => {});
  }, []);

  const start = useCallback(
    async (placeId?: string): Promise<StartResult> => {
      if (session.current) return { ok: false, reason: "busy" };
      setState("connecting");
      // Ask for the microphone first, so a refusal is explained kindly instead of failing later.
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        mic.getTracks().forEach((t) => t.stop());
      } catch {
        setState("idle");
        return { ok: false, reason: "mic" };
      }
      let res: Response;
      try {
        res = await post({ action: "start", ...(placeId ? { placeId } : {}) });
      } catch {
        setState("idle");
        return { ok: false, reason: "unavailable" };
      }
      const data = (await res.json().catch(() => ({}))) as { token?: string; sessionId?: string; allowedSeconds?: number; error?: string };
      if (!res.ok || !data.token || !data.sessionId || !data.allowedSeconds) {
        setState("idle");
        return { ok: false, reason: data.error ?? "unavailable" };
      }
      session.current = data.sessionId;
      setDeadline(Date.now() + data.allowedSeconds * 1000);

      const clientTools = Object.fromEntries(
        ALL_TOOLS.map((name) => [
          name,
          (params: unknown) => {
            // The proxy already allowed it; checked again here because it arrives over the network.
            const call = parseToolCall(name, params, ALL_TOOLS);
            if (call) toolRef.current(call);
          },
        ]),
      );
      const sessionId = data.sessionId;
      conv.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
        // Lets our proxy find this session (ElevenLabs passes it to the custom LLM as elevenlabs_extra_body).
        customLlmExtraBody: { feelio_session: sessionId },
        clientTools,
        onConnect: ({ conversationId }) => {
          setState("listening");
          void post({ action: "bind", sessionId, conversationId }).catch(() => {});
        },
        onModeChange: ({ mode }) => setState(mode === "speaking" ? "speaking" : "listening"),
        onDisconnect: () => finish(),
        onError: () => finish(),
      });
      return { ok: true };
    },
    [conv, finish],
  );

  const stop = useCallback(() => {
    conv.endSession();
    finish();
  }, [conv, finish]);

  // The session's time is enforced by the server on every turn; this only closes the line on time.
  useEffect(() => {
    if (!deadline) return;
    const t = setTimeout(stop, Math.max(0, deadline - Date.now()) + 4000);
    return () => clearTimeout(t);
  }, [deadline, stop]);

  // Leaving the screen ends the talk.
  useEffect(() => () => void (session.current && post({ action: "end", sessionId: session.current }).catch(() => {})), []);

  return { state, deadline, start, stop, outputVolume: conv.getOutputVolume };
}
