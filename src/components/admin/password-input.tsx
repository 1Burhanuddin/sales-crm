import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputProps } from "ra-core";
import { useInput, useResourceContext, useTranslate, FieldTitle } from "ra-core";
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { Input } from "@/components/ui/input";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { cn } from "@/lib/utils";

export type PasswordInputProps = InputProps & {
  inputClassName?: string;
} & Omit<React.ComponentProps<"input">, "type">;

/**
 * Same as `<TextInput type="password">`, but with a button to reveal the
 * value -- so people can check what they typed before submitting.
 */
export const PasswordInput = (props: PasswordInputProps) => {
  const resource = useResourceContext(props);
  const {
    label,
    source,
    className,
    inputClassName,
    helperText,
    validate: _validateProp,
    format: _formatProp,
    ...rest
  } = props;
  const { id, field, isRequired } = useInput(props);
  const [visible, setVisible] = useState(false);
  const translate = useTranslate();

  return (
    <FormField id={id} className={className} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle
            label={label}
            source={source}
            resource={resource}
            isRequired={isRequired}
          />
        </FormLabel>
      )}
      <div className="relative">
        <FormControl>
          <Input
            {...rest}
            {...field}
            type={visible ? "text" : "password"}
            className={cn("pr-9", inputClassName)}
          />
        </FormControl>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={translate(
            visible ? "crm.profile.password.hide" : "crm.profile.password.show",
            { _: visible ? "Hide password" : "Show password" },
          )}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
