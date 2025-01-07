import { ProjectType } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";
import { encryptSymmetric128BitHexKeyUTF8 } from "@app/lib/crypto";
import { NotFoundError } from "@app/lib/errors";

import { TProjectDALFactory } from "../project/project-dal";
import { TProjectBotServiceFactory } from "../project-bot/project-bot-service";
import { TCreateUserSecretDTO, TCreateUserSecretRawDTO } from "./userSecrets.types";
import { TSecretDALFactory } from "./userSecrets-dal";

type TSecretServiceFactoryDep = {
  permissionService: Pick<TPermissionServiceFactory, "getProjectPermission">;
  userSecretsDAL: TSecretDALFactory;
  projectBotService: TProjectBotServiceFactory;
  projectDAL: TProjectDALFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;
export const userSecretsServiceFactory = ({
  permissionService,
  userSecretsDAL,
  projectDAL,
  projectBotService
}: TSecretServiceFactoryDep) => {
  const createUserSecret = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    projectId,
    ...inputSecret
  }: TCreateUserSecretDTO) => {
    const { ForbidOnInvalidProjectType } = await permissionService.getProjectPermission(
      actor,
      actorId,
      projectId,
      actorAuthMethod,
      actorOrgId
    );
    ForbidOnInvalidProjectType(ProjectType.UserSecrets);

    // TODO: Permissions.
    // ForbiddenError.from(permission).throwUnlessCan(
    //   ProjectPermissionActions.Create,
    //   subject(ProjectPermissionSub.UserSecrets, {
    //     environment,
    //     secretPath,
    //     secretName,
    //     secretTags: tags?.map((el) => el.slug)
    //   })
    // );
    await projectDAL.checkProjectUpgradeStatus(projectId);

    const { jsonDataCiphertext, type } = inputSecret;
    const secret = await userSecretsDAL.create({
      encryptedJSONData: jsonDataCiphertext,
      type,
      userId: actorId
    });

    return secret;
  };

  const createUserSecretRaw = async ({
    actor,
    actorId,
    projectId,
    actorAuthMethod,
    actorOrgId,
    type,
    jsonData
  }: TCreateUserSecretRawDTO) => {
    const { botKey } = await projectBotService.getBotKey(projectId);
    if (!botKey)
      throw new NotFoundError({
        message: `Project bot for project with ID '${projectId}' not found. Please upgrade your project.`,
        name: "bot_not_found_error"
      });

    const encryptedJSONData = encryptSymmetric128BitHexKeyUTF8(JSON.stringify(jsonData), botKey);

    await createUserSecret({
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId,
      jsonDataCiphertext: encryptedJSONData.ciphertext,
      projectId,
      type
    });
  };

  return {
    createUserSecretRaw
  };
};
