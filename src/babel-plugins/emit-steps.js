module.exports = function ({ types: t }) {
  return {
    visitor: {
      VariableDeclaration(path) {
        const line = path.node.loc?.start?.line || 0;

        const declarations = path.node.declarations.map((decl) => {
          const name = decl.id.name;
          const value = decl.init || t.identifier("undefined");

          // window.__variables__.x = value;
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

          // emit step
          const emitStep = t.expressionStatement(
            t.callExpression(t.identifier("emitStep"), [
              t.objectExpression([
                t.objectProperty(t.identifier("type"), t.stringLiteral("variable_declaration")),
                t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
                t.objectProperty(t.identifier("description"), t.stringLiteral(`Declare ${name}`)),
                t.objectProperty(
                  t.identifier("variables"),
                  t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
                ),
              ]),
            ])
          );

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
          // Replace x = ... → window.__variables__.x = ...
          const assignExpr = t.assignmentExpression(
            "=",
            t.memberExpression(
              t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
              t.identifier(left.name)
            ),
            right
          );

          const emitStep = t.expressionStatement(
            t.callExpression(t.identifier("emitStep"), [
              t.objectExpression([
                t.objectProperty(t.identifier("type"), t.stringLiteral("variable_assignment")),
                t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
                t.objectProperty(t.identifier("description"), t.stringLiteral(`Assign ${left.name}`)),
                t.objectProperty(
                  t.identifier("variables"),
                  t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
                ),
              ]),
            ])
          );

          path.replaceWithMultiple([t.expressionStatement(assignExpr), emitStep]);
        }
      },

      IfStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        const emitStep = t.expressionStatement(
          t.callExpression(t.identifier("emitStep"), [
            t.objectExpression([
              t.objectProperty(t.identifier("type"), t.stringLiteral("condition")),
              t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
              t.objectProperty(t.identifier("description"), t.stringLiteral("If condition")),
              t.objectProperty(
                t.identifier("variables"),
                t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
              ),
            ]),
          ])
        );

        path.insertBefore(emitStep);
      },

      ForStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        const emitStep = t.expressionStatement(
          t.callExpression(t.identifier("emitStep"), [
            t.objectExpression([
              t.objectProperty(t.identifier("type"), t.stringLiteral("loop_start")),
              t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
              t.objectProperty(t.identifier("description"), t.stringLiteral("For loop start")),
              t.objectProperty(
                t.identifier("variables"),
                t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
              ),
            ]),
          ])
        );

        path.insertBefore(emitStep);
      },

      ReturnStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        const emitStep = t.expressionStatement(
          t.callExpression(t.identifier("emitStep"), [
            t.objectExpression([
              t.objectProperty(t.identifier("type"), t.stringLiteral("return")),
              t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
              t.objectProperty(t.identifier("description"), t.stringLiteral("Return statement")),
              t.objectProperty(
                t.identifier("variables"),
                t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
              ),
            ]),
          ])
        );

        path.insertBefore(emitStep);
      },
    },
  };
};
