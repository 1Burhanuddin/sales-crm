import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDataProvider, useNotify, useTranslate, type Identifier } from "ra-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CrmDataProvider } from "../providers/types";

const MIN_LENGTH = 6;

/** Sets a new password directly (no email involved) -- shared between
 * ProfilePage (self-service) and SalesEdit (an admin resetting someone
 * else's). Authorization (own account or admin) is enforced server-side
 * by the update_password edge function. */
export const ChangePasswordForm = ({
  salesId,
  onDone,
}: {
  salesId: Identifier;
  onDone?: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => dataProvider.updatePassword(salesId, password),
    onSuccess: () => {
      notify("crm.profile.password.updated", {
        messageArgs: { _: "Password updated" },
      });
      setPassword("");
      setConfirm("");
      onDone?.();
    },
    onError: (error: unknown) => {
      notify(error instanceof Error ? error.message : "ra.notification.http_error", {
        type: "error",
      });
    },
  });

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= MIN_LENGTH && password === confirm && !isPending;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`new-password-${salesId}`}>
          {translate("crm.profile.password.new", { _: "New password" })}
        </Label>
        <PasswordField
          id={`new-password-${salesId}`}
          value={password}
          onChange={setPassword}
        />
        {tooShort && (
          <p className="text-xs text-destructive">
            {translate("crm.profile.password.too_short", {
              _: "At least 6 characters",
            })}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`confirm-password-${salesId}`}>
          {translate("crm.profile.password.confirm", { _: "Confirm password" })}
        </Label>
        <PasswordField
          id={`confirm-password-${salesId}`}
          value={confirm}
          onChange={setConfirm}
        />
        {mismatch && (
          <p className="text-xs text-destructive">
            {translate("crm.profile.password.mismatch", {
              _: "Passwords don't match",
            })}
          </p>
        )}
      </div>
      <Button type="button" disabled={!canSubmit} onClick={() => mutate()}>
        {translate("crm.profile.password.change", { _: "Change password" })}
      </Button>
    </div>
  );
};

/** A password `<Input>` with its own independent show/hide toggle. */
const PasswordField = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const translate = useTranslate();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={translate(
          visible ? "crm.profile.password.hide" : "crm.profile.password.show",
          { _: visible ? "Hide password" : "Show password" },
        )}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
};
