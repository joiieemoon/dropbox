// import type { Meta, StoryObj } from "@storybook/react-vite";
// import { useState } from "react";
// import Input from "./index";
// import "../../../../index.css";
// const meta: Meta<typeof Input> = {
//   title: "Components/Form/Input",
//   component: Input,
//   tags: ["autodocs"],
//   args: {
//     type: "text",
//     label: "Username",
//     id: "username",
//     name: "username",
//     placeholder: "Enter your username",
//     disabled: false,
//     success: false,
//     error: false,
//     hint: "",
//     errorMessage: "",
//   },
// };

// export default meta;

// type Story = StoryObj<typeof Input>;

// export const Default: Story = {
//   render: (args) => {
//     const [value, setValue] = useState("");

//     return (
//       <Input
//         {...args}
//         value={value}
//         onChange={(e) => {
//           setValue(String(e.target.value));
//         }}
//       />
//     );
//   },
// };

// export const WithError: Story = {
//   render: (args) => {
//     const [value, setValue] = useState("");

//     return (
//       <Input
//         {...args}
//         value={value}
//         onChange={(e) => setValue(String(e.target.value))}
//       />
//     );
//   },
//   args: {
//     error: true,
//     errorMessage: "Username is required",
//   },
// };

// export const Success: Story = {
//   render: (args) => {
//     const [value, setValue] = useState("John");

//     return (
//       <Input
//         {...args}
//         value={value}
//         onChange={(e) => setValue(String(e.target.value))}
//       />
//     );
//   },
//   args: {
//     success: true,
//     hint: "Username is available",
//   },
// };

// export const Disabled: Story = {
//   args: {
//     disabled: true,
//     value: "John Doe",
//   },
// };

// export const Password: Story = {
//   render: (args) => {
//     const [value, setValue] = useState("");

//     return (
//       <Input
//         {...args}
//         value={value}
//         onChange={(e) => setValue(String(e.target.value))}
//       />
//     );
//   },
//   args: {
//     type: "password",
//     label: "Password",
//     placeholder: "Enter your password",
//   },
// };

// export const TextArea: Story = {
//   render: (args) => {
//     const [value, setValue] = useState("");

//     return (
//       <Input
//         {...args}
//         value={value}
//         onChange={(e) => {
//           setValue(String(e.target.value));
//         }}
//       />
//     );
//   },
//   args: {
//     as: "textarea",
//     label: "Description",
//     id: "description",
//     name: "description",
//     rows: 5,
//     placeholder: "Write something...",
//   },
// };

import "../../../../index.css";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import Input from "./index";

// const meta: Meta<typeof Input> = {
//   title: "Components/Form/Input",
//   component: Input,
//   tags: ["autodocs"],

// };
const meta: Meta<typeof Input> = {
  title: "Components/Form/Input",
  component: Input,
  tags: ["autodocs"],

  argTypes: {
    as: {
      control: {
        type: "select",
      },
      options: [
        "input",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "file",
        "multi-select",
      ],
    },

    type: {
      control: {
        type: "select",
      },
      options: ["text", "password", "email", "number"],
    },

    error: {
      control: "boolean",
    },

    success: {
      control: "boolean",
    },

    disabled: {
      control: "boolean",
    },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

/* ---------------- TEXT INPUT ---------------- */

export const TextInput: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <Input
        {...args}
        value={value}
        onChange={(e) => {
          if (e && typeof e === "object" && "target" in e) {
            setValue(String(e.target.value));
          }
        }}
      />
    );
  },
  args: {
    as: "input",
    type: "text",
    label: "Username",
    name: "username",
    placeholder: "Enter username",
  },
};

/* ---------------- PASSWORD ---------------- */

export const Password: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <Input
        {...args}
        value={value}
        onChange={(e) => {
          if (e && typeof e === "object" && "target" in e) {
            setValue(String(e.target.value));
          }
        }}
      />
    );
  },
  args: {
    type: "password",
    label: "Password",
    placeholder: "Enter password",
  },
};

/* ---------------- TEXTAREA ---------------- */

export const TextArea: Story = {
  render: (args) => {
    const [value, setValue] = useState("");

    return (
      <Input
        {...args}
        value={value}
        onChange={(e) => {
          if (e && typeof e === "object" && "target" in e) {
            setValue(String(e.target.value));
          }
        }}
      />
    );
  },
  args: {
    as: "textarea",
    label: "Description",
    name: "description",
    rows: 5,
    placeholder: "Write something...",
  },
};
/* ---------------- SELECT ---------------- */

export const Select: Story = {
  render: (args) => {
    const [value, setValue] = useState("react");

    return (
      <Input
        {...args}
        value={value}
        onChange={(e) => {
          if (e && typeof e === "object" && "target" in e) {
            setValue(String(e.target.value));
          }
        }}
      >
        <option value="react">React</option>
        <option value="vue">Vue</option>
        <option value="angular">Angular</option>
      </Input>
    );
  },

  args: {
    as: "select",
    label: "Framework",
    name: "framework",
  },
};

/* ---------------- CHECKBOX ---------------- */

export const Checkbox: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);

    return (
      <Input
        {...args}
        checked={checked}
        onChange={(val) => {
          if (typeof val === "boolean") {
            setChecked(val);
          }
        }}
      />
    );
  },

  args: {
    as: "checkbox",
    label: "Accept terms",
  },
};

/* ---------------- RADIO ---------------- */

export const Radio: Story = {
  render: (args) => {
    const [value, setValue] = useState("male");

    return (
      <div>
        <Input
          {...args}
          value="male"
          checked={value === "male"}
          onChange={(val) => {
            if (typeof val === "string") setValue(val);
          }}
        />

        <Input
          {...args}
          value="female"
          checked={value === "female"}
          onChange={(val) => {
            if (typeof val === "string") setValue(val);
          }}
        />
      </div>
    );
  },

  args: {
    as: "radio",
    name: "gender",
    label: "Gender",
  },
};

/* ---------------- FILE ---------------- */

export const File: Story = {
  args: {
    as: "file",
    label: "Upload File",
  },
};

/* ---------------- MULTI SELECT ---------------- */

/* ---------------- MULTI SELECT ---------------- */

export const MultiSelect: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>([]);

    return (
      <Input
        {...args}
        value={value}
        onChange={(selected) => {
          if (Array.isArray(selected)) {
            console.log("Selected:", selected);
            setValue(selected);
          }
        }}
      />
    );
  },

  args: {
    as: "multi-select",
    label: "Select Skills",
    name: "skills",
    placeholder: "Select skills",
    options: [
      {
        value: "react",
        text: "React",
      },
      {
        value: "typescript",
        text: "TypeScript",
      },
      {
        value: "node",
        text: "Node JS",
      },
    ],
  },
};
// export const MultiSelect: Story = {
//   render: (args) => {
//     const [value, setValue] = useState<string[]>([]);

//     return (
//       <Input
//         {...args}
//         value={value}
//         onChange={(e) => setValue(e.target.value as string[])}
//       />
//     );
//   },

//   args: {
//     as: "multi-select",
//     label: "Select Skills",
//     options: [
//       {
//         value: "react",
//         label: "React",
//       },
//       {
//         value: "typescript",
//         label: "TypeScript",
//       },
//       {
//         value: "node",
//         label: "Node JS",
//       },
//     ],
//   },
// };
