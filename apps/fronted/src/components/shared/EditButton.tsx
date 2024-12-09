import { Button, ButtonProps } from "@/components/ui/button";
import Link from "next/link";
import { JSX, RefAttributes } from "react";

const EditButton = (
  props: JSX.IntrinsicAttributes &
    ButtonProps &
    RefAttributes<HTMLButtonElement>
) => {
  return (
    <Link href={"/dashboard"}>
      <Button {...props}>{props.children}</Button>
    </Link>
  );
};

export default EditButton;
