import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

import { Checkbox, Td, Tr } from "@app/components/v2";
import { UserSecretType } from "@app/hooks/api/userSecrets/types";

import { userSecretTypeToIcon } from "../utils";

type Props = {
  id: string;
  itemName?: string;
  type: UserSecretType;
  isSelected: boolean;
  updatedAt: string;
  onToggleSecretSelect: (key: string) => void;
  onClickRow: () => void;
};

export const UserSecretOverviewTableRow = ({
  id,
  itemName,
  type,
  updatedAt,
  isSelected,
  onToggleSecretSelect,
  onClickRow
}: Props) => {
  const userSecretTypeToTextMap = {
    [UserSecretType.Login]: "Login",
    [UserSecretType.CreditCard]: "Credit Card",
    [UserSecretType.SecureNote]: "Secure Note"
  };

  return (
    <Tr isHoverable isSelectable onClick={onClickRow} className="group">
      <Td className="sticky left-0 z-10 bg-mineshaft-800 bg-clip-padding py-0 px-0 group-hover:bg-mineshaft-700">
        <div className="h-full w-full border-r border-mineshaft-600 py-2.5 px-5">
          <div className="flex items-center space-x-5">
            <div className="text-bunker-300">
              <Checkbox
                id={`checkbox-${itemName}`}
                isChecked={isSelected}
                onCheckedChange={() => {
                  onToggleSecretSelect(id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={twMerge("hidden group-hover:flex", isSelected && "flex")}
              />
              <FontAwesomeIcon
                className={twMerge("block group-hover:hidden", isSelected && "hidden")}
                icon={userSecretTypeToIcon[type]}
              />
            </div>
            <div title={itemName}>{itemName}</div>
          </div>
        </div>
      </Td>
      <Td>{userSecretTypeToTextMap[type]}</Td>
      <Td>{format(new Date(updatedAt), "Pp")}</Td>
    </Tr>
  );
};
