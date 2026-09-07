import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
        <Input
          id={`new-password-${salesId}`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <Input
          id={`confirm-password-${salesId}`}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
