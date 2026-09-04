import { useCreate, useNotify } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import type { InputProps } from "ra-core";
import type { PopoverProps } from "@radix-ui/react-popover";

// Same pick-or-create-inline pattern as AutocompleteCompanyInput -- typing
// a name that doesn't match anyone yet offers to create them on the spot,
// no separate "add a person first" detour before logging a loan.
export const AutocompletePersonInput = ({
  validate,
  label,
  modal,
}: Pick<InputProps, "validate" | "label"> & Pick<PopoverProps, "modal">) => {
  const [create] = useCreate();
  const notify = useNotify();
  const handleCreatePerson = async (name?: string) => {
    if (!name) return;
    try {
      return await create(
        "people",
        { data: { name } },
        { returnPromise: true },
      );
    } catch {
      notify("resources.people.autocomplete.create_error", {
        type: "error",
        _: "An error occurred while adding this person",
      });
    }
  };

  return (
    <AutocompleteInput
      label={label}
      optionText="name"
      helperText={false}
      onCreate={handleCreatePerson}
      createItemLabel="resources.people.autocomplete.create_item"
      createLabel="resources.people.autocomplete.create_label"
      validate={validate}
      modal={modal}
    />
  );
};
