import { jsx as _jsx } from "react/jsx-runtime";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON_SM,
  SECONDARY_GHOST_SM,
  DESTRUCTIVE_BUTTON_SM
} from "../../theme/actionButtons";

const VARIANT_CLASSES = {
  primary: PRIMARY_ACTION_BUTTON,
  secondary: SECONDARY_BUTTON_SM,
  danger: DESTRUCTIVE_BUTTON_SM,
  edit: "rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-900/35 disabled:opacity-50",
  detail: SECONDARY_GHOST_SM,
  cyan: PRIMARY_ACTION_BUTTON_COMPACT
};
export function AppButton({ variant = "primary", className = "", children, ...props }) {
  return _jsx("button", {
    type: "button",
    className: `${VARIANT_CLASSES[variant]} ${className}`.trim(),
    ...props,
    children
  });
}
