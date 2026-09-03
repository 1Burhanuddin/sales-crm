import { useListFilterContext, useTranslate } from "ra-core";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Not Interested deals are excluded by default (see the "stage@neq" default
// in DealList.tsx's filterDefaultValues) -- dead leads shouldn't clutter the
// board/table every day. This switch is the only way back in: flipping it
// removes the "stage@neq" filter key entirely so every stage (including Not
// Interested) shows again. Same on/off-a-filter-key pattern as
// OnlyMineInput, just toggling "stage@neq" instead of "sales_id".
export const ShowNotInterestedInput = (_: {
  alwaysOn: boolean;
  source: string;
}) => {
  const translate = useTranslate();
  const { filterValues, displayedFilters, setFilters } =
    useListFilterContext();

  const handleChange = () => {
    const newFilterValues = { ...filterValues };
    if (typeof filterValues["stage@neq"] !== "undefined") {
      delete newFilterValues["stage@neq"];
    } else {
      newFilterValues["stage@neq"] = "not-interested";
    }
    setFilters(newFilterValues, displayedFilters);
  };

  return (
    <div className="mt-auto pb-2.25">
      <div className="flex items-center space-x-2">
        <Switch
          id="show-not-interested"
          checked={typeof filterValues["stage@neq"] === "undefined"}
          onCheckedChange={handleChange}
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
