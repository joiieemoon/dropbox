import type { InputControllerProps } from "../types";
import React from "react";

import Input from "../input-fields";

/**
 * InputController handles form controller logic and delegates rendering to InputField.
 *
 * It maps the `control` prop to the appropriate field type and passes all other props through.
 * To add a new field variant, simply add a new case and map it to the corresponding `as` or `type`.
 */
const InputController = ({ control, ...props }: InputControllerProps) => {
  switch (control) {
    case "input":
      return <Input as="input" {...props} />;

    case "textarea":
      return <Input as="textarea" {...props} />;

    case "select":
      return <Input as="select" {...props} />;

    case "checkbox":
      return <Input type="checkbox" {...props} />;

    case "radio":
      return <Input type="radio" {...props} />;

    case "file":
      return <Input type="file" {...props} />;

    case "multi-select":
      return <Input as="multi-select" {...props} />;

    default:
      return null;
  }
};

export default React.memo(InputController);
