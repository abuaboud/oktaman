export const AGENT_COLORS = {
  blue: "#4A7DFF",
  green: "#4ADE80",
  orange: "#FB923C",
  pink: "#EC4899",
  indigo: "#6466f1",
  red: "#EF4444",
  slate: "#64748B",
  teal: "#14B8A6",
} as const;

export type AgentColorName = keyof typeof AGENT_COLORS;
export type AgentColorValue = typeof AGENT_COLORS[AgentColorName];

export const AGENT_COLOR_NAMES = Object.keys(AGENT_COLORS) as AgentColorName[];
