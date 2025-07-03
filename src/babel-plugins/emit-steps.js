module.exports = function ({ types: t }) {
  // Helper to check if should skip instrumentation
  function shouldSkip(path) {
    return path.findParent(p => 
      p.isCallExpression() && 
      p.node.callee && 
      p.node.callee.name === 'emitStep'
    );
  }
  
  // Helper function to avoid duplication
  function createEmitStep(t, type, line, description) {
    return t.expressionStatement(
      t.callExpression(t.identifier('emitStep'), [
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral(type)),
          t.objectProperty(t.identifier('line'), t.numericLiteral(line)),
          t.objectProperty(t.identifier('description'), t.stringLiteral(description))
        ])
      ])
    );
  }
  
  // Helper to generate source code for AST nodes
  function generateCode(node) {
    if (!node) return '';
    
    // Simple code generation for common node types
    if (t.isIdentifier(node)) {
      return node.name;
    }
    if (t.isLiteral(node)) {
      return String(node.value);
    }
    if (t.isBinaryExpression(node)) {
      return `${generateCode(node.left)} ${node.operator} ${generateCode(node.right)}`;
    }
    if (t.isCallExpression(node)) {
      return `${generateCode(node.callee)}(${node.arguments.map(generateCode).join(', ')})`;
    }
    
    // Fallback to node type
    return node.type;
  }

  return {
    visitor: {
      Program: {
        enter(path) {
          // Add a check to make sure we don't double-instrument
          if (path.node.__instrumented) return;
          path.node.__instrumented = true;
        }
      },
      
      // Existing visitors
      AssignmentExpression(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const varName = path.node.left?.name || 'unknown';
        const valueCode = generateCode(path.node.right);
       
        const emitCall = createEmitStep(
          t, 
          'variable_assignment', 
          line, 
          `${varName} = ${valueCode}`
        );
        
        path.insertAfter(emitCall);
      },
     
      VariableDeclaration(path) {
        if (shouldSkip(path)) return;
        
        const declarations = path.node.declarations;
        const emitCalls = [];
        
        declarations.forEach(declarator => {
          if (declarator.init) {
            const line = declarator.loc?.start?.line || path.node.loc?.start?.line || 0;
            const varName = declarator.id?.name || 'unknown';
            const valueCode = generateCode(declarator.init);
           
            const emitCall = createEmitStep(
              t, 
              'variable_declaration', 
              line, 
              `Declared ${varName} = ${valueCode}`
            );
            
            emitCalls.push(emitCall);
          }
        });
        
        emitCalls.forEach(emitCall => {
          path.insertAfter(emitCall);
        });
      },
     
      CallExpression(path) {
        if (shouldSkip(path)) return;
        
        const functionName = path.node.callee?.name || 
          (path.node.callee?.object?.name === 'console' ? 'console' : 'unknown');
                           
        if (functionName === 'emitStep' || functionName === 'console') {
          return;
        }
        
        const line = path.node.loc?.start?.line || 0;
        const args = path.node.arguments.map(generateCode).join(', ');
       
        const emitCall = createEmitStep(
          t, 
          'function_call', 
          line, 
          `Called ${functionName}(${args})`
        );
        
        path.insertBefore(emitCall);
      },
      
      // New visitors
      IfStatement(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const testCode = generateCode(path.node.test);
        
        const emitEnter = createEmitStep(
          t, 
          'condition_enter', 
          line, 
          `Evaluating if: ${testCode}`
        );
        path.insertBefore(emitEnter);
        
        if (path.node.alternate) {
          const emitElse = createEmitStep(
            t, 
            'condition_else', 
            line, 
            'Entering else block'
          );
          
          if (t.isBlockStatement(path.node.alternate)) {
            path.get('alternate').unshiftContainer('body', emitElse);
          } else {
            path.get('alternate').insertBefore(emitElse);
          }
        }
      },
      
      ForStatement(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const initCode = generateCode(path.node.init);
        const testCode = generateCode(path.node.test);
        const updateCode = generateCode(path.node.update);
        
        const emitLoopStart = createEmitStep(
          t, 
          'loop_start', 
          line, 
          `Starting loop: for(${initCode}; ${testCode}; ${updateCode})`
        );
        path.insertBefore(emitLoopStart);
        
        const emitIteration = createEmitStep(
          t, 
          'loop_iteration', 
          line, 
          'Loop iteration'
        );
        
        if (t.isBlockStatement(path.node.body)) {
          path.get('body').unshiftContainer('body', emitIteration);
        } else {
          // Wrap single statement in a block
          const block = t.blockStatement([emitIteration, path.node.body]);
          path.get('body').replaceWith(block);
        }
      },
      
      WhileStatement(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const testCode = generateCode(path.node.test);
        
        const emitLoopStart = createEmitStep(
          t, 
          'loop_start', 
          line, 
          `Starting loop: while(${testCode})`
        );
        path.insertBefore(emitLoopStart);
        
        const emitIteration = createEmitStep(
          t, 
          'loop_iteration', 
          line, 
          'Loop iteration'
        );
        
        if (t.isBlockStatement(path.node.body)) {
          path.get('body').unshiftContainer('body', emitIteration);
        } else {
          const block = t.blockStatement([emitIteration, path.node.body]);
          path.get('body').replaceWith(block);
        }
      },
      
      FunctionDeclaration(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const funcName = path.node.id?.name || 'anonymous';
        const params = path.node.params.map(p => generateCode(p)).join(', ');
        
        const emitFunc = createEmitStep(
          t, 
          'function_definition', 
          line, 
          `Defined function ${funcName}(${params})`
        );
        path.insertAfter(emitFunc);
      },
      
      ReturnStatement(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const valueCode = generateCode(path.node.argument);
        
        const emitReturn = createEmitStep(
          t, 
          'return', 
          line, 
          `Returning: ${valueCode}`
        );
        path.insertBefore(emitReturn);
      },
      
      ThrowStatement(path) {
        if (shouldSkip(path)) return;
        
        const line = path.node.loc?.start?.line || 0;
        const errorCode = generateCode(path.node.argument);
        
        const emitThrow = createEmitStep(
          t, 
          'error', 
          line, 
          `Throwing error: ${errorCode}`
        );
        path.insertBefore(emitThrow);
      }
    }
  };
};