
import { errorMessage } from "./error-message";
import * as yup from "yup";
import 'yup-phone-lite';

const letterRegx = /^[A-Za-z]+$/;
export const loginvalidationSchema = yup.object().shape({
    email: yup.string().email(errorMessage.email).required(errorMessage.required),

    password: yup
        .string()
        .required(errorMessage.required)
        .min(4, errorMessage.passwordMin),
    // .matches(/[A-Z]/, errorMessage.passwordUpper)
    // .matches(/[a-z]/, errorMessage.passwordLower)
    // .matches(/[0-9]/, errorMessage.passwordNumber)
    // .matches(/[@$!%*?&]/, errorMessage.passwordSpecial),
})
export const signupvalidationSchema = yup.object().shape({

    firstName: yup.string().matches(letterRegx, errorMessage.letter).required(errorMessage.required),
    lastName: yup.string().matches(letterRegx, errorMessage.letter).required(errorMessage.required),
    email: yup.string().email(errorMessage.email).required(errorMessage.required),
    password: yup
        .string()
        .required(errorMessage.required)
        .min(4, errorMessage.passwordMin)
        // .matches(/[A-Z]/, errorMessage.passwordUpper)
        .matches(/[a-z]/, errorMessage.passwordLower),
    // .matches(/[0-9]/, errorMessage.passwordNumber),
    // .matches(/[@$!%*?&]/, errorMessage.passwordSpecial),
    cpassword: yup
        .string()
        .required(errorMessage.required)
        .oneOf([yup.ref("password")], errorMessage.passwordMatch),
    username: yup.string().required(errorMessage.required),
    phone: yup.string().required(errorMessage.required),


})


export const AddressvalidationSchema = yup.object({
    country: yup.string()
        .trim()
        .required("Country is required"),

    cityState: yup.string()
        .trim()
        .required("City/State is required"),

    postalCode: yup.string()
        .trim()
        .required("Postal Code is required")
        .min(4, "Postal Code must be at least 4 characters"),

    taxId: yup.string()
        .trim()
        .required("TAX ID is required"),
});
export const updateprofilevaldiation = yup.object().shape({
    firstName: yup.string().matches(letterRegx, errorMessage.letter).required(errorMessage.required),
    lastName: yup.string().matches(letterRegx, errorMessage.letter).required(errorMessage.required),
    email: yup.string().email(errorMessage.email).required(errorMessage.email),
    phone: yup.string().required(errorMessage.required),
})

export const profileValidationSchema = yup.object({

    facebook: yup.string()
        .url("Enter valid Facebook URL")
        .nullable(),

    twitter: yup.string()
        .url("Enter valid X.com URL")
        .nullable(),

    linkedin: yup.string()
        .url("Enter valid LinkedIn URL")
        .nullable(),

    instagram: yup.string()
        .url("Enter valid Instagram URL")
        .nullable(),

    firstName: yup.string()
        .required("First name is required")
        .min(2, "First name must contain at least 2 characters"),

    lastName: yup.string()
        .required("Last name is required")
        .min(2, "Last name must contain at least 2 characters"),

    email: yup.string()
        .email("Invalid email address")
        .required("Email is required"),

    phone: yup.string()
        .required("Phone number is required")
        .min(8, "Enter valid phone number"),

    bio: yup.string()
        .max(200, "Bio cannot exceed 200 characters"),

});
export const updateUserValidation = yup.object().shape({
    firstName: yup
        .string()
        .matches(letterRegx, errorMessage.letter)
        .required(errorMessage.required),

    lastName: yup
        .string()
        .matches(letterRegx, errorMessage.letter)
        .required(errorMessage.required),

    email: yup
        .string()
        .email(errorMessage.email)
        .required(errorMessage.email),

    phone: yup
        .string()
        .required(errorMessage.required),

    roleId: yup
        .number()
        .required("Role is required"),
    username: yup.string().required(errorMessage.required),
    password: yup.string().when([], {
        is: () => true,
        then: (schema) =>
            schema.test(
                "password-check",
                "Password must be at least 6 characters",
                (value) => {
                    if (!value) return true;
                    return value.length >= 6;
                }
            ),
    }),
});
