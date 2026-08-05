import { useState, useCallback, ChangeEvent } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from "@mui/material";

/* ── Option type ── */
export interface RadioOption {
  value: string | number;
  label: string;
}

/* ── Type exports ── */
export interface FormRadioGroupFieldProps {
  /** Unique field identifier (used for id, aria-describedby) */
  id: string;
  /** Visible label rendered inside <FormLabel> */
  label: string;
  /** Array of {value, label} options for the radio group */
  options: RadioOption[];
  /** Initial / controlled value */
  initialValue?: string | number;
  /** If true, field is required and shows "Required" on empty blur */
  required?: boolean;
  /** Disable the entire group */
  disabled?: boolean;
  /** Layout direction of radio buttons */
  row?: boolean;
  /** Callback fired with the current value whenever it changes */
  onChange?: (value: string | number) => void;
  /** Callback fired on blur */
  onBlur?: (value: string | number) => void;
}

export interface FormRadioGroupFieldState {
  value: string | number;
  error: boolean;
  helperText: string;
}

/* ── Default error messages ── */
const DEFAULT_REQUIRED_MESSAGE = "Please select an option";

/* ── Validation engine ── */
export function validateRadioGroupField(
  value: string | number,
  required?: boolean,
): { error: boolean; helperText: string } {
  if (required && (value === "" || value === undefined || value === null)) {
    return { error: true, helperText: DEFAULT_REQUIRED_MESSAGE };
  }
  return { error: false, helperText: "✓" };
}

/* ── React component ── */
export default function FormRadioGroupField({
  id,
  label,
  options,
  initialValue = "",
  required = false,
  disabled = false,
  row = false,
  onChange,
  onBlur,
}: FormRadioGroupFieldProps) {
  const [state, setState] = useState<FormRadioGroupFieldState>(() => {
    const validation = validateRadioGroupField(initialValue, required);
    return {
      value: initialValue,
      error: validation.error,
      helperText: validation.helperText,
    };
  });

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const validation = validateRadioGroupField(newValue, required);

      setState({ value: newValue, error: validation.error, helperText: validation.helperText });
      onChange?.(newValue);
    },
    [required, onChange],
  );

  const handleBlur = useCallback(
    () => {
      const validation = validateRadioGroupField(state.value, required);
      setState((prev) => ({ ...prev, error: validation.error, helperText: validation.helperText }));
      onBlur?.(state.value);
    },
    [required, state.value, onBlur],
  );

  const helperTextId = `${id}-helper-text`;
  const groupLabelId = `${id}-group-label`;

  return (
    <FormControl
      fullWidth
      variant="outlined"
      size="small"
      error={state.error}
      disabled={disabled}
      required={required}
    >
      <FormLabel id={groupLabelId}>{label}</FormLabel>
      <RadioGroup
        aria-labelledby={groupLabelId}
        value={state.value}
        onChange={handleChange}
        onBlur={handleBlur}
        row={row}
        aria-describedby={state.error ? helperTextId : undefined}
        aria-invalid={state.error}
      >
        {options.map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            control={<Radio />}
            label={opt.label}
          />
        ))}
      </RadioGroup>
      {state.error && (
        <FormHelperText id={helperTextId} role="alert">
          {state.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}