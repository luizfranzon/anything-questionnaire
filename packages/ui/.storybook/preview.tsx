import type { Preview } from "@storybook/react-vite";
import { MotionProvider } from "../src/motion";
import "../src/styles/global.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <MotionProvider>
        <Story />
      </MotionProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    controls: { expanded: true },
    a11y: { test: "error" },
  },
};

export default preview;
