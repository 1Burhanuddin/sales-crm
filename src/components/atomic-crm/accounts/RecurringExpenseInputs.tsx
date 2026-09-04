import { maxValue, minValue, required } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { SCOPE_CHOICES } from "./scope";

export const RecurringExpenseInputs = () => {
  const { transactionCategories } = useConfigurationContext();

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        source="name"
        validate={required()}
        helperText={false}
        placeholder="Car EMI, Insiya's class fees…"
      />
      <div className="flex gap-4">
        <NumberInput
          source="amount"
          validate={[required(), minValue(0.01)]}
          helperText={false}
        />
        <NumberInput
          source="due_day"
          validate={[required(), minValue(1), maxValue(28)]}
          helperText="Day of month it's due (1–28)"
        />
      </div>
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
      <TextInput
        source="match_keyword"
        helperText="If a real transaction's description contains this, it'll be suggested as a match when reviewing a statement import (e.g. “netflix”, “hdfc emi”)."
      />
      <BooleanInput
        source="active"
        helperText="Turn off instead of deleting once this expense stops recurring — keeps its history on past transactions."
      />
    </div>
  );
};
