import { faCreditCard, faGlobe, faNoteSticky } from "@fortawesome/free-solid-svg-icons";

import { UserSecretType } from "@app/hooks/api/userSecrets/types";

export const userSecretTypeToIcon = {
  [UserSecretType.Login]: faGlobe,
  [UserSecretType.CreditCard]: faCreditCard,
  [UserSecretType.SecureNote]: faNoteSticky
};
