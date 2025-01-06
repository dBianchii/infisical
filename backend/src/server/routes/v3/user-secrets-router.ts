import { z } from "zod";

import { SecretApprovalRequestsSchema, UserSecretType } from "@app/db/schemas";
import { RAW_SECRETS } from "@app/lib/api-docs";
import { secretsLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

import { secretRawSchema } from "../sanitizedSchemas";

const SecretReferenceNode = z.object({
  key: z.string(),
  value: z.string().optional(),
  environment: z.string(),
  secretPath: z.string()
});
type TSecretReferenceNode = z.infer<typeof SecretReferenceNode> & { children: TSecretReferenceNode[] };

const SecretReferenceNodeTree: z.ZodType<TSecretReferenceNode> = SecretReferenceNode.extend({
  children: z.lazy(() => SecretReferenceNodeTree.array())
});

export const registerUserSecretsRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "POST",
    url: "/raw/:secretName",
    config: {
      // TODO: Maybe use a dedicated rate limiter just for user secrets?
      rateLimit: secretsLimit
    },
    schema: {
      description: "Create a user secret",
      security: [
        {
          bearerAuth: []
        }
      ],
      params: z.object({
        secretName: z.string().trim().describe(RAW_SECRETS.CREATE.secretName)
      }),
      body: z.object({
        workspaceId: z.string().trim().describe(RAW_SECRETS.CREATE.workspaceId),
        environment: z.string().trim().describe(RAW_SECRETS.CREATE.environment),
        type: z.nativeEnum(UserSecretType).default(UserSecretType.Login).describe(RAW_SECRETS.CREATE.type),
        // TODO: Data
        data: z.union([
          z.object({
            userName: z.string(),
            password: z.string()
          }),
          z.object({
            cardNumer: z.string(),
            expiryDate: z.string(),
            CVV: z.string()
          }),
          z.object({
            title: z.string(),
            content: z.string()
          })
        ])
      }),
      response: {
        200: z.union([
          z.object({
            secret: secretRawSchema
          }),
          z.object({ approval: SecretApprovalRequestsSchema }).describe("When secret protection policy is enabled")
        ])
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async () =>
      // req
      {
        // const secretOperation = await server.services.userSecrets.createUserSecretRaw({
        //   actorId: req.permission.id,
        //   actor: req.permission.type,
        //   actorOrgId: req.permission.orgId,
        //   actorAuthMethod: req.permission.authMethod,
        //   projectId: req.body.workspaceId,
        //   type: req.body.type,
        //   data: req.body.data
        // });
        // const { secret } = secretOperation;
        // await server.services.auditLog.createAuditLog({
        //   projectId: req.body.workspaceId,
        //   ...req.auditLogInfo,
        //   event: {
        //     type: EventType.CREATE_USER_SECRET,
        //     metadata: {
        //       environment: req.body.environment,
        //       secretPath: req.body.secretPath,
        //       secretId: secret.id,
        //       secretKey: req.params.secretName,
        //       secretVersion: secret.version
        //     }
        //   }
        // });
        // await server.services.telemetry.sendPostHogEvents({
        //   event: PostHogEventTypes.UserSecretCreated,
        //   distinctId: getTelemetryDistinctId(req),
        //   properties: {
        //     numberOfSecrets: 1,
        //     workspaceId: req.body.workspaceId,
        //     environment: req.body.environment,
        //     secretPath: req.body.secretPath,
        //     channel: getUserAgentType(req.headers["user-agent"]),
        //     ...req.auditLogInfo
        //   }
        // });
        // return { secret };
      }
  });
};
