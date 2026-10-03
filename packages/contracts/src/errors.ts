export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, string[] | undefined>;
}
