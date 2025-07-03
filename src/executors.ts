export class LanguageExecutor {
  executeJavaScript(code: string) {
    try {
      // Create context with proxy tracking
      const context = {
        __variables__: {},  // Initialize as empty object
        emitStep: (window as any).emitStep
      };

      // Create proxy handler
      const handler = {
        get(target: any, prop: string) {
          return target[prop];
        },
        set(target: any, prop: string, value: any) {
          target[prop] = value;
          // Emit variable update step
          context.emitStep({
            type: 'variable_update',
            description: `${prop} = ${value}`,
            line: 0 // Line number will be added by Babel plugin
          });
          return true;
        }
      };

      // Create proxy for variable tracking
      context.__variables__ = new Proxy(context.__variables__, handler);

      // Create execution function
      const func = new Function('context', `
        // Make context available
        const { __variables__, emitStep } = context;
        
        // Create global proxy for variable access
        const globalProxy = new Proxy({}, {
          get(_, prop) {
            return __variables__[prop];
          },
          set(_, prop, value) {
            __variables__[prop] = value;
            return true;
          }
        });
        
        // Run code in proxy context
        (function(global) {
          with(global) {
            try {
              ${code}
            } catch(e) {
              emitStep({
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
        line: 0,
        description: `Error: ${e?.message || 'Unknown error'}`
      });
    }
  }
}