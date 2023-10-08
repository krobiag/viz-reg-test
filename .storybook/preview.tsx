import React, { useEffect } from "react";
import type { Preview, StoryContext, StoryFn } from "@storybook/react";

import {
  ScenarioCapture,
  triggerSnapshot,
} from "../src/stories/ScenarioCapture";

const withSnapshot = (Story: StoryFn, ctxt: StoryContext) => {
  useEffect(() => {
    (async () => {
      ctxt?.componentId && (await triggerSnapshot(ctxt?.componentId));
    })();
  }, []);
  //async storyContext=>{let playFunctionContext={...storyContext,step:(label,play2)=>runStep(label,play2,playFunctionContext)};return play(playFunctionContext)}
  // console.log(">>ctxt", ctxt);
  // ctxt.playFunction = async () => {
  //   console.log(">>CHANGED THE PLAY FUNCTION");
  // };
  // Story.play = () => {
  //   console.log(">>STORY PLAY");
  // };
  // Story.play = () => {
  //   ctxt?.playFunction();
  //   console.log(">>GLOBAL PLAY");
  // };
  return <ScenarioCapture {...{ Story, ctxt }} />;
};

const preview: Preview = {
  decorators: [withSnapshot],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
