export class LanguageExecutor {
  executeJavaScript(code: string) {
    try {
      // Create context with proxy tracking
      const context = {
        __variables__: {},
        emitStep: (window as any).emitStep
      };

      // Create proxy handler
      const handler = {
        get(target: any, prop: string) {
          // Avoid proxying internal properties
          if (prop === '__isProxy') return true;
          return target[prop];
        },
        set(target: any, prop: string, value: any) {
          // Avoid infinite recursion on proxy properties
          if (prop === '__isProxy') return true;
          
          target[prop] = value;
          return true;
        }
      };

      // Create proxy for variable tracking
      context.__variables__ = new Proxy(context.__variables__, handler);

      // Create execution function
      const func = new Function('context', `
        // Create safe reference to emitStep
        const safeEmitStep = context.emitStep;
        
        // Create safe global proxy
        const globalProxy = new Proxy({}, {
          get(_, prop) {
            return context.__variables__[prop];
          },
          set(_, prop, value) {
            context.__variables__[prop] = value;
            return true;
          }
        });
        
        // Execute in a protected context
        (function(global) {
          with(global) {
            try {
              ${code}
              safeEmitStep({
                type: 'program_complete',
                description: 'Program completed successfully'
              });
            } catch(e) {
              safeEmitStep({
                type: 'error',
                description: 'Error: ' + e.message
              });
            }
          }
        })(globalProxy);
      `);
      
      // Execute the code
      func(context);
    } catch (e: any) {
      console.error('Execution error:', e);
      // Emit an error step
      (window as any).emitStep({
        type: 'error',
        description: `Error: ${e?.message || 'Unknown error'}`
      });
    }
  }
}