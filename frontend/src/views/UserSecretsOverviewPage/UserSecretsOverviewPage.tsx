import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { faArrowDown, faArrowUp, faFolderBlank, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import NavHeader from "@app/components/navigation/NavHeader";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  Modal,
  ModalContent,
  Pagination,
  Table,
  TableContainer,
  TableSkeleton,
  TBody,
  Td,
  Th,
  THead,
  Tooltip,
  Tr
} from "@app/components/v2";
import { useOrganization, useWorkspace } from "@app/context";
import { usePagination, usePopUp } from "@app/hooks";
import { OrderByDirection } from "@app/hooks/api/generic/types";
import { UserSecretType } from "@app/hooks/api/userSecrets/types";
import { useGetProjectUserSecretsOverview } from "@app/hooks/api/userSecretsDashboard/queries";
import { DashboardUserSecretsOrderBy } from "@app/hooks/api/userSecretsDashboard/types";
import { ProjectType } from "@app/hooks/api/workspace/types";

import CreateUserSecretForm from "./components/CreateUserSecretForm";
import EditUserSecretForm from "./components/EditUserSecretForm";
import { SelectionPanel } from "./components/SelectionPanel";
import { UserSecretOverviewTableRow } from "./components/UserSecretOverViewTableRow";
import { UserSecretsTableResourceCount } from "./components/UserSecretsTableResourceCount";
import { userSecretTypeToIcon } from "./utils";

