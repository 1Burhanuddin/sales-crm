import { useTranslate } from "ra-core";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Deliberately NOT wired to react-admin's filterValues/filter store (unlike
// OnlyMineInput's sales_id toggle) -- ra-core only applies filterDefaultValues
// to a *pristine* list store (see useListParams's hasCustomParams check), so
// any returning user with prior stored deals.listParams (sort, page, an
// earlier "Only mine" toggle, ...) would never get "stage@neq" merged in and
// Not Interested deals would keep showing regardless of this feature. Local
// component state (lifted in DealList, passed down as props here) sidesteps
// that persistence gap entirely -- it always starts hidden on a fresh page
// load, for every user, no exceptions.
export const ShowNotInterestedInput = ({
  checked,
  onCheckedChange,
}: {
  alwaysOn: boolean;
  source: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => {
  const translate = useTranslate();
  return (
    <div className="mt-auto pb-2.25">
      <div className="flex items-center space-x-2">
        <Switch
          id="show-not-interested"
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <Label htmlFor="show-not-interested">
          {translate("resources.deals.filters.show_not_interested", {
            _: "Show Not Interested",
          })}
        </Label>
      </div>
    </div>
  );
};
