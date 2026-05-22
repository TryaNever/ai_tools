export type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

export type PipelineContext = {
  memory: Array<{ role: "user" | "assistant"; content: string }>;
  [key: string]: any;
};
