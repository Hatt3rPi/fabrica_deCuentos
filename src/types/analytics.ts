export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface GeneralUsageMetrics {
  activeUsers: number;
  storiesGenerated: number;
  charactersCreated: number;
}

export interface PromptPerformanceMetric {
  promptId: string | null;
  promptType: string | null;
  totalExecutions: number;
  successCount: number;
  averageResponseMs: number;
}

export interface TokenUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
}

export interface ModelUsageMetric {
  model: string;
  executions: number;
  successCount: number;
  averageResponseMs: number;
  averageInputTokens: number;
  averageOutputTokens: number;
}

export interface ErrorBreakdownMetric {
  status: string;

  errorType?: string | null;

  count: number;
}

export interface UserUsageMetric {
  userId: string | null;
  userEmail?: string | null;
  executions: number;
  successCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}
