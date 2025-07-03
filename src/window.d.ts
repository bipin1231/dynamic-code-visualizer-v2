declare global {
  interface Window {
    emitStep: (step: Partial<any>) => void;
    __variables__: Record<string, any>;
  }
}
export {};