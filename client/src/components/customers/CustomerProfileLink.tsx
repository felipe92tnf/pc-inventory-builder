import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { customerProfilePath } from "../../utils/customerProfile";
import { SECONDARY_GHOST_SM } from "../../theme/actionButtons";

type CustomerProfileLinkProps = {
  customerName: string;
  customerPhone?: string | null;
  className?: string;
  children?: ReactNode;
};

export function CustomerProfileLink({
  customerName,
  customerPhone,
  className,
  children
}: CustomerProfileLinkProps) {
  return (
    <Link
      to={customerProfilePath(customerName, customerPhone)}
      className={className ?? SECONDARY_GHOST_SM}
    >
      {children ?? "Ficha cliente"}
    </Link>
  );
}
