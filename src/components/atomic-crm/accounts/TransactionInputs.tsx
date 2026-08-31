import { required } from "ra-core";
import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";

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
      <SelectInput
        source="category"
        choices={transactionCategories}
        optionText="label"
        optionValue="value"
        helperText={false}
      />
      <TextInput source="notes" multiline rows={2} helperText={false} />
    </div>
  );
};
