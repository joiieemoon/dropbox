import { useState, useCallback, ChangeEvent, FocusEvent } from "react";
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";

/* ── Type exports ── */
export interface FormTextFieldProps {
  /** Unique field identifier (used for id, htmlFor, aria-describedby) */
  id: string;
  /** Visible label rendered inside <InputLabel> */
  label: string;
  /** Placeholder text on the input */
  placeholder?: string;
  /** Initial / controlled value */
  initialValue?: string;
  /** If true, field is required and shows "Required" on empty blur */
  required?: boolean;
  /** Minimum character length (validates on blur & change) */
  minLength?: number;
  /** Maximum character length (validates on blur & change; also caps input) */
  maxLength?: number;
  /** Regex pattern to test the value against */
  pattern?: RegExp;
  /** Custom error message when pattern fails */
  patternErrorMessage?: string;
  /** Custom error message when minLength fails */
  minLengthErrorMessage?: string;
  /** Custom error message when maxLength fails */
  maxLengthErrorMessage?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Callback fired with the current value whenever it changes */
  onChange?: (value: string) => void;
  /** Callback fired on blur with the current value */
  onBlur?: (value: string) => void;
}

export interface FormTextFieldState {
  value: string;
  error: boolean;
  helperText: string;
}

/* ── Default error messages ── */
const DEFAULT_MESSAGES = {
  required: "This field is required",
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  pattern: "Invalid format",
};

/* ── Validation engine ── */
export function validateTextField(
  value: string,
  props: Pick<
    FormTextFieldProps,
    "required" | "minLength" | "maxLength" | "pattern" | "patternErrorMessage" | "minLengthErrorMessage" | "maxLengthErrorMessage"
  >,
): { error: boolean; helperText: string } {
  const trimmed = value.trim();

  // Required check
  if (props.required && !trimmed) {
    return { error: true, helperText: DEFAULT_MESSAGES.required };
  }

  // Min-length check (only if there is a value)
  if (props.minLength !== undefined && trimmed.length > 0 && trimmed.length < props.minLength) {
    return {
      error: true,
      helperText: props.minLengthErrorMessage ?? DEFAULT_MESSAGES.minLength(props.minLength),
    };
  }

  // Max-length check
  if (props.maxLength !== undefined && trimmed.length > props.maxLength) {
    return {
      error: true,
      helperText: props.maxLengthErrorMessage ?? DEFAULT_MESSAGES.maxLength(props.maxLength),
    };
  }

  // Pattern check (only if there is a value)
  if (props.pattern && trimmed.length > 0 && !props.pattern.test(trimmed)) {
    return {
      error: true,
      helperText: props.patternErrorMessage ?? DEFAULT_MESSAGES.pattern,
    };
  }

  return { error: false, helperText: "✓" };
}

/* ── React component ── */
export default function FormTextField({
  id,
  label,
  placeholder,
  initialValue = "",
  required = false,
  minLength,
  maxLength,
  pattern,
  patternErrorMessage,
  minLengthErrorMessage,
  maxLengthErrorMessage,
  disabled = false,
  onChange,
  onBlur,
}: FormTextFieldProps) {
  const [state, setState] = useState<FormTextFieldState>(() => {
    const validation = validateTextField(initialValue, {
      required,
      minLength,
      maxLength,
      pattern,
      patternErrorMessage,
      minLengthErrorMessage,
      maxLengthErrorMessage,
    });
    return {
      value: initialValue,
      error: validation.error,
      helperText: validation.helperText,
    };
  });

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Enforce max-length cap at the input level
      if (maxLength !== undefined && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      const validation = validateTextField(newValue, {
        required,
        minLength,
        maxLength,
        pattern,
        patternErrorMessage,
        minLengthErrorMessage,
        maxLengthErrorMessage,
      });

      setState({ value: newValue, error: validation.error, helperText: validation.helperText });
      onChange?.(newValue);
    },
    [required, minLength, maxLength, pattern, patternErrorMessage, minLengthErrorMessage, maxLengthErrorMessage, onChange],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      // Re-validate on blur to catch required-empty
      const validation = validateTextField(e.target.value, {
        required,
        minLength,
        maxLength,
        pattern,
        patternErrorMessage,
        minLengthErrorMessage,
        maxLengthErrorMessage,
      });
      setState((prev) => ({ ...prev, error: validation.error, helperText: validation.helperText }));
      onBlur?.(e.target.value);
    },
    [required, minLength, maxLength, pattern, patternErrorMessage, minLengthErrorMessage, maxLengthErrorMessage, onBlur],
  );

  const helperTextId = `${id}-helper-text`;

  return (
    <FormControl
      fullWidth
      variant="outlined"
      size="small"
      error={state.error}
      disabled={disabled}
      required={required}
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <OutlinedInput
        id={id}
        label={label}
        placeholder={placeholder}
        value={state.value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={state.error ? helperTextId : undefined}
        aria-invalid={state.error}
        inputProps={{
          maxLength,
          "aria-required": required,
        }}
      />
      {state.error && (
        <FormHelperText id={helperTextId} role="alert">
          {state.helperText}
        </FormHelperText>
      )}
      {!state.error && state.helperText !== "✓" && (
        <FormHelperText>{state.helperText}</FormHelperText>
      )}
    </FormControl>
  );
}