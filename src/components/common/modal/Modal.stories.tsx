import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Modal } from "./Modal";
import "../../../index.css";

const meta: Meta<typeof Modal> = {
  title: "Components/UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "full"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

/* ---------------- DEFAULT ---------------- */

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Modal
        </button>
        <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
              Modal Title
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This is the modal content. You can put any React nodes here.
            </p>
          </div>
        </Modal>
      </div>
    );
  },
  args: {
    size: "md",
    showCloseButton: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
  },
};

/* ---------------- SMALL ---------------- */

export const Small: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Small Modal
        </button>
        <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Small Modal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Compact modal for confirmations or alerts.
            </p>
          </div>
        </Modal>
      </div>
    );
  },
  args: {
    size: "sm",
    showCloseButton: false,
  },
};

/* ---------------- LARGE ---------------- */

export const Large: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Large Modal
        </button>
        <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
              Large Modal
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              A larger modal with more content.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <h3 className="font-medium text-gray-800 dark:text-white/90">
                    Card {i + 1}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Content card description
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  args: {
    size: "lg",
    showCloseButton: true,
  },
};

/* ---------------- FULLSCREEN ---------------- */

export const Fullscreen: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Fullscreen Modal
        </button>
        <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">
              Fullscreen Modal
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              This modal takes up the entire viewport.
            </p>
          </div>
        </Modal>
      </div>
    );
  },
  args: {
    size: "full",
    showCloseButton: true,
  },
};

/* ---------------- WITH FOOTER ---------------- */

export const WithFooter: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Open Modal with Footer
        </button>
        <Modal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          footer={
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Confirm
              </button>
            </div>
          }
        >
          <div className="p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Confirm Action
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This modal has a custom footer with action buttons.
            </p>
          </div>
        </Modal>
      </div>
    );
  },
  args: {
    size: "sm",
    showCloseButton: true,
  },
};