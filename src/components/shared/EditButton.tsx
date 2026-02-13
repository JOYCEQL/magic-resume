import { Button, ButtonProps } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { JSX, RefAttributes } from "react";

const EditButton = (
  props: JSX.IntrinsicAttributes &
    ButtonProps &
    RefAttributes<HTMLButtonElement>
) => {
  return (
    <Link to="/app/dashboard">
      <Button {...props}>{props.children}</Button>
    </Link>
  );
};

export default EditButton;
