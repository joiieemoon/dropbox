import { useState, useCallback, ChangeEvent } from "react";
import {
  FormControl,
  FormControlLabel,
  Switch,
  FormHelperText,
} from "@mui/material";

/* ── Type exports ── */
export interface FormSwitchFieldProps {
  /** Unique field identifier (used for id) */
  id: string;
  /** Label text displayed next to the switch */
  label: string;
  /** Initial checked state */
  initialChecked?: boolean;
  /** Disable the switch */
  disabled?: boolean;
  /** Callback fired when toggled */
  onChange?: (checked: boolean) => void;
}

export interface FormSwitchFieldState {
  checked: boolean;
}

/* ── React component ── */
export default function FormSwitchField({
  id,
  label,
  initialChecked = false,
  disabled = false,
  onChange,
}: FormSwitchFieldProps) {
  const [checked, setChecked] = useState<boolean>(initialChecked);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      setChecked(newChecked);
      onChange?.(newChecked);
    },
    [onChange],
  );

  const helperTextId = `${id}-helper-text`;

  return (
    <FormControl
      fullWidth
      variant="outlined"
      size="small"
      disabled={disabled}
    >
      <FormControlLabel
        control={
          <Switch
            id={id}
            checked={checked}
            onChange={handleChange}
            aria-describedby={helperTextId}
          />
        }
        label={label}
      />
      <FormHelperText id={helperTextId}>
        {checked ? "Enabled" : "Disabled"}
      </FormHelperText>
    </FormControl>
  );
}