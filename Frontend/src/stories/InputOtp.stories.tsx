import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "./components/input-otp";

import "../index.css";

const meta = {
  title: "component/InputOTP",
  component: InputOTP,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    length: {
      control: { type: "number", min: 4, max: 8, step: 1 },
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    length: 6,
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup className="gap-3">
        {Array.from({ length: args.length ?? 6 }).map((_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const WithSeparators: Story = {
  args: {
    length: 6,
  },
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup className="gap-3">
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSeparator />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSeparator />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup className="gap-3">
        {Array.from({ length: args.length ?? 6 }).map((_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup className="gap-2">
        {Array.from({ length: args.length ?? 6 }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="min-w-[44px] min-h-[44px]"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup className="gap-4">
        {Array.from({ length: args.length ?? 6 }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="min-w-[56px] min-h-[56px]"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};
