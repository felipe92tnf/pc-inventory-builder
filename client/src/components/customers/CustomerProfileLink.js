import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { customerProfilePath } from "../../utils/customerProfile";
import { SECONDARY_GHOST_SM } from "../../theme/actionButtons";
export function CustomerProfileLink({ customerName, customerPhone, customerId, className, children }) {
    return (_jsx(Link, { to: customerProfilePath(customerName, customerPhone, customerId), className: className ?? SECONDARY_GHOST_SM, children: children ?? "Ficha cliente" }));
}
