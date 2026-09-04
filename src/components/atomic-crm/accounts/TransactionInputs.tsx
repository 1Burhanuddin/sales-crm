import { required } from "ra-core";
import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { SCOPE_CHOICES } from "./scope";

export const TransactionInputs = () => {
  const { transactionCategories } = useConfigurationContext();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <DateInput source="date" validate={required()} helperText={false} />
        <NumberInput
          source="amount"
          validate={required()}
          helperText="Positive = income, negative = expense"
        />
      </div>
      <TextInput
        source="description"
        validate={required()}
        helperText={false}
      />
      <div className="flex gap-4">
        <SelectInput
          source="category"
          choices={transactionCategories}
          optionText="label"
          optionValue="value"
          helperText={false}
        />
        <SelectInput
          source="scope"
          choices={SCOPE_CHOICES}
          optionText="label"
          optionValue="value"
          validate={required()}
          helperText={false}
        />
      </div>
      <TextInput source="notes" multiline rows={2} helperText={false} />
    </div>
  );
};
