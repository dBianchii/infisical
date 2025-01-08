import { faMinusSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

import { createNotification } from "@app/components/notifications";
import { Button, IconButton, Tooltip } from "@app/components/v2";
import { useWorkspace } from "@app/context";
import { usePopUp } from "@app/hooks";
import { useDeleteUserSecretsBatch } from "@app/hooks/api/userSecrets/mutations";

import { DeleteActionModal } from "./DeleteActionModal";

type Props = {
  selectedEntries: string[];
  resetSelectedEntries: () => void;
};

export const SelectionPanel = ({ selectedEntries, resetSelectedEntries }: Props) => {
  const selectedKeysCount = selectedEntries.length;
  const isMultiSelectActive = selectedKeysCount > 0;
  const { mutateAsync: deleteUserSecretsBatch } = useDeleteUserSecretsBatch();
  const { handlePopUpOpen, handlePopUpToggle, handlePopUpClose, popUp } = usePopUp([
    "bulkDeleteEntries"
  ] as const);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const handleBulkDelete = async () => {
    // let processedEntries = 0;

    try {
      await deleteUserSecretsBatch({
        secretIds: selectedEntries,
        workspaceId
      });
    } catch (error) {
      console.log(error);
      createNotification({
        type: "error",
        text: "Failed to create user secret"
      });
      return;
    }

    handlePopUpClose("bulkDeleteEntries");
    resetSelectedEntries();
    createNotification({
      type: "success",
      text: "Successfully deleted selected user secrets"
    });
  };

  const shouldShowDelete = true; // TODO: Permissions

  return (
    <>
      <div
        className={twMerge(
          "h-0 flex-shrink-0 overflow-hidden transition-all",
          isMultiSelectActive && "h-16"
        )}
      >
        <div className="mt-3.5 flex items-center rounded-md border border-mineshaft-600 bg-mineshaft-800 py-2 px-4 text-bunker-300">
          <Tooltip content="Clear">
            <IconButton variant="plain" ariaLabel="clear-selection" onClick={resetSelectedEntries}>
              <FontAwesomeIcon icon={faMinusSquare} size="lg" />
            </IconButton>
          </Tooltip>
          <div className="ml-1 flex-grow px-2 text-sm">{selectedKeysCount} Selected</div>
          {shouldShowDelete && (
            <Button
              variant="outline_bg"
              colorSchema="danger"
              leftIcon={<FontAwesomeIcon icon={faTrash} />}
              className="ml-4"
              onClick={() => handlePopUpOpen("bulkDeleteEntries")}
              size="xs"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <DeleteActionModal
        isOpen={popUp.bulkDeleteEntries.isOpen}
        deleteKey="delete"
        title="Do you want to delete the selected user secrets?"
        onChange={(isOpen) => handlePopUpToggle("bulkDeleteEntries", isOpen)}
        onDeleteApproved={handleBulkDelete}
      />
    </>
  );
};
