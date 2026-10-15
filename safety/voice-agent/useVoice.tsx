"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TOOL_ARGS, parseToolCall, type Activity, type ToolCall, type ToolName } from "./tools";

// The browser side of a voice talk (D-068, D-069): the only client code that touches the ElevenLabs SDK
// (the lint rule keeps provider SDKs under safety/). It asks our session gate for a token (every check
// is on the server), connects over WebRTC, and hands validated client tool calls to the screen.
// Feelio's words were checked by our safety proxy before ElevenLabs spoke them. No audio is stored by us,
// and the child's own words are never shown or kept by the app.

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended" | "lost";
export type StartResult = { ok: true } | { ok: false; reason: string };

const ALL_TOOLS = Object.keys(TOOL_ARGS) as ToolName[];
/** After this long with nobody speaking, the screen shows a soft "I'm here when you're ready". */
const QUIET_MS = 10_000;
/** Microphone level that counts as the child speaking, and the pause that ends their turn (screen only). */
const SPEECH_LEVEL = 0.06;
const TURN_PAUSE_MS = 700;
/** If Feelio hasn't started to answer by then, the screen goes back to listening. */
const THINKING_MAX_MS = 6000;

async function post(body: unknown): Promise<Response> {
  return fetch("/api/child/voice/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  return <ConversationProvider>{children}</ConversationProvider>;
}

export function useFeelioVoice({ onTool, purpose = "talk" }: { onTool: (call: ToolCall) => void; purpose?: "talk" | "story" }) {
  const conv = useConversation();
  const [state, setState] = useState<VoiceState>("idle");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [allowed, setAllowed] = useState(0);
  /** Feelio's latest sentence (already checked by our safety proxy), for the caption. */
  const [caption, setCaption] = useState<string | null>(null);
  const [quiet, setQuiet] = useState(false);
  const session = useRef<string | null>(null);
  const lastActivity = useRef(0);
  const toolRef = useRef(onTool);
  useEffect(() => {
    toolRef.current = onTool;
  }, [onTool]);

  const touch = () => {
    lastActivity.current = Date.now();
    setQuiet(false);
  };

  const finish = useCallback((how: "ended" | "lost") => {
    const id = session.current;
    session.current = null;
    setDeadline(null);
    setQuiet(false);
    setState((s) => (s === "idle" ? s : how));
    if (id) void post({ action: "end", sessionId: id }).catch(() => {});
  }, []);

  const start = useCallback(
    async (placeId?: string, after?: Activity | null): Promise<StartResult> => {
      if (session.current) return { ok: false, reason: "busy" };
      setState("connecting");
      setCaption(null);
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
        res = await post({ action: "start", purpose, ...(placeId ? { placeId } : {}) });
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
      setAllowed(data.allowedSeconds);
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
        // Lets our proxy find this session (ElevenLabs passes it to the custom LLM as elevenlabs_extra_body),
        // and tells Feelio which calm activity the child just finished (an id; the proxy checks the list, D-076).
        customLlmExtraBody: { feelio_session: sessionId, ...(after ? { feelio_after: after } : {}) },
        clientTools,
        onConnect: ({ conversationId }) => {
          touch();
          conv.setMuted(false);
          setState("listening");
          void post({ action: "bind", sessionId, conversationId }).catch(() => {});
        },
        onModeChange: ({ mode }) => {
          touch();
          // A new answer starts: its own words arrive just after, so the old caption never flashes.
          if (mode === "speaking") setCaption(null);
          setState(mode === "speaking" ? "speaking" : "listening");
        },
        onMessage: (m) => {
          touch();
          // Only Feelio's words are shown; the child's own words are never displayed or kept.
          if (m.role !== "user" && m.source !== "user") setCaption(m.message);
        },
        onDisconnect: (d) => finish(d.reason === "error" ? "lost" : "ended"),
        onError: () => finish("lost"),
      });
      return { ok: true };
    },
    [conv, finish, purpose],
  );

  /** Mutes the child's microphone during a game, so Feelio doesn't hear the guidance or the breathing (D-076). */
  const setMuted = conv.setMuted;
  const mute = useCallback((m: boolean) => {
    if (session.current) setMuted(m);
  }, [setMuted]);

  /** Tells Feelio something the child did on screen (a fact for context; Feelio doesn't answer it). */
  const context = useCallback((text: string) => conv.sendContextualUpdate(text), [conv]);

  const stop = useCallback(() => {
    conv.endSession();
    finish("ended");
  }, [conv, finish]);

  // The session's time is enforced by the server on every turn; this only closes the line on time.
  useEffect(() => {
    if (!deadline) return;
    const t = setTimeout(stop, Math.max(0, deadline - Date.now()) + 4000);
    return () => clearTimeout(t);
  }, [deadline, stop]);

  // While listening, the microphone level tells the screen what is happening (locally, nothing is sent
  // by this): the child speaking keeps the quiet hint away and clears the old caption; a pause after
  // speech means Feelio is thinking. A soft hint shows after a quiet while (ElevenLabs ends the call
  // itself after 30 s of silence).
  const getInput = conv.getInputVolume;
  useEffect(() => {
    if (state !== "listening" && state !== "thinking") return;
    let spoke = false;
    let lastVoice = 0;
    const thinkingSince = Date.now(); // this effect restarts on every state change
    const i = setInterval(() => {
      const now = Date.now();
      if ((getInput() || 0) > SPEECH_LEVEL) {
        spoke = true;
        lastVoice = now;
        touch();
        setCaption(null);
        if (state === "thinking") setState("listening");
        return;
      }
      if (state === "listening" && spoke && now - lastVoice > TURN_PAUSE_MS) {
        spoke = false;
        setState("thinking");
        return;
      }
      if (state === "thinking" && now - thinkingSince > THINKING_MAX_MS) setState("listening");
      if (state === "listening") setQuiet(now - lastActivity.current > QUIET_MS);
    }, 120);
    return () => clearInterval(i);
  }, [state, getInput]);

  // Leaving the screen ends the talk.
  useEffect(() => () => void (session.current && post({ action: "end", sessionId: session.current }).catch(() => {})), []);

  return { state, deadline, allowed, caption, quiet, start, stop, context, mute, outputVolume: conv.getOutputVolume, inputVolume: conv.getInputVolume };
}
