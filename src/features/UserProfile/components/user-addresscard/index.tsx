import { useModal } from "../../../../hooks/useModal";
import { Modal } from "../../../../components/common/modal";
import Button from "../../../../components/ui/button/Button";

import { Formik, Form } from "formik";

import { locationFields } from "../../../../components/form/input/input-config";
import InputField from "../../../../components/form/input/input-fields/InputField";
import { useAppSelector } from "../../../../store/hooks";
import { selectUser } from "../../../../store/selectors";
import { useUpdateProfile } from "../../../../api/hooks";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const user = useAppSelector(selectUser);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  interface LocationFormValues {
    country: string;
    cityState: string;
    postalCode: string;
    taxId: string;
  }

  const initialValues: LocationFormValues = {
    country: user?.address?.country || "India",
    cityState: user?.address?.city || "Ahmedabad, India",
    postalCode: user?.address?.postalCode || "386525",
    taxId: "AS4568384",
  };

  const handleSubmit = async (values: LocationFormValues) => {
    try {
      // Update profile with the form values
      updateProfile({
        address: {
          country: values.country,
          city: values.cityState,
          postalCode: values.postalCode,
        },
      });
      closeModal();
    } catch (error) {
      console.error("Failed to update address", error);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Country
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.address?.country || "India"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  City/State
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.address?.city || "Ahmedabad, India"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Postal Code
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.address?.postalCode || "385254"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  TAX ID
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  AS4568384
                </p>
              </div>
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

      <Modal isOpen={isOpen} onClose={closeModal} size="sm">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Location Details
            </h4>

            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your location information to keep your profile up-to-date.
            </p>
          </div>

          <Formik
            initialValues={initialValues}
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
                <div className="px-2 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                    {locationFields.map((field) => (
                      <div
                        key={field.name}
                        className={field.colSpan === 12 ? "lg:col-span-2" : ""}
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
                          autoComplete={field.autoComplete}
                          value={values[field.name as keyof LocationFormValues]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={Boolean(
                            touched[field.name as keyof LocationFormValues] &&
                            errors[field.name as keyof LocationFormValues],
                          )}
                          errorMessage={
                            touched[field.name as keyof LocationFormValues] &&
                            errors[field.name as keyof LocationFormValues]
                              ? errors[field.name as keyof LocationFormValues]
                              : undefined
                          }
                        />
                      </div>
                    ))}
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

                  <Button type="submit" size="sm" disabled={isSubmitting || isPending}>
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