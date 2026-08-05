import { useState, useCallback, ChangeEvent } from "react";
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from "@mui/material";

/* ── Option type ── */
export interface CheckboxOption {
  value: string | number;
  label: string;
}

/* ── Type exports ── */
export interface FormCheckboxGroupFieldProps {
  /** Unique field identifier (used for aria-describedby) */
  id: string;
  /** Visible label rendered inside <FormLabel> */
  label: string;
  /** Array of {value, label} options for the checkbox group */
  options: CheckboxOption[];
  /** Initial array of selected values */
  initialValues?: (string | number)[];
  /** If true, at least one checkbox must be selected */
  required?: boolean;
  /** Disable the entire group */
  disabled?: boolean;
  /** Layout direction of checkboxes */
  row?: boolean;
  /** Callback fired with the current selected values whenever they change */
  onChange?: (values: (string | number)[]) => void;
}

export interface FormCheckboxGroupFieldState {
  values: (string | number)[];
  error: boolean;
  helperText: string;
}

/* ── Default error messages ── */
const DEFAULT_REQUIRED_MESSAGE = "Please select at least one option";

/* ── Validation engine ── */
export function validateCheckboxGroupField(
  values: (string | number)[],
  required?: boolean,
): { error: boolean; helperText: string } {
  if (required && values.length === 0) {
    return { error: true, helperText: DEFAULT_REQUIRED_MESSAGE };
  }
  return { error: false, helperText: "✓" };
}

/* ── React component ── */
export default function FormCheckboxGroupField({
  id,
  label,
  options,
  initialValues = [],
  required = false,
  disabled = false,
  row = false,
  onChange,
}: FormCheckboxGroupFieldProps) {
  const [state, setState] = useState<FormCheckboxGroupFieldState>(() => {
    const validation = validateCheckboxGroupField(initialValues, required);
    return {
      values: initialValues,
      error: validation.error,
      helperText: validation.helperText,
    };
  });

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value, checked } = e.target;
      const newValues = checked
        ? [...state.values, value]
        : state.values.filter((v) => String(v) !== value);

      const validation = validateCheckboxGroupField(newValues, required);

      setState({ values: newValues, error: validation.error, helperText: validation.helperText });
      onChange?.(newValues);
    },
    [required, state.values, onChange],
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
      <FormGroup
        row={row}
        aria-labelledby={groupLabelId}
        aria-describedby={state.error ? helperTextId : undefined}
      >
        {options.map((opt) => {
          const stringValue = String(opt.value);
          return (
            <FormControlLabel
              key={stringValue}
              control={
                <Checkbox
                  checked={state.values.some((v) => String(v) === stringValue)}
                  onChange={handleChange}
                  value={stringValue}
                  name={stringValue}
                  disabled={disabled}
                />
              }
              label={opt.label}
            />
          );
        })}
      </FormGroup>
      {state.error && (
        <FormHelperText id={helperTextId} role="alert">
          {state.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
