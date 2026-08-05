import { useModal } from "../../../../hooks/useModal";
import { Modal } from "../../../../components/common/modal/Modal";
import Button from "../../../../components/ui/button/Button";
import { Formik, Form } from "formik";

import {
  personalFields,
  socialFields,
} from "../../../../components/form/input/input-config";
import InputField from "../../../../components/form/input/input-fields/InputField";
import { useAppSelector } from "../../../../store/hooks";
import { selectUser } from "../../../../store/selectors";
import { useUpdateProfile } from "../../../../api/hooks";   
import { profileValidationSchema } from "../../../../components/form/input/validation";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const user = useAppSelector(selectUser);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  // Use user data from Redux or fallback to defaults
  const displayName = user?.firstName || user?.username || "Guest";
  const displayImage = user?.image || "/images/user/owner.png";

  interface PersonalInfoFormValues {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
  }

  const initialProfileValues: PersonalInfoFormValues = {
    facebook: "https://www.facebook.com/joieeedev",
    twitter: "https://x.com/joieeedev",
    linkedin: "https://www.linkedin.com/in/joieeedev",
    instagram: "https://www.instagram.com/joieeedev",

    firstName: user?.firstName || "Guest",
    lastName: user?.lastName || "",
    email: user?.email || "guest@example.com",
    phone: user?.phone || "",
    bio: "Team Manager",
  };

  const handleSubmit = async (values: PersonalInfoFormValues) => {
    try {
      console.log("call profile ", values);
      // Update profile with the form values
      updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      });
      closeModal();
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src={displayImage} alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {displayName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.address?.city || "Team Manager"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.address?.country || "Location"}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {/* Social links */}
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] m-4"
        keepMounted={true}
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>

            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          <Formik<PersonalInfoFormValues>
            initialValues={initialProfileValues}
            validationSchema={profileValidationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              isSubmitting,
            }) => (
              <Form className="flex flex-col">
                <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                  {/* Social Links */}
                  <div>
                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Social Links
                    </h5>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      {socialFields.map((field) => (
                        <div key={field.name}>
                          <InputField
                            name={field.name}
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={
                              values[field.name as keyof PersonalInfoFormValues]
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={Boolean(
                              touched[
                                field.name as keyof PersonalInfoFormValues
                              ] &&
                              errors[
                                field.name as keyof PersonalInfoFormValues
                              ],
                            )}
                            errorMessage={
                              touched[
                                field.name as keyof PersonalInfoFormValues
                              ] &&
                              errors[field.name as keyof PersonalInfoFormValues]
                                ? errors[
                                    field.name as keyof PersonalInfoFormValues
                                  ]
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="mt-7">
                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Personal Information
                    </h5>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      {personalFields.map((field) => (
                        <div
                          key={field.name}
                          className={
                            field.colSpan === 12 ? "lg:col-span-2" : ""
                          }
                        >
                          <InputField
                            name={field.name}
                            label={
                              <>
                                {field.label}
                                {field.required && (
                                  <span className="text-error-500"> *</span>
                                )}
                              </>
                            }
                            type={field.type}
                            placeholder={field.placeholder}
                            value={
                              values[field.name as keyof PersonalInfoFormValues]
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={Boolean(
                              touched[
                                field.name as keyof PersonalInfoFormValues
                              ] &&
                              errors[
                                field.name as keyof PersonalInfoFormValues
                              ],
                            )}
                            errorMessage={
                              touched[
                                field.name as keyof PersonalInfoFormValues
                              ] &&
                              errors[field.name as keyof PersonalInfoFormValues]
                                ? errors[
                                    field.name as keyof PersonalInfoFormValues
                                  ]
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 flex-1"
                  >
                    Close
                  </button>

                  <Button size="sm" 
                  type="submit"
                  disabled={isSubmitting || isPending}
                  >
                    {isSubmitting || isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>
    </>
  );
}
