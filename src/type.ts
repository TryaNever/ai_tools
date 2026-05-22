export type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

export type PipelineContext = Record<
  string,
  ToolResult
>;