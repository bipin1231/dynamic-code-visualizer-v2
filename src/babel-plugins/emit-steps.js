const generate = require("@babel/generator").default;

module.exports = function ({ types: t }) {
  function createEmitStep(type, line, extraProps = {}) {
    const props = [
      t.objectProperty(t.identifier("type"), t.stringLiteral(type)),
      t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
    ];

    for (const key in extraProps) {
      const val = extraProps[key];
      let nodeVal;

      if (typeof val === "string") {
        nodeVal = t.stringLiteral(val);
      } else if (typeof val === "boolean") {
        nodeVal = t.booleanLiteral(val);
      } else if (typeof val === "number") {
        nodeVal = t.numericLiteral(val);
      } else if (Array.isArray(val)) {
        nodeVal = t.arrayExpression(val.map(v => typeof v === "number" ? t.numericLiteral(v) : t.stringLiteral(String(v))));
      } else if (typeof val === "object" && val.type) {
        nodeVal = val;
      } else {
        nodeVal = t.stringLiteral(JSON.stringify(val));
      }

      props.push(t.objectProperty(t.identifier(key), nodeVal));
    }

    props.push(
      t.objectProperty(
        t.identifier("variables"),
        t.memberExpression(t.identifier("window"), t.identifier("__variables__"))
      )
    );

    return t.expressionStatement(
      t.callExpression(t.identifier("emitStep"), [
        t.objectExpression(props)
      ])
    );
  }

  return {
    visitor: {
      VariableDeclaration(path) {
        const line = path.node.loc?.start?.line || 0;

        const steps = path.node.declarations.map(decl => {
          const name = decl.id.name;
          const init = decl.init || t.identifier("undefined");
          const exprCode = generate(init).code;

          const assignExpr = t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(
                t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
                t.identifier(name)
              ),
              init
            )
          );

          const isArray = t.isArrayExpression(init);
          const description = isArray
            ? `Declared array '${name}' with elements: ${init.elements.map(e => generate(e).code).join(", ")}`
            : `Declared '${name}' and initialized it with '${exprCode}'`;

          const extraProps = {
            variableName: name,
            expressionCode: exprCode,
            description,
          };

          if (isArray) {
            extraProps.isArray = true;
            extraProps.arrayLength = init.elements.length;
            extraProps.elements = init.elements.map(e => {
              if (t.isNumericLiteral(e)) return e.value;
              if (t.isStringLiteral(e)) return e.value;
              return generate(e).code;
            });
          }

          const emitStep = createEmitStep("variable_declaration", line, extraProps);

          return [assignExpr, emitStep];
        });

        path.replaceWithMultiple(steps.flat());
      },

      AssignmentExpression(path) {
        const line = path.node.loc?.start?.line || 0;
        const left = path.node.left;
        const right = path.node.right;

        if (t.isIdentifier(left)) {
          const exprCode = generate(right).code;

          const assignExpr = t.assignmentExpression(
            "=",
            t.memberExpression(
              t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
              t.identifier(left.name)
            ),
            right
          );

          const description = `Assigned '${left.name}' a new value: '${exprCode}'`;

          const emitStep = createEmitStep("variable_assignment", line, {
            variableName: left.name,
            expressionCode: exprCode,
            description,
          });

          path.replaceWithMultiple([t.expressionStatement(assignExpr), emitStep]);
        }
      },

      UpdateExpression(path) {
        const line = path.node.loc?.start?.line || 0;
        const arg = path.node.argument;

        if (t.isIdentifier(arg)) {
          const operator = path.node.operator;
          const prefix = path.node.prefix;

          const updateExpr = t.updateExpression(
            operator,
            t.memberExpression(
              t.memberExpression(t.identifier("window"), t.identifier("__variables__")),
              t.identifier(arg.name)
            ),
            prefix
          );

          const description = `Updated '${arg.name}' using '${operator}' operator`;

          const emitStep = createEmitStep("variable_update", line, {
            variableName: arg.name,
            operator,
            prefix,
            description,
          });

          path.replaceWithMultiple([t.expressionStatement(updateExpr), emitStep]);
        }
      },

      ForStatement(path) {
        const line = path.node.loc?.start?.line || 0;

        path.insertBefore(createEmitStep("loop_start", line, {
          description: "Loop starts"
        }));

        const test = path.node.test;
        const update = path.node.update;
        const body = path.node.body;

        const newBodyStatements = [];

        if (test) {
          const testLine = test.loc?.start?.line || line;
          const conditionCode = generate(test).code;

          const conditionCheck = t.callExpression(
            t.arrowFunctionExpression([], test),
            []
          );

          const conditionResultId = path.scope.generateUidIdentifier("conditionResult");

          newBodyStatements.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(conditionResultId, conditionCheck)
            ])
          );

          newBodyStatements.push(
            createEmitStep("loop_condition", testLine, {
              expressionCode: conditionCode,
              conditionValue: conditionResultId
            })
          );
        }

        if (t.isBlockStatement(body)) {
          body.body.forEach(stmt => {
            const stmtLine = stmt.loc?.start?.line || line;
            newBodyStatements.push(createEmitStep("loop_body_statement", stmtLine));
            newBodyStatements.push(stmt);
          });
        } else {
          const stmtLine = body.loc?.start?.line || line;
          newBodyStatements.push(createEmitStep("loop_body_statement", stmtLine));
          newBodyStatements.push(body);
        }

        if (update) {
          const updateLine = update.loc?.start?.line || line;
          newBodyStatements.push(createEmitStep("loop_update", updateLine, {
            expressionCode: generate(update).code,
          }));
        }

        path.get("body").replaceWith(t.blockStatement(newBodyStatements));
      },

      ReturnStatement(path) {
        const line = path.node.loc?.start?.line || 0;
        path.insertBefore(createEmitStep("return", line, {
          description: "Function returns"
        }));
      },

      CallExpression(path) {
        if (
          t.isMemberExpression(path.node.callee) &&
          path.node.callee.object.name === "console" &&
          path.node.callee.property.name === "log"
        ) {
          const line = path.node.loc?.start?.line || 0;
          path.insertBefore(createEmitStep("log", line, {
            description: "Console output"
          }));
        }
      },
    },
  };
};
