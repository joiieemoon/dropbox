import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
import "../../../index.css";

const meta: Meta<typeof ConfirmationModal> = {
  title: "Components/UI/ConfirmationModal",
  component: ConfirmationModal,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["confirm", "warning", "info", "success", "danger"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmationModal>;

/* ---------------- CONFIRM ---------------- */

export const Confirm: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Confirm
        </button>
        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("Confirmed!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    variant: "confirm",
    title: "Confirm Action",
    message: "Are you sure you want to proceed with this action?",
    confirmText: "Confirm",
    cancelText: "Cancel",
  },
};

/* ---------------- WARNING ---------------- */

export const Warning: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        >
          Open Warning
        </button>
        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("Acknowledged!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    variant: "warning",
    title: "Warning",
    message: "This action may have unintended consequences. Please review carefully.",
    confirmText: "I Understand",
    cancelText: "Go Back",
  },
};

/* ---------------- INFO ---------------- */

export const Info: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Open Info
        </button>
        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("Got it!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    variant: "info",
    title: "Did You Know?",
    message: "You can customize this modal with any variant, title, and message.",
    confirmText: "Got It",
    cancelText: "Dismiss",
  },
};

/* ---------------- SUCCESS ---------------- */

export const Success: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Open Success
        </button>
        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("Done!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    variant: "success",
    title: "Operation Successful",
    message: "Your changes have been saved successfully.",
    confirmText: "Continue",
    cancelText: "Close",
  },
};

/* ---------------- DANGER ---------------- */

export const Danger: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Open Danger
        </button>
        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("Deleted!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    variant: "danger",
    title: "Delete Record",
    message: "Are you sure you want to delete this record? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
  },
};

/* ---------------- LOADING STATE ---------------- */

export const Loading: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Loading Modal
        </button>
        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // Simulate async operation
            return new Promise((resolve) => setTimeout(resolve, 2000));
          }}
        />
      </div>
    );
  },
  args: {
    variant: "confirm",
    title: "Processing",
    message: "Click confirm to see the loading state. The modal stays open for 2 seconds.",
    confirmText: "Save",
    cancelText: "Cancel",
    loading: false,
  },
};