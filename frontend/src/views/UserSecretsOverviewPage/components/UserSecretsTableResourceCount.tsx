import { faKey } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Tooltip } from "@app/components/v2";

type Props = {
  secretCount?: number;
};

export const UserSecretsTableResourceCount = ({ secretCount = 0 }: Props) => {
  return (
    <div className="flex items-center gap-2 divide-x divide-mineshaft-500 text-sm text-mineshaft-400">
      {secretCount > 0 && (
        <Tooltip
          className="max-w-sm"
          content={
            <p className="whitespace-nowrap text-center">
              Total secret count{" "}
              <span className="text-center text-mineshaft-400">(matching filters)</span>
            </p>
          }
        >
          <div className="flex items-center gap-2 pl-2">
            <FontAwesomeIcon icon={faKey} className="text-bunker-300" />
            <span>{secretCount}</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
};
