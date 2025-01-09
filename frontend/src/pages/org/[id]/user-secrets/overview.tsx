import { ProjectType } from "@app/hooks/api/workspace/types";

import { ProductOverview } from "../secret-manager/overview";

const UserSecretsOverviewPage = () => <ProductOverview type={ProjectType.UserSecrets} />;

Object.assign(UserSecretsOverviewPage, { requireAuth: true });

export default UserSecretsOverviewPage;
