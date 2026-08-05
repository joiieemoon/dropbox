import type React from "react";
import type { FC } from "react";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EyeCloseIcon, EyeIcon } from "../../../../icons";
import TextAreaInner from "../components/textarea/TextArea";
import Checkbox from "../components/checkbox/Checkbox";
import Radio from "../components/radio/Radio";
import FileInput from "../components/file-input/FileInput";
import MultiSelect from "../components/multi-select/MultiSelect";

export interface InputFieldProps {
  type?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number | string[];
  onChange?: (
    event:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | string[]
      | boolean
      | string,
  ) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  onBlur?: React.FocusEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  onFocus?: React.FocusEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  onKeyDown?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  rows?: number;
  label?: React.ReactNode;
  errorMessage?: string;
  autoComplete?: string;
  children?: React.ReactNode;
  as?:
    | "input"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "file"
    | "multi-select"
    | string;
  options?: { value: string; label?: string; text?: string }[];
  checked?: boolean;
  defaultSelected?: string[];
}

/**
 * Default text/password input with label, password toggle, and error/hint display.
 */
function InputTextField({
  type = "text",
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  onBlur,
  autoComplete,
  errorMessage,
  onFocus,
  onKeyDown,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += `  border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    inputClasses += `  border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={name}
          className={clsx(
            twMerge(
              "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400",
            ),
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value as string | number}
          onChange={
            onChange as (e: React.ChangeEvent<HTMLInputElement>) => void
          }
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={inputClasses}
          onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
          onFocus={onFocus as React.FocusEventHandler<HTMLInputElement>}
          onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement>}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute z-30 right-4 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            {showPassword ? (
              <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
            ) : (
              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Textarea field wrapper that adapts InputFieldProps to TextArea's expected props.
 */
function TextAreaField({
  label,
  name,
  placeholder,
  rows,
  value,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  error = false,
  hint = "",
  errorMessage,
}: InputFieldProps) {
  return (
    <div className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}
      <TextAreaInner
        name={name}
        placeholder={placeholder}
        rows={rows ?? 3}
        value={String(value ?? "")}
        onChange={(val) =>
          onChange?.({
            target: { name, value: val },
          } as unknown as React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >)
        }
        onBlur={onBlur}
        className={className}
        disabled={disabled}
        error={error}
        hint={hint}
      />
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Checkbox field wrapper.
 */
function CheckboxField({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="relative">
      <Checkbox
        label={label as string | undefined}
        checked={checked ?? false}
        id={id}
        onChange={(val) => {
          onChange?.(val);
        }}
        className={className}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Radio field wrapper.
 */
function RadioField({
  id,
  name,
  value,
  checked,
  label,
  onChange,
  className = "",
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="relative">
      <Radio
        id={id || name || ""}
        name={name || ""}
        value={String(value ?? "")}
        checked={checked ?? false}
        label={String(label ?? "")}
        onChange={(val) => {
          onChange?.(val);
        }}
        className={className}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Native select field wrapper.
 */
function NativeSelectField({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  success = false,
  hint,
  errorMessage,
  className = "",
  children,
}: InputFieldProps) {
  let selectClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;
  if (disabled) {
    selectClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    selectClasses += `  border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    selectClasses += `  border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    selectClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={selectClasses}
      >
        {children}
      </select>
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * MultiSelect field wrapper.
 */
function MultiSelectField({
  label,
  options,
  value,
  defaultSelected,
  onChange,
  disabled = false,
  placeholder,
}: InputFieldProps) {
  return (
    <MultiSelect
      label={String(label ?? "")}
      options={(options ?? []).map((opt) => ({
        value: opt.value,
        text: opt.text ?? opt.label ?? opt.value,
      }))}
      value={value as string[] | undefined}
      defaultSelected={defaultSelected}
      onChange={(selected) => {
        onChange?.(selected);
      }}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

/**
 * Centralized component map that routes field types to reusable form components.
 * Add new variants here to extend the form system.
 */
const fieldComponents: Record<string, FC<InputFieldProps>> = {
  input: InputTextField,
  textarea: TextAreaField,
  select: NativeSelectField,
  checkbox: CheckboxField,
  radio: RadioField,
  file: FileInput,
  "multi-select": MultiSelectField,
};

/**
 * Main InputField component.
 * Resolves the field type/control and delegates to the appropriate reusable component.
 *
 * To add a new field variant:
 * 1. Create or import the reusable component.
 * 2. Add an entry to `fieldComponents` map.
 */
const InputField: FC<InputFieldProps> = (props) => {
  const { as = "input", type } = props;

  // Determine the field key for component lookup
  const fieldKey =
    as === "select"
      ? "select"
      : as === "textarea" || type === "textarea"
        ? "textarea"
        : as === "checkbox" || type === "checkbox"
          ? "checkbox"
          : as === "radio" || type === "radio"
            ? "radio"
            : as === "file" || type === "file"
              ? "file"
              : as === "multi-select"
                ? "multi-select"
                : "input";

  const Component = fieldComponents[fieldKey];

  if (!Component) return null;

  return <Component {...props} />;
};

export default InputField;
