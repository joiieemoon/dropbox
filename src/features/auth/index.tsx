import { Outlet, Link } from "react-router-dom";
import GridShape from "../../components/common/grid-shape/GridShape";
import ThemeTogglerTwo from "../../components/common/theme-toggler-two/ThemeTogglerTwo";

export default function AuthLayout() {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {/* Left Side */}
        <Outlet />

        {/* Right Side */}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-blend-hue dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={231}
                  height={48}
                  src="/images/logo/auth-logo.svg"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-[#3684EE] dark:text-[#1872f1]">
                Free and Open-Source Tailwind CSS Admin Dashboard Template
              </p>
            </div>
          </div>
        </div>

        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
