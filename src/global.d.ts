// global.d.ts
export {};

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker: (_moduleId: string, label: string) => Worker;
    };
  }

  interface WorkerGlobalScope {
    MonacoEnvironment?: {
      getWorker: (_moduleId: string, label: string) => Worker;
    };
  }

  // Extend self to include MonacoEnvironment
  var self: WorkerGlobalScope & typeof globalThis;
}
