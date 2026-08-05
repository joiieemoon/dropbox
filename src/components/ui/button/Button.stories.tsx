import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button";
import "../../../index.css";

const meta: Meta<typeof Button> = {
  title: "Components/UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Primary Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    size: "md",
    children: "Outline Button",
  },
};

export const Small: Story = {
  args: {
    variant: "primary",
    size: "sm",
    children: "Small Button",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Disabled Button",
    disabled: true,
  },
};

export const WithStartIcon: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Save",
    startIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 21v-8H7v8M7 3v5h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

export const WithEndIcon: Story = {
  args: {
    variant: "outline",
    size: "md",
    children: "Next",
    endIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 12h14M12 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};