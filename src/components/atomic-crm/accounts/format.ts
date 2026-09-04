// Shared by AccountsDashboard and KhatabookDashboard so a future palette or
// formatting change doesn't have to be hunted down in two independent
// copies. STATUS colors are the validated (CVD-safe, contrast-checked)
// values from the dataviz skill's reference palette — see
// references/palette.md.
export const STATUS = {
  good: "#0ca30c",
  critical: "#d03b3b",
};

export const currencyFormat = (currency: string, value: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
  }).format(value);
