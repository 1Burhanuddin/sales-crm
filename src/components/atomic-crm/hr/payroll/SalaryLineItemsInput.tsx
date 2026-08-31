import { ArrayInput } from "@/components/admin/array-input";
import { NumberInput } from "@/components/admin/number-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";

export const SalaryLineItemsInput = ({
  source,
  label,
}: {
  source: string;
  label: string;
}) => (
  <div className="flex flex-col gap-2">
    <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
    <ArrayInput source={source} label={false} helperText={false}>
      <SimpleFormIterator inline disableReordering>
        <TextInput
          source="label"
          label={false}
          placeholder="Label"
          className="flex-1"
        />
        <NumberInput
          source="amount"
          label={false}
          placeholder="Amount"
          helperText={false}
          className="w-32"
        />
      </SimpleFormIterator>
    </ArrayInput>
  </div>
);
