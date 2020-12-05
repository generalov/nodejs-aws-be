export const handler = basicAuthorizer;

function basicAuthorizer(event, ctx, cb) {
  console.log("Event: ", JSON.stringify(event));

  if (event["type"] !== "TOKEN") {
    cb("Unauthorized");
  }

  try {
    const authorizationToken = event.authorizationToken;
    const encodedCreds = authorizationToken.split(" ")[1];
    const buff = Buffer.from(encodedCreds, "base64");
    const plainCreds = buff.toString("utf-8").split(":");
    const [username, password] = plainCreds;

    console.log(`username: ${username} and password: ${password}`);

    const storedUserPassword = process.env[username];
    const effect =
      !storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow";
    const policy = generatePolicy(encodedCreds, event.methodArn, effect);

    cb(null, policy);
  } catch (err) {
    cb(`Unauthorized: ${e.message}`);
  }
}

function generatePolicy(principalId, resource, effect = "Deny") {
  return {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    },
  };
}
