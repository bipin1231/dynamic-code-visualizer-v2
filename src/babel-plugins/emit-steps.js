module.exports = function ({ types: t }) {
  function createEmitStep(type, line, description) {
    return t.expressionStatement(
      t.callExpression(t.identifier("emitStep"), [
        t.objectExpression([
          t.objectProperty(t.identifier("type"), t.stringLiteral(type)),
          t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
          t.objectProperty(t.identifier("description"), t.stringLiteral(description)),
          t.objectProperty(
            t.identifier("variables"),
            t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
          ),
        ]),
      ])
    );
  }

  return {
    visitor: {
      VariableDeclaration(path) {
        const line = path.node.loc?.start?.line || 0;

        const declarations = path.node.declarations.map((decl) => {
          const name = decl.id.name;
          const value = decl.init || t.identifier("undefined");

          const assignExpr = t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(
                t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
                t.identifier(name)
              ),
              value
            )
          );

          const emitStep = createEmitStep("variable_declaration", line, `Declare ${name}`);

          return [assignExpr, emitStep];
        });

        const flat = declarations.flat();
        path.replaceWithMultiple(flat);
      },

      AssignmentExpression(path) {
        const line = path.node.loc?.start?.line || 0;
        const left = path.node.left;
        const right = path.node.right;

        if (t.isIdentifier(left)) {
          const assignExpr = t.assignmentExpression(
            "=",
            t.memberExpression(
              t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
              t.identifier(left.name)
            ),
            right
          );

          const emitStep = createEmitStep("variable_assignment", line, `Assign ${left.name}`);

          path.replaceWithMultiple([t.expressionStatement(assignExpr), emitStep]);
        }
      },

UpdateExpression(path) {
  const line = path.node.loc?.start?.line || 0;
  const arg = path.node.argument;

  if (t.isIdentifier(arg)) {
    const updateExpr = t.updateExpression(
      path.node.operator,
      t.memberExpression(
        t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
        t.identifier(arg.name)
      ),
      path.node.prefix
    );

    const operator = path.node.operator;
    const prefix = path.node.prefix;
    const description = prefix
      ? `${operator}${arg.name}`   // prefix form, e.g. ++z
      : `${arg.name}${operator}`;  // postfix form, e.g. z++

    const emitStep = createEmitStep(
      "variable_assignment",
      line,
      description
    );

    path.replaceWithMultiple([t.expressionStatement(updateExpr), emitStep]);
  }
},


      IfStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        const emitStep = createEmitStep("condition", line, "If condition");

        path.insertBefore(emitStep);
      },

      ForStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        const emitStep = createEmitStep("loop_start", line, "For loop start");

        path.insertBefore(emitStep);

        // Instrument the body statements to emit steps before each statement
        const body = path.node.body;

        if (t.isBlockStatement(body)) {
          const newStatements = [];

          body.body.forEach((stmt) => {
            // Insert emitStep before the statement
            const stmtLine = stmt.loc?.start?.line || line;

            const emitStmt = createEmitStep(
              "loop_body_statement",
              stmtLine,
              `Execute line ${stmtLine} inside loop`
            );

            newStatements.push(emitStmt);
            newStatements.push(stmt);
          });

          // Replace loop body with new statements wrapped in a block
          path.get("body").replaceWith(t.blockStatement(newStatements));
        } else {
          // If single statement loop body (no block)
          const stmtLine = body.loc?.start?.line || line;
          const emitStmt = createEmitStep(
            "loop_body_statement",
            stmtLine,
            `Execute line ${stmtLine} inside loop`
          );

          path.get("body").replaceWith(t.blockStatement([emitStmt, body]));
        }
      },

      ReturnStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        const emitStep = createEmitStep("return", line, "Return statement");

        path.insertBefore(emitStep);
      },

      CallExpression(path) {
        // Instrument console.log calls to emit a step before
        if (
          t.isMemberExpression(path.node.callee) &&
          path.node.callee.object.name === "console" &&
          path.node.callee.property.name === "log"
        ) {
          const line = path.node.loc?.start?.line || 0;

          const emitStep = createEmitStep("log", line, "console.log call");

          path.insertBefore(emitStep);
        }
      },
    },
  };
};
