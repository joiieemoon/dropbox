import type { FC } from "react";
import type { InputProps } from "../types/index.ts";
import InputField, { type InputFieldProps } from "./InputField.tsx";

/**
 * Lightweight passthrough component that maps InputProps to InputField.
 * InputField handles all field type resolution and component delegation.
 */
const Input: FC<InputProps> = ({
  type = "text",
  label,
  id,
  as = "input",
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
  rows = 3,
  autoComplete,
  errorMessage,
  onFocus,
  onKeyDown,
  children,
  options,
  checked,
  defaultSelected,
}) => {
  return (
    <InputField
      type={type}
      label={label}
      id={id}
      as={as as InputFieldProps["as"]}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange as InputFieldProps["onChange"]}
      className={className}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      success={success}
      error={error}
      hint={hint}
      onBlur={onBlur}
      rows={rows}
      autoComplete={autoComplete}
      errorMessage={errorMessage}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      options={options}
      checked={checked}
      defaultSelected={defaultSelected}
    >
      {children}
    </InputField>
  );
};

export default Input;
