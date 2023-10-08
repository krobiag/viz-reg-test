import { useState } from "react";
import { fireEvent } from "@storybook/testing-library";

// @ts-ignore
// import callsite from 'callsite';

type Interaction = {
  label: string;
  timestamp: number;
  click?: boolean;
  text?: string;
  selection?: string;
};
export const ScenarioCapture = ({ Story, ctxt }: { Story: any; ctxt: any }) => {
  const [startTimestamp] = useState(Date.now());
  const [output, setOutput] = useState<any>({});
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const newInteraction = (label: string) => {
    const newInteraction: Interaction = {
      label,
      timestamp: Date.now(),
    };
    interactions.push(newInteraction);
    return newInteraction;
  };
  const updateInteraction = (
    label: string,
    updater: (i: Interaction) => void
  ) => {
    const interaction =
      interactions.find((i) => i.label === label) || newInteraction(label);
    updater(interaction);
    // console.log({interaction})
    setInteractions(interactions);
  };

  const getLabel = (event: any) =>
    event.target["ariaLabel"] || event.target["name"];
  const captureClick = (event: any) => {
    updateInteraction(getLabel(event), (i) => {
      i.click = true;
    });
  };
  const captureText = (event: any) => {
    updateInteraction(getLabel(event), (i) => {
      i.text = (i.text || "") + event.key;
    });
  };
  const captureSelection = (event: any) => {
    if (event.target.tagName.toUpperCase() !== "SELECT") {
      return;
    }
    console.log(event);
    updateInteraction(getLabel(event), (i) => {
      i.selection = event.target.value;
    });
  };
  // @ts-ignore
  window["__TEST_DATA__"] = {
    input: ctxt.args.input,
    output,
    interactions,
    title: ctxt.title,
    story: ctxt.story,
    fileName: ctxt.parameters.fileName,
  };
  return (
    <div
      onClick={captureClick}
      onKeyDown={captureText}
      onChange={captureSelection}
    >
      <Story
        args={{
          ...ctxt.args,
          onOutput: (o: any) => {
            setOutput(o);
            ctxt.args.onOutput(o);
          },
        }}
      />
    </div>
  );
};
export const triggerSnapshot = async (name: string, step: string = "final") => {
  await fireEvent(
    document.body,
    new CustomEvent("__interactions_done__", { detail: { name, step } })
  );
};
