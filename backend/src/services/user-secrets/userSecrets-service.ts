import { ProjectType } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";

import { TCreateUserSecretDTO } from "./userSecrets.types";
import { TSecretDALFactory } from "./userSecrets-dal";

type TSecretServiceFactoryDep = {
  permissionService: Pick<TPermissionServiceFactory, "getProjectPermission">;
  userSecretDAL: TSecretDALFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;
export const userSecretsServiceFactory = ({ permissionService }: TSecretServiceFactoryDep) => {
  const createUserSecretRaw = async ({
    actor,
    actorId,
    projectId,
    actorAuthMethod,
    actorOrgId
  }: TCreateUserSecretDTO) => {
    const { ForbidOnInvalidProjectType } = await permissionService.getProjectPermission(
      actor,
      actorId,
      projectId,
      actorAuthMethod,
      actorOrgId
    );
    ForbidOnInvalidProjectType(ProjectType.UserSecrets);

    // const doesUserSecretExist = await userSecretDAL.findOne({
    //   type: UserSecretType.CreditCard
    // });
  };

  return {
    createUserSecretRaw
  };
};
