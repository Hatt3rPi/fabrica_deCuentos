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
