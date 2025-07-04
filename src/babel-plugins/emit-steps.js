const template = require("@babel/template").default;
const generate = require("@babel/generator").default;

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program(path) {
        if (path.node.__instrumented) return;
        path.node.__instrumented = true;
      },

      VariableDeclaration(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;

        const steps = node.declarations.map((declarator) => {
          const varName = declarator.id.name;
          const init = declarator.init || t.identifier("undefined");

          return t.expressionStatement(
            t.callExpression(t.identifier("emitStep"), [
              t.objectExpression([
                t.objectProperty(t.identifier("type"), t.stringLiteral("variable_declaration")),
                t.objectProperty(
                  t.identifier("description"),
                  t.binaryExpression(
                    "+",
                    t.stringLiteral(`Declared variable '${varName}' with initial value: `),
                    t.callExpression(
                      t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
                      [init]
                    )
                  )
                ),
                t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
                t.objectProperty(
                  t.identifier("variables"),
                  t.objectExpression([
                    t.objectProperty(t.identifier(varName), init),
                  ])
                ),
              ]),
            ])
          );
        });

        path.insertBefore(steps);
      },

      AssignmentExpression(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;

        if (t.isIdentifier(node.left)) {
          const varName = node.left.name;
          const right = node.right;

          const emit = t.expressionStatement(
            t.callExpression(t.identifier("emitStep"), [
              t.objectExpression([
                t.objectProperty(t.identifier("type"), t.stringLiteral("variable_assignment")),
                t.objectProperty(
                  t.identifier("description"),
                  t.binaryExpression(
                    "+",
                    t.stringLiteral(`Assigned ${varName} = `),
                    t.callExpression(
                      t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
                      [right]
                    )
                  )
                ),
                t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
                t.objectProperty(
                  t.identifier("variables"),
                  t.objectExpression([
                    t.objectProperty(t.identifier(varName), right),
                  ])
                ),
              ]),
            ])
          );

          path.insertBefore(emit);
        }
      },

      ExpressionStatement(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;

        if (
          t.isCallExpression(node.expression) &&
          t.isMemberExpression(node.expression.callee) &&
          node.expression.callee.object.name === "console"
        ) {
          const arg = node.expression.arguments[0] || t.stringLiteral("undefined");

          const emit = t.expressionStatement(
            t.callExpression(t.identifier("emitStep"), [
              t.objectExpression([
                t.objectProperty(t.identifier("type"), t.stringLiteral("log")),
                t.objectProperty(t.identifier("description"), t.stringLiteral("console.log call")),
                t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
                t.objectProperty(
                  t.identifier("output"),
                  t.callExpression(
                    t.identifier("String"),
                    [arg]
                  )
                ),
              ]),
            ])
          );

          path.insertBefore(emit);
        }
      },

      ForStatement(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;

        const emitStart = template.statement(`
          emitStep({
            type: "loop_start",
            description: "For loop start",
            line: ${line}
          });
        `);

        const emitIter = template.statement(`
          emitStep({
            type: "loop_iteration",
            description: "For loop iteration",
            line: ${line}
          });
        `);

        path.insertBefore(emitStart());

        if (t.isBlockStatement(node.body)) {
          node.body.body.unshift(emitIter());
        } else {
          const newBody = t.blockStatement([emitIter(), node.body]);
          node.body = newBody;
        }
      },

      IfStatement(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;
        const testCode = generate(node.test).code;

        const emit = template.statement(`
          emitStep({
            type: "condition",
            description: "If condition: ${testCode}",
            line: ${line}
          });
        `);

        path.insertBefore(emit());
      },

      ReturnStatement(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;
        const valueCode = node.argument ? generate(node.argument).code : "undefined";

        const emit = template.statement(`
          emitStep({
            type: "return",
            description: "Returning value: " + JSON.stringify(${valueCode}),
            line: ${line}
          });
        `);

        path.insertBefore(emit());
      },

      FunctionDeclaration(path) {
        const { node } = path;
        const line = node.loc?.start.line || 0;
        const name = node.id?.name || "anonymous";

        const emit = template.statement(`
          emitStep({
            type: "function_call",
            description: "Function declared: ${name}",
            line: ${line}
          });
        `);

        path.insertBefore(emit());
      },
    },
  };
};
