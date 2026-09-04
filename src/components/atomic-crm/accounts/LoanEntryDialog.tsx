import { Plus } from "lucide-react";
import {
  CreateBase,
  Form,
  minValue,
  required,
  useDataProvider,
  useNotify,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { SaveButton } from "@/components/admin/form";
import { NumberInput } from "@/components/admin/number-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import type { Loan, Person } from "../types";
import { AutocompletePersonInput } from "./AutocompletePersonInput";
import { SCOPE_CHOICES } from "./scope";

const DIRECTION_CHOICES = [
  { value: "given", label: "I gave money" },
  { value: "received", label: "I received money" },
];

// Linking the loan to a real transaction is offered, not forced -- a cash
// loan with nothing going through the bank has nothing to link to. When it
// is created, "transfer" is the closest existing category (money moving to
// or from a person, not a real expense/income) rather than adding a new
// admin-config category just for this one case.
const LOAN_TRANSACTION_CATEGORY = "transfer";

export const LoanEntryDialog = () => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  // Not a `loans` column, so it's plain component state rather than a
  // react-admin form field that would need stripping out of the create
  // payload -- read directly (not via form data) in handleLoanCreated.
  const [alsoLogTransaction, setAlsoLogTransaction] = useState(true);

  const handleLoanCreated = async (loan: Loan) => {
    setOpen(false);
    if (!alsoLogTransaction) {
      refresh();
      return;
    }
    try {
      const { data: person } = await dataProvider.getOne<Person>("people", {
        id: loan.person_id,
      });
      const description =
        loan.direction === "given"
          ? `Loan to ${person.name}`
          : `Loan from ${person.name}`;
      const { data: transaction } = await dataProvider.create("transactions", {
        data: {
          date: new Date().toISOString().slice(0, 10),
          description,
          amount: loan.direction === "given" ? -loan.amount : loan.amount,
          category: LOAN_TRANSACTION_CATEGORY,
          scope: loan.scope,
          notes: loan.notes,
          source: "manual",
        },
      });
      await dataProvider.update("loans", {
        id: loan.id,
        data: { transaction_id: transaction.id },
        previousData: loan,
      });
    } catch {
      notify("resources.loans.transaction_link_error", {
        type: "warning",
        _: "Loan saved, but couldn't also log it as a transaction — add it manually if needed.",
      });
    } finally {
      refresh();
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        {translate("resources.loans.action.add", { _: "Add Entry" })}
      </Button>

      <CreateBase
        resource="loans"
        record={{ direction: "given", scope: "personal" }}
        mutationOptions={{ onSuccess: handleLoanCreated }}
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="lg:max-w-lg overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
            <Form className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>
                  {translate("resources.loans.action.add", {
                    _: "Add Entry",
                  })}
                </DialogTitle>
              </DialogHeader>

              <ReferenceInput source="person_id" reference="people">
                <AutocompletePersonInput
                  label="resources.loans.fields.person_id"
                  validate={required()}
                  modal
                />
              </ReferenceInput>

              <div className="flex gap-4">
                <SelectInput
                  source="direction"
                  choices={DIRECTION_CHOICES}
                  optionText="label"
                  optionValue="value"
                  validate={required()}
                  helperText={false}
                />
                <NumberInput
                  source="amount"
                  validate={[required(), minValue(0.01)]}
                  helperText={false}
                />
              </div>

              <SelectInput
                source="scope"
                choices={SCOPE_CHOICES}
                optionText="label"
                optionValue="value"
                validate={required()}
                helperText={false}
              />

              <TextInput
                source="notes"
                multiline
                rows={2}
                helperText={false}
                placeholder="What's this for? (optional)"
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="also-log-transaction"
                  checked={alsoLogTransaction}
                  onCheckedChange={(checked) => setAlsoLogTransaction(!!checked)}
                />
                <Label
                  htmlFor="also-log-transaction"
                  className="text-sm font-normal text-muted-foreground"
                >
                  {translate("resources.loans.also_log_transaction", {
                    _: "Also log this in Accounts (uncheck for a cash loan not through the bank)",
                  })}
                </Label>
              </div>

              <DialogFooter className="w-full justify-end">
                <SaveButton
                  label={translate("resources.loans.action.add", {
                    _: "Add Entry",
                  })}
                />
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </CreateBase>
    </>
  );
};
