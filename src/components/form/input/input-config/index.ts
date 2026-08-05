import { FormField } from "../types";

export const signupFields: FormField[] = [
    {
        name: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Jainil",
        autoComplete: "given-name",
        colSpan: 6,
        required: true,
    },
    {
        name: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Kukrolia",
        autoComplete: "family-name",
        colSpan: 6,
        required: true,
    },
    {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "joiie@yopmail.com",
        autoComplete: "email",
        colSpan: 12,
        required: true,
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter password",
        autoComplete: "new-password",
        colSpan: 12,
        required: true,
    },
    {
        name: "cpassword",
        label: "Confirm Password",
        type: "password",
        placeholder: "Confirm password",
        autoComplete: "new-password",
        colSpan: 12,
        required: true,
    },
];

export const locationFields = [
    {
        name: "country",
        label: "Country",
        type: "text",
        placeholder: "India",
        autoComplete: "country-name",
        required: true,
        colSpan: 6,
    },
    {
        name: "cityState",
        label: "City/State",
        type: "text",
        placeholder: "Ahemdabad, India",
        autoComplete: "address-level1",
        required: true,
        colSpan: 6,
    },
    {
        name: "postalCode",
        label: "Postal Code",
        type: "text",
        placeholder: "389212 ",
        autoComplete: "postal-code",
        required: true,
        colSpan: 6,
    },
    {
        name: "taxId",
        label: "TAX ID",
        type: "text",
        placeholder: "AS4568384",
        autoComplete: "off",
        required: true,
        colSpan: 6,
    },
];
export const loginFields: FormField[] = [
    {
        name: "username",
        label: "Email",
        type: "text",
        placeholder: "name@yopmail.com",
        autoComplete: "email",
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter password",
        autoComplete: "password",
    },


];

export interface ProfileField {
    name: string;
    label: string;
    type: string;
    as?: string;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
    colSpan?: number;
}

export const socialFields: ProfileField[] = [
    {
        name: "facebook",
        label: "Facebook",
        type: "text",
        placeholder: "https://facebook.com/username",
        required: false,
        colSpan: 6,
    },
    {
        name: "twitter",
        label: "X.com",
        type: "text",
        placeholder: "https://x.com/username",
        required: false,
        colSpan: 6,
    },
    {
        name: "linkedin",
        label: "LinkedIn",
        type: "text",
        placeholder: "https://linkedin.com/in/username",
        required: false,
        colSpan: 6,
    },
    {
        name: "instagram",
        label: "Instagram",
        type: "text",
        placeholder: "https://instagram.com/username",
        required: false,
        colSpan: 6,
    },
];


export const personalFields: ProfileField[] = [
    {
        name: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Enter first name",
        autoComplete: "given-name",
        required: true,
        colSpan: 6,
    },

    {
        name: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Enter last name",
        autoComplete: "family-name",
        required: true,
        colSpan: 6,
    },
    {
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "Enter email",
        autoComplete: "email",
        required: true,
        colSpan: 6,
    },
    {
        name: "phone",
        label: "Phone",
        type: "text",
        placeholder: "Enter phone number",
        autoComplete: "tel",
        required: true,
        colSpan: 6,
    },
    {
        name: "bio",
        label: "Bio",
        type: "textarea",
        as: "textarea",
        placeholder: "Enter bio",
        required: false,
        colSpan: 12,
    },
];