const useSelectedEntries = () => {
  const router = useRouter();

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const toggleSelectedEntry = useCallback(
    (id: string) => {
      setSelectedEntries((prevEntries) => {
        if (prevEntries.includes(id)) return prevEntries.filter((entry) => entry !== id);
        return [...prevEntries, id];
      });
    },
    [selectedEntries]
  );
  const resetSelectedEntries = useCallback(() => {
    setSelectedEntries([]);
  }, []);

  useEffect(() => {
    const onRouteChangeStart = () => {
      resetSelectedEntries();
    };

    router.events.on("routeChangeStart", onRouteChangeStart);

    return () => {
      router.events.off("routeChangeStart", onRouteChangeStart);
    };
  }, []);

  return { selectedEntries, toggleSelectedEntry, resetSelectedEntries, setSelectedEntries };
};
export const SecretOverviewPage = () => {
  const { t } = useTranslation();

  const router = useRouter();
  // const [scrollOffset, setScrollOffset] = useState(0);
  const [currentUserSecretType, setCurrentUserSecretType] = useState(UserSecretType.Login);
  const { resetSelectedEntries, selectedEntries, toggleSelectedEntry, setSelectedEntries } =
    useSelectedEntries();

  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();

  const { currentOrg } = useOrganization();
  const workspaceId = currentWorkspace?.id as string;

  const {
    offset,
    limit,
    orderDirection,
    setOrderDirection,
    setPage,
    perPage,
    page,
    setPerPage,
    orderBy
  } = usePagination<DashboardUserSecretsOrderBy>(DashboardUserSecretsOrderBy.ItemName);

  useEffect(() => {
    if (!isWorkspaceLoading && !workspaceId && router.isReady) {
      router.push(`/org/${currentOrg?.id}/${ProjectType.UserSecrets}/overview`);
    }
  }, [isWorkspaceLoading, workspaceId, router.isReady]);

  const { isLoading: isOverviewLoading, data: overview } = useGetProjectUserSecretsOverview({
    projectId: workspaceId,
    limit,
    offset,
    orderBy,
    orderDirection
  });

  const [currentlyEditingUserSecretId, setCurrentlyEditingUserSecretId] = useState<
    string | undefined
  >(undefined);
  const currentlyEditing = useMemo(
    () => overview?.secrets?.find((s) => s.id === currentlyEditingUserSecretId),
    [currentlyEditingUserSecretId, overview?.secrets]
  );

  const { secrets, totalSecretCount } = overview ?? {};
  const { handlePopUpOpen, handlePopUpToggle, handlePopUpClose, popUp } = usePopUp([
    "addUserSecret",
    "editUserSecret"
  ] as const);

  const toggleSelectAllRows = () => {
    if (!secrets || secrets.length === 0) return;
    const allSelected = secrets.every((secret) => selectedEntries.includes(secret.id));
    if (allSelected) {
      const newSelectedEntries = selectedEntries.filter(
        (entry) => !secrets.some((secret) => secret.id === entry)
      );
      setSelectedEntries(newSelectedEntries);
      return;
    }
    const newSelectedEntries = [
      ...new Set([...selectedEntries, ...secrets.map((secret) => secret.id)])
    ];
    setSelectedEntries(newSelectedEntries);
  };

  const allRowsSelectedOnPage = useMemo(() => {
    if (!secrets?.length) return { isChecked: false, isIndeterminate: false };
    const allSelected = secrets.every((secret) => selectedEntries.includes(secret.id));
    const someSelected = secrets.some((secret) => selectedEntries.includes(secret.id));

    if (allSelected) return { isChecked: true, isIndeterminate: false };
    if (someSelected) return { isChecked: true, isIndeterminate: true };

    return { isChecked: false, isIndeterminate: false };
  }, [secrets, selectedEntries]);

  if (isWorkspaceLoading) {
    return (
      <div className="container mx-auto flex h-screen w-full items-center justify-center px-8 text-mineshaft-50 dark:[color-scheme:dark]">
        <img
          src="/images/loading/loading.gif"
          height={70}
          width={120}
          alt="loading animation"
          decoding="async"
          loading="lazy"
        />
      </div>
    );
  }

  // This is needed to also show imports from other paths – right now those are missing.
  // const combinedKeys = [...secKeys, ...secretImports.map((impSecrets) => impSecrets?.data?.map((impSec) => impSec.secrets?.map((impSecKey) => impSecKey.key))).flat().flat()];

  const isTableEmpty = totalSecretCount === 0;
  console.log(secrets);

  return (
    <>
      <div className="container mx-auto px-6 text-mineshaft-50 dark:[color-scheme:dark]">
        <div className="relative right-5 ml-4">
          <NavHeader pageName={t("dashboard.title")} isProjectRelated />
        </div>
        <div className="space-y-8">
          <div className="flex w-full items-baseline justify-between">
            <div className="mt-6">
              <p className="text-3xl font-semibold text-bunker-100">User Secrets Overview</p>
              <p className="text-md text-bunker-300">
                Manage your user secrets, such as web logins, credit cards and secure notes.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="ml-auto flex flex-row items-center justify-center space-x-2">
              {/* <SecretSearchInput
                value={searchFilter}
                tags={tags}
                onChange={setSearchFilter}
                environments={userAvailableEnvs}
                projectId={currentWorkspace?.id!}
              /> */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline_bg"
                      leftIcon={<FontAwesomeIcon icon={faPlus} />}
                      className="h-10"
                    >
                      Add Secret
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handlePopUpOpen("addUserSecret");
                        setCurrentUserSecretType(UserSecretType.Login);
                      }}
                      icon={<FontAwesomeIcon icon={userSecretTypeToIcon[UserSecretType.Login]} />}
                      iconPos="left"
                    >
                      <div className="flex items-center">Login</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handlePopUpOpen("addUserSecret", UserSecretType.CreditCard);
                        setCurrentUserSecretType(UserSecretType.CreditCard);
                      }}
                      icon={
                        <FontAwesomeIcon icon={userSecretTypeToIcon[UserSecretType.CreditCard]} />
                      }
                      iconPos="left"
                    >
                      <div className="flex items-center">Card</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handlePopUpOpen("addUserSecret", UserSecretType.SecureNote);
                        setCurrentUserSecretType(UserSecretType.SecureNote);
                      }}
                      icon={
                        <FontAwesomeIcon icon={userSecretTypeToIcon[UserSecretType.SecureNote]} />
                      }
                      iconPos="left"
                    >
                      <div className="flex items-center">Secure note</div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        <SelectionPanel
          resetSelectedEntries={resetSelectedEntries}
          selectedEntries={selectedEntries}
        />
        <div className="thin-scrollbar mt-4">
          <TableContainer
            // onScroll={(e) => setScrollOffset(e.currentTarget.scrollLeft)}
            className="thin-scrollbar rounded-b-none"
          >
            <Table>
              <THead>
                <Tr className="sticky top-0 z-20 border-0">
                  <Th className="sticky left-0 z-20 min-w-[20rem] border-b-0 p-0">
                    <div className="flex items-center border-b border-r border-mineshaft-600 pr-5 pl-3 pt-3.5 pb-3">
                      <Tooltip
                        className="max-w-[20rem] whitespace-nowrap capitalize"
                        content="all folders and secrets on page"
                      >
                        <div className="mr-4 ml-2">
                          <Checkbox
                            isDisabled={totalSecretCount === 0}
                            id="checkbox-select-all-rows"
                            isChecked={allRowsSelectedOnPage.isChecked}
                            isIndeterminate={allRowsSelectedOnPage.isIndeterminate}
                            onCheckedChange={toggleSelectAllRows}
                          />
                        </div>
                      </Tooltip>
                      Name
                      <IconButton
                        variant="plain"
                        className="ml-2"
                        ariaLabel="sort"
                        onClick={() =>
                          setOrderDirection((prev) =>
                            prev === OrderByDirection.ASC
                              ? OrderByDirection.DESC
                              : OrderByDirection.ASC
                          )
                        }
                      >
                        <FontAwesomeIcon
                          icon={orderDirection === "asc" ? faArrowDown : faArrowUp}
                        />
                      </IconButton>
                    </div>
                  </Th>
                  <Th>Type</Th>
                  <Th>Updated at</Th>
                </Tr>
              </THead>
              <TBody>
                {isOverviewLoading && (
                  <TableSkeleton
                    columns={4}
                    innerKey="secret-overview-loading"
                    rows={5}
                    className="bg-mineshaft-700"
                  />
                )}
                {isTableEmpty && (
                  <Tr>
                    <Td colSpan={4}>
                      <EmptyState
                        title={"Let's add some secrets"}
                        icon={faFolderBlank}
                        iconSize="3x"
                      >
                        {/* <Button
                          className="mt-4"
                          variant="outline_bg"
                          colorSchema="primary"
                          size="md"
                          onClick={() => handlePopUpOpen("addSecretsInAllEnvs")}
                        >
                          Add Secrets
                        </Button> */}
                      </EmptyState>
                    </Td>
                  </Tr>
                )}
                {secrets?.map((secret, index) => (
                  <UserSecretOverviewTableRow
                    // asdas={secret.}
                    updatedAt={secret.updatedAt}
                    id={secret.id}
                    type={secret.type}
                    onClickRow={() => {
                      setCurrentlyEditingUserSecretId(secret.id);
                      handlePopUpOpen("editUserSecret");
                    }}
                    isSelected={selectedEntries.some((s) => s === secret.id)}
                    onToggleSecretSelect={() => toggleSelectedEntry(secret.id)}
                    key={`overview-${secret}-${index + 1}`}
                    itemName={secret.itemName}
                  />
                ))}
              </TBody>
            </Table>
          </TableContainer>
          {!isOverviewLoading && (totalSecretCount ?? 0) > 0 && (
            <Pagination
              startAdornment={<UserSecretsTableResourceCount secretCount={totalSecretCount} />}
              className="rounded-b-md border-t border-solid border-t-mineshaft-600"
              count={totalSecretCount ?? 0}
              page={page}
              perPage={perPage}
              onChangePage={(newPage) => setPage(newPage)}
              onChangePerPage={(newPerPage) => setPerPage(newPerPage)}
            />
          )}
        </div>
      </div>
      <Modal
        isOpen={popUp.addUserSecret.isOpen}
        onOpenChange={(isOpen) => handlePopUpToggle("addUserSecret", isOpen)}
      >
        <ModalContent
          className="max-h-[80vh]"
          bodyClassName="overflow-visible"
          title="Create User Secret"
          subTitle="Create your user secret"
        >
          <CreateUserSecretForm
            onClose={() => handlePopUpClose("addUserSecret")}
            type={currentUserSecretType}
          />
        </ModalContent>
      </Modal>
      {currentlyEditing && (
        <Modal
          isOpen={popUp.editUserSecret.isOpen}
          onOpenChange={(isOpen) => handlePopUpToggle("editUserSecret", isOpen)}
        >
          <ModalContent
            className="max-h-[80vh]"
            bodyClassName="overflow-visible"
            title="Edit user Secret"
            subTitle="Edit your user secret"
          >
            <EditUserSecretForm
              userSecret={currentlyEditing}
              onClose={() => handlePopUpClose("editUserSecret")}
            />
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
