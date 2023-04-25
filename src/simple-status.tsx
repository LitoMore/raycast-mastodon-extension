import { useEffect, useState, useRef } from "react";
import {
  Form,
  ActionPanel,
  Action,
  showToast,
  popToRoot,
  Toast,
  Cache,
  Icon,
  getPreferenceValues,
  LaunchProps,
  LocalStorage,
} from "@raycast/api";
import apiServer from "./utils/api";
import { MastodonError, StatusResponse, Preference, StatusRequest } from "./utils/types";
import { getAccessToken } from "./utils/oauth";
import { dateTimeFormatter } from "./utils/util";

import VisibilityDropdown from "./components/VisibilityDropdown";

const cache = new Cache();
const { instance, enableMarkdown } = getPreferenceValues<Preference>();

interface CommandProps extends LaunchProps<{ draftValues: Partial<StatusRequest> }> {
  children?: React.ReactNode;
}

interface StatusForm extends StatusRequest {
  files: string[];
  description?: string;
}

export default function SimpleCommand(props: CommandProps) {
  const { draftValues } = props;

  const [state, setState] = useState({
    cw: draftValues?.spoiler_text || "",
    isMarkdown: enableMarkdown,
    sensitive: false,
    openActionText: "Open the last published status",
    username: "",
    content: draftValues?.status || "",
  });

  const cached = cache.get("latest_published_status");
  const [statusInfo, setStatusInfo] = useState<StatusResponse>(cached ? JSON.parse(cached) : null);

  const cwRef = useRef<Form.TextField>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await getAccessToken();
        const username = (await LocalStorage.getItem<string>("account-username")) || "";
        setState((prevState) => ({
          ...prevState,
          username,
        }));
      } catch (error) {
        console.error("Error during authorization or fetching account-username:", error);
      }
    };
    init();
  }, []);

  const handleSubmit = async (value: StatusForm) => {
    try {
      if (!value.status && !value.files) throw new Error("You might forget the content, right ? ");

      showToast(Toast.Style.Animated, "Publishing to the Fediverse ...");

      const mediaIds = await Promise.all(
        value.files?.map(async (file) => {
          const { id } = await apiServer.uploadAttachment({ file, description: value.description });
          return id;
        }) ?? []
      );
      const newStatus: Partial<StatusRequest> = {
        ...value,
        media_ids: mediaIds,
        sensitive: state.sensitive,
        content_type: enableMarkdown ? "text/markdown" : "text/plain",
      };

      const response = await apiServer.postNewStatus(newStatus);

      value.scheduled_at
        ? showToast(Toast.Style.Success, "Scheduled", dateTimeFormatter(value.scheduled_at, "long"))
        : showToast(Toast.Style.Success, "Status has been published! ");

      setStatusInfo(response);
      setState((prevState) => ({
        ...prevState,
        openActionText: "View the status in Browser",
        cw: "",
      }));
      cache.set("latest_published_status", JSON.stringify(response));
      setTimeout(() => popToRoot(), 2000);
    } catch (error) {
      const requestErr = error as MastodonError;
      showToast(Toast.Style.Failure, "Error", requestErr.error || (error as Error).message);
    }
  };

  const handleCw = (value: boolean) => {
    setState((prevState) => ({
      ...prevState,
      sensitive: value,
    }));
    cwRef.current?.focus();
  };

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title={"Toot"} icon={Icon.Upload} />
          {statusInfo && <Action.OpenInBrowser url={statusInfo.url} title={state.openActionText} />}
          <Action.OpenInBrowser url={`https://${instance}/main/friends/`} title="Open Mastodon in Browser" />
        </ActionPanel>
      }
    >
      <Form.Description title="Account" text={`${state.username}@${instance}`} />
      {state.sensitive && (
        <Form.TextField
          id="spoiler_text"
          title="CW"
          placeholder={"content warning"}
          value={state.cw}
          onChange={(value) => setState((prevState) => ({ ...prevState, cw: value }))}
          ref={cwRef}
        />
      )}
      <Form.TextArea
        id="status"
        title="Content"
        placeholder={`Write something down ${state.isMarkdown ? "with Markdown" : ""}`}
        autoFocus={true}
        value={state.content}
        onChange={(value) => setState((prevState) => ({ ...prevState, content: value }))}
        enableMarkdown={state.isMarkdown}
      />
      {!props.children && <VisibilityDropdown />}
      {props.children}
      {enableMarkdown && (
        <Form.Checkbox
          id="markdown"
          label="Markdown"
          value={state.isMarkdown}
          onChange={(value) => setState((prevState) => ({ ...prevState, isMarkdown: value }))}
          storeValue
        />
      )}
      <Form.Checkbox id="sensitive" label="Sensitive" value={state.sensitive} onChange={handleCw} storeValue />
    </Form>
  );
}
