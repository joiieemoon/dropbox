import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import "../../../index.css";

const meta: Meta<typeof DeleteConfirmationModal> = {
  title: "Components/UI/DeleteConfirmationModal",
  component: DeleteConfirmationModal,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof DeleteConfirmationModal>;

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Delete Record
        </button>
        <DeleteConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("Record deleted!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

export const CustomMessage: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Remove User
        </button>
        <DeleteConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert("User removed!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    title: "Remove User",
    message: "Are you sure you want to remove this user from the team? They will lose access immediately.",
    confirmText: "Remove",
    cancelText: "Keep User",
  },
};