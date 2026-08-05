import Input from "../input-fields";
export interface InputControllerProps
    extends React.ComponentProps<typeof Input> {
    control: "input" | "textarea" | "select" | "checkbox" | "radio" | "file" | "multi-select" | string;
}
export interface InputProps {
    type?: "text" | "number" | "email" | "password" | "date" | "time" | string;

    id?: string;
    name?: string;
    placeholder?: string;

    value?: string | number | string[];

    onChange?: React.ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;

    onBlur?: React.FocusEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;

    onFocus?: React.FocusEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;

    onKeyDown?: React.KeyboardEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;

    className?: string;
    min?: string;
    max?: string;
    step?: number;
    disabled?: boolean;
    success?: boolean;
    error?: boolean;
    hint?: string;
    rows?: number;

    label?: string;

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

export interface FormField {
    name: string;
    label: string;
    type: "text" | "email" | "password" | "textarea";
    placeholder?: string;
    autoComplete?: string;

    // Layout
    colSpan?: 6 | 12;

    // Future extensibility
    required?: boolean;
    disabled?: boolean;
}