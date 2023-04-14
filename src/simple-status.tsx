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
  LocalStorage,
  getPreferenceValues,
  LaunchProps,
} from "@raycast/api";

import { postNewStatus } from "./api";
import { AkkomaError, StatusResponse, Preference, Status } from "./types";
import { authorize } from "./oauth";

import VisibilityDropdown from "./components/VisibilityDropdown";
import StatusContent from "./components/StatusContent";

const cache = new Cache();

type SimpleStatus = Pick<Status, "content_type" | "status" | "spoiler_text" | "visibility">;

interface CommandProps extends LaunchProps<{ draftValues: SimpleStatus }> {
  children?: React.ReactNode;
}

export default function SimpleCommand(props: CommandProps) {
  const { instance } = getPreferenceValues<Preference>();
  const { draftValues } = props;
  const [cw, setCw] = useState<string>(draftValues?.spoiler_text || "");
  const [isMarkdown, setIsMarkdown] = useState(true);
  const [showCw, setShowCw] = useState(false);
  const [openActionText, setOpenActionText] = useState("Open the last published status");
  const [fqn, setFqn] = useState("");

  const cached = cache.get("latest_published_status");
  const [statusInfo, setStatusInfo] = useState<StatusResponse>(cached ? JSON.parse(cached) : null);

  const cwRef = useRef<Form.TextField>(null);

  useEffect(() => {
    const init = async () => {
      authorize();
      const newFqn = await LocalStorage.getItem<string>("account-fqn");
      if (newFqn) setFqn(newFqn);
    };

    init();
  }, []);

  const handleSubmit = async (values: Status) => {
    try {
      if (!values.status) throw new Error("You might forget the content, right ? |･ω･)");
      showToast(Toast.Style.Animated, "Publishing to the Fediverse ... ᕕ( ᐛ )ᕗ");

      const response = await postNewStatus({
        ...values,
        content_type: isMarkdown ? "text/markdown" : "text/plain",
      });

      setStatusInfo(response);
      cache.set("latest_published_status", JSON.stringify(response));
      showToast(Toast.Style.Success, "Status has been published (≧∇≦)/ ! ");
      setOpenActionText("Open the status in Browser");
      setTimeout(() => {
        popToRoot();
      }, 1000);
    } catch (error) {
      const requestErr = error as AkkomaError;
      showToast(Toast.Style.Failure, "Error", requestErr.message);
    }
  };

  const handleCw = () => {
    setShowCw(!showCw);
    if (cwRef.current) {
      cwRef.current.focus();
    }
  };

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title={"Publish"} icon={Icon.Upload} />
          {statusInfo && <Action.OpenInBrowser url={statusInfo.url} title={openActionText} />}
          <Action.OpenInBrowser url={`https://${instance}/main/friends/`} title="Open Akkoma in Browser" />
        </ActionPanel>
      }
    >
      {fqn && <Form.Description title="Account" text={fqn} />}
      {showCw && (
        <Form.TextField
          id="spoiler_text"
          title="CW"
          placeholder={"content warning"}
          value={cw}
          onChange={setCw}
          ref={cwRef}
        />
      )}
      <StatusContent isMarkdown={isMarkdown} draftStatus={draftValues?.status} />
      <VisibilityDropdown />
      {props.children}
      <Form.Checkbox id="markdown" title="Markdown" label="" value={isMarkdown} onChange={setIsMarkdown} storeValue />
      <Form.Checkbox id="showCw" title="Sensitive" label="" value={showCw} onChange={handleCw} storeValue />
    </Form>
  );
}
