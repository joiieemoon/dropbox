import type { FC, ComponentProps } from "react";
import InputField from "../../form/input/input-fields";

export interface SearchInputProps
  extends Omit<ComponentProps<typeof InputField>, "className" | "type"> {
  /** Additional class for the input wrapper */
  className?: string;
}

const SearchIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Reusable SearchInput component.
 *
 * Wraps the common InputField with a search icon on the left side.
 * Supports all standard input props.
 */
export const SearchInput: FC<SearchInputProps> = ({
  className = "",
  placeholder = "Search...",
  ...rest
}) => {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <SearchIcon />
      </span>
      <InputField
        type="text"
        placeholder={placeholder}
        className="pl-10"
        {...rest}
      />
    </div>
  );
};

export default SearchInput;
