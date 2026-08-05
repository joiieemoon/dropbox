import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarProvider } from "../../context/SidebarContext";
import AppLayout from "./AppLayout";
import "../../index.css";

const meta: Meta<typeof AppLayout> = {
  title: "Layout/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <div>
          <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 w-[290px] translate-x-0">
            <div className="py-8 flex justify-start">
              <img
                src="/images/logo/auth-logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </div>
            <nav className="mb-6">
              <h2 className="mb-4 text-xs uppercase text-gray-400">Menu</h2>
              <ul className="flex flex-col gap-4">
                <li>
                  <a
                    href="#"
                    className="menu-item group menu-item-active"
                  >
                    <span className="menu-item-icon-size menu-item-icon-active">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 10.5V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V10.5M12 2L2 8.5H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="menu-item-text">Dashboard</span>
                  </a>
                </li>
              </ul>
            </nav>
          </aside>
        </div>
        <div className="flex-1 transition-all duration-300 ease-in-out lg:ml-[290px]">
          <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
            <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
              <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
                <button className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border">
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
          </header>
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Dashboard Content</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                The main content area renders here via the router Outlet. This is where page components are displayed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  ),
};