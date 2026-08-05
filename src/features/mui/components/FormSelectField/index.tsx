import { useState, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
} from "@mui/material";

/* ── Option type ── */
export interface SelectOption {
  value: string | number;
  label: string;
}

/* ── Type exports ── */
export interface FormSelectFieldProps {
  /** Unique field identifier (used for id, htmlFor, aria-describedby) */
  id: string;
  /** Visible label rendered inside <InputLabel> */
  label: string;
  /** Array of {value, label} options for the dropdown */
  options: SelectOption[];
  /** Placeholder / null option text (e.g. "None" or "Select…") */
  placeholder?: string;
  /** Initial / controlled value */
  initialValue?: string | number;
  /** If true, field is required and shows "Required" on empty blur */
  required?: boolean;
  /** Disable the select */
  disabled?: boolean;
  /** If true, the select takes full width */
  fullWidth?: boolean;
  /** Callback fired with the current value whenever it changes */
  onChange?: (value: string | number) => void;
  /** Callback fired on blur */
  onBlur?: (value: string | number) => void;
}

export interface FormSelectFieldState {
  value: string | number;
  error: boolean;
  helperText: string;
}

/* ── Default error messages ── */
const DEFAULT_REQUIRED_MESSAGE = "Please select an option";

/* ── Validation engine ── */
export function validateSelectField(
  value: string | number,
  required?: boolean,
): { error: boolean; helperText: string } {
  if (required && (value === "" || value === undefined || value === null)) {
    return { error: true, helperText: DEFAULT_REQUIRED_MESSAGE };
  }
  return { error: false, helperText: "✓" };
}

/* ── React component ── */
export default function FormSelectField({
  id,
  label,
  options,
  placeholder,
  initialValue = "",
  required = false,
  disabled = false,
  fullWidth = true,
  onChange,
  onBlur,
}: FormSelectFieldProps) {
  const [state, setState] = useState<FormSelectFieldState>(() => {
    const validation = validateSelectField(initialValue, required);
    return {
      value: initialValue,
      error: validation.error,
      helperText: validation.helperText,
    };
  });

  const handleChange = useCallback(
    (e: SelectChangeEvent<string | number>) => {
      const newValue = e.target.value;
      const validation = validateSelectField(newValue, required);

      setState({ value: newValue, error: validation.error, helperText: validation.helperText });
      onChange?.(newValue);
    },
    [required, onChange],
  );

  const handleBlur = useCallback(
    () => {
      // Re-validate on blur to catch required-empty
      const validation = validateSelectField(state.value, required);
      setState((prev) => ({ ...prev, error: validation.error, helperText: validation.helperText }));
      onBlur?.(state.value);
    },
    [required, state.value, onBlur],
  );

  const helperTextId = `${id}-helper-text`;
  const labelId = `${id}-label`;

  return (
    <FormControl
      fullWidth={fullWidth}
      variant="outlined"
      size="small"
      error={state.error}
      disabled={disabled}
      required={required}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={id}
        value={state.value}
        label={label}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={state.error ? helperTextId : undefined}
        aria-invalid={state.error}
        inputProps={{
          "aria-required": required,
        }}
      >
        {placeholder !== undefined && (
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {state.error && (
        <FormHelperText id={helperTextId} role="alert">
          {state.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}