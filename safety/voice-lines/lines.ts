// Fixed mascot lines that get pre-generated audio (D-037). Key = audio file name (public/audio/<locale>/
// <key>.mp3, the audioKey used in the UI); value = message path(s) in messages/<locale>.json ("+" joins).
// Lines with variables (a name, a place) are not pre-generated; they show as captions only.
export const VOICE_LINES: Record<string, string> = {
  onb_hello: "child.onb.hello",
  onb_pickColour: "child.onb.pickColour",
  onb_pickCompanion: "child.onb.pickCompanion",
  onb_pickName: "child.onb.pickName",
  onb_likes: "child.onb.likes",
  onb_micAsk: "child.onb.micAsk",
  onb_micSay: "child.onb.micSay",
  onb_micHeard: "child.onb.micHeard",
  onb_micNo: "child.onb.micNo",
  onb_micOff: "child.onb.micOff",
  onb_gate: "child.onb.gate",
  onb_welcome: "child.onb.welcome",
  home_notSetUp: "child.notSetUpTitle+child.notSetUpBody",
  soon_talk: "child.soon.talk",
  soon_stories: "child.soon.stories",
  soon_calm: "child.soon.calm",
  collection_intro: "child.collection.intro",
  offline_line: "child.offline.line",
  time_up: "child.timeUp",
};
