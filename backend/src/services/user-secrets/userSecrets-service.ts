import { ProjectType, UserSecretType } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";
import { BadRequestError } from "@app/lib/errors";
import { ZDecryptedJSONData } from "@app/server/routes/sanitizedSchemas";

import { TKmsServiceFactory } from "../kms/kms-service";
import { KmsDataKey } from "../kms/kms-types";
import { TProjectDALFactory } from "../project/project-dal";
import { TProjectBotServiceFactory } from "../project-bot/project-bot-service";
import { TSecretDALFactory } from "./userSecrets-dal";
import {
  TCreateUserSecretDTO,
  TCreateUserSecretRawDTO,
  TDeleteBulkUserSecretsDTO,
  TDeleteUserSecretsRawDTO,
  TGetUserSecretsRawDTO,
  TUpdateUserSecretDTO,
  TUpdateUserSecretRawDTO
} from "./userSecrets-types";

type TSecretServiceFactoryDep = {
  permissionService: Pick<TPermissionServiceFactory, "getProjectPermission">;
  userSecretsDAL: TSecretDALFactory;
  projectBotService: TProjectBotServiceFactory;
  projectDAL: TProjectDALFactory;
  kmsService: TKmsServiceFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;
export const userSecretsServiceFactory = ({
  permissionService,
  userSecretsDAL,
  projectDAL,
  projectBotService,
  kmsService
}: TSecretServiceFactoryDep) => {
  const $createUserSecret = async ({
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

    const { jsonDataCiphertext, type, itemName } = inputSecret;
    const secret = await userSecretsDAL.create({
      encryptedJSONData: jsonDataCiphertext,
      type,
      userId: actorId,
      itemName
    });

    return secret;
  };

  const $deleteManyUserSecrets = async ({ secretIds, projectId }: TDeleteBulkUserSecretsDTO) => {
    // TODO: Permissions
    // const { permission, ForbidOnInvalidProjectType } = await permissionService.getProjectPermission(
    //   actor,
    //   actorId,
    //   projectId,
    //   actorAuthMethod,
    //   actorOrgId
    // );
    // ForbidOnInvalidProjectType(ProjectType.SecretManager);
    // ForbiddenError.from(permission).throwUnlessCan(
    //   ProjectPermissionActions.Delete,
    //   subject(ProjectPermissionSub.Secrets, { environment, secretPath: path })
    // );

    await projectDAL.checkProjectUpgradeStatus(projectId);

    const secretsDeleted = await userSecretsDAL.delete({
      $in: {
        id: secretIds
      }
    });

    return secretsDeleted;
  };

  const $updateSecret = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    projectId,
    secretId,
    ...inputSecret
  }: TUpdateUserSecretDTO) => {
    const { ForbidOnInvalidProjectType } = await permissionService.getProjectPermission(
      actor,
      actorId,
      projectId,
      actorAuthMethod,
      actorOrgId
    );
    ForbidOnInvalidProjectType(ProjectType.UserSecrets);

    // TODO: Permissions
    // ForbiddenError.from(permission).throwUnlessCan(
    //   ProjectPermissionActions.Edit,
    //   subject(ProjectPermissionSub.Secrets, {
    //     environment,
    //     secretPath,
    //     secretName: inputSecret.secretName,
    //     secretTags: secret.tags.map((el) => el.slug)
    //   })
    // );

    await userSecretsDAL.update(
      {
        userId: actorId,
        id: secretId
      },
      {
        encryptedJSONData: inputSecret.jsonDataCiphertext,
        itemName: inputSecret.itemName
      }
    );
  };

  const createUserSecretRaw = async ({
    actor,
    actorId,
    projectId,
    actorAuthMethod,
    actorOrgId,
    type,
    itemName,
    decryptedJSONData
  }: TCreateUserSecretRawDTO) => {
    const { encryptor: secretManagerEncryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.SecretManager, // TODO: Check if we need to have a custom 'Secret Manager' just for UserSecrets
      projectId
    });

    const secret = await $createUserSecret({
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId,
      itemName,
      jsonDataCiphertext: secretManagerEncryptor({ plainText: Buffer.from(JSON.stringify(decryptedJSONData)) })
        .cipherTextBlob,
      projectId,
      type
    });
    return secret;
  };

  const getUserSecretsCount = async ({ projectId, actorId }: Pick<TGetUserSecretsRawDTO, "projectId" | "actorId">) => {
    const { shouldUseSecretV2Bridge } = await projectBotService.getBotKey(projectId);

    if (!shouldUseSecretV2Bridge)
      throw new BadRequestError({
        message: "Project version does not support pagination",
        name: "PaginationNotSupportedError"
      });

    // TODO: Permissions
    // const { permission } = await permissionService.getProjectPermission(
    //   actor,
    //   actorId,
    //   projectId,
    //   actorAuthMethod,
    //   actorOrgId
    // );
    // ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Read, ProjectPermissionSub.Secrets);

    const count = await userSecretsDAL.countSecrets(actorId);

    return count;
  };

  const getSecretsRaw = async ({
    projectId,
    actorId,
    orderBy,
    orderDirection,
    limit,
    offset
  }: TGetUserSecretsRawDTO) => {
    // TODO: Permissions
    // const { permission } = await permissionService.getProjectPermission(
    //   actor,
    //   actorId,
    //   projectId,
    //   actorAuthMethod,
    //   actorOrgId
    // );
    // ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Read, ProjectPermissionSub.Secrets);

    const secrets = await userSecretsDAL.findSecrets(actorId, {
      limit,
      offset,
      orderBy,
      orderDirection
    });

    const { decryptor: secretManagerDecryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.SecretManager,
      projectId
    });

    function decryptJSONData(secret: Awaited<ReturnType<typeof userSecretsDAL.findSecrets>>[number]) {
      const decryptedJSONDataAsString = secret.encryptedJSONData
        ? secretManagerDecryptor({ cipherTextBlob: secret.encryptedJSONData }).toString()
        : "";

      const object = JSON.parse(decryptedJSONDataAsString) as unknown;

      const decryptedJSONData = ZDecryptedJSONData.parse(object);

      return {
        id: secret.id,
        itemName: secret.itemName,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
        type: secret.type as UserSecretType,
        decryptedJSONData
      };
    }

    const decryptedSecrets = secrets.map(decryptJSONData);

    return {
      secrets: decryptedSecrets
    };
  };

  const deleteManyUserSecretsRaw = async ({
    secretIds,
    projectId,
    actor,
    actorAuthMethod,
    actorId,
    actorOrgId
  }: TDeleteUserSecretsRawDTO) => {
    await $deleteManyUserSecrets({
      secretIds,
      projectId,
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId
    });
  };

  const updateUserSecretRaw = async ({
    actorId,
    projectId,
    actor,
    actorOrgId,
    actorAuthMethod,
    decryptedJSONData,
    itemName,
    secretId
  }: TUpdateUserSecretRawDTO) => {
    const { encryptor: secretManagerEncryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.SecretManager, // TODO: Check if we need to have a custom 'Secret Manager' just for UserSecrets
      projectId
    });

    await $updateSecret({
      itemName,
      projectId,
      actor,
      actorId,
      actorOrgId,
      actorAuthMethod,
      secretId,
      jsonDataCiphertext: secretManagerEncryptor({ plainText: Buffer.from(JSON.stringify(decryptedJSONData)) })
        .cipherTextBlob
    });
  };

  return {
    createUserSecretRaw,
    getUserSecretsCount,
    getSecretsRaw,
    deleteManyUserSecretsRaw,
    updateUserSecretRaw
  };
};
