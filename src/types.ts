export interface ExecutionStep {
  id: string;
  type: string;
  description: string;
  line: number;
  variables: Record<string, any>;
  conditionValue?:boolean;
}
