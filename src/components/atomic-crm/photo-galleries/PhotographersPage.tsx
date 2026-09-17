import { Plus } from "lucide-react";
import {
  useCreate,
  useDataProvider,
  useGetList,
  useGetMany,
  useNotify,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import type { Photographer, PhotographerStorageUsage } from "../types";
import { FolderPagination } from "./FolderPagination";
import { formatBytes } from "./formatBytes";

const PHOTOGRAPHERS_PER_PAGE = 20;

export const PhotographersPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const [page, setPage] = useState(1);
  const {
    data: photographers,
    total: photographerTotal,
    isPending,
    refetch,
  } = useGetList<Photographer>("photographers", {
    pagination: { page, perPage: PHOTOGRAPHERS_PER_PAGE },
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: usageByPhotographer } = useGetMany<PhotographerStorageUsage>(
    "photographer_storage_usage",
    { ids: (photographers ?? []).map((p) => p.id) },
    { enabled: (photographers ?? []).length > 0 },
  );
  const [create, { isPending: isCreating }] = useCreate();
  const [name, setName] = useState("");
  const [withLogin, setWithLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || (withLogin && (!email.trim() || !password))) return;
    try {
      let loginSalesId: string | number | undefined;
      if (withLogin) {
        const sale = await dataProvider.salesCreate({
          email: email.trim(),
          password,
          first_name: name.trim(),
          last_name: "",
          administrator: false,
          disabled: false,
          is_developer: false,
          notes_only: false,
          is_accounts: false,
          is_marketing: false,
          is_photographer: true,
        });
        loginSalesId = sale.id;
      }
      create(
        "photographers",
        { data: { name: name.trim(), login_sales_id: loginSalesId ?? null } },
        {
          onSuccess: () => {
            setName("");
            setEmail("");
            setPassword("");
            setWithLogin(false);
            refetch();
          },
          onError: () => notify("ra.notification.http_error", { type: "error" }),
        },
      );
    } catch {
      notify("crm.photo_galleries.login_error", { type: "error" });
    }
  };

  const usageById = new Map((usageByPhotographer ?? []).map((u) => [u.id, u]));

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8 max-w-2xl">
      <h1 className="text-xl font-semibold">
        {translate("crm.photo_galleries.photographers", { _: "Photographers" })}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {translate("crm.photo_galleries.new_photographer", { _: "New photographer" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate("crm.photo_galleries.photographer_name", { _: "Photographer name" })}
              onKeyDown={(e) => e.key === "Enter" && !withLogin && handleCreate()}
            />
            <Button type="button" onClick={handleCreate} disabled={!name.trim() || isCreating}>
              <Plus className="size-4 mr-1" />
              {translate("ra.action.create")}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={withLogin} onCheckedChange={(v) => setWithLogin(v === true)} />
            {translate("crm.photo_galleries.give_login", {
              _: "Give this photographer their own login",
            })}
          </label>
          {withLogin && (
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={translate("crm.photo_galleries.login_email", { _: "Login email" })}
              />
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={translate("crm.photo_galleries.login_password", { _: "Temporary password" })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="flex flex-col gap-2">
          {(photographers ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {translate("crm.photo_galleries.no_photographers", { _: "No photographers yet" })}
            </p>
          )}
          {(photographers ?? []).map((p) => {
            const usage = usageById.get(p.id);
            return (
              <Link key={p.id} to={`/photographers/${p.id}`}>
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="py-3 flex items-center justify-between">
                    <p className="font-medium">{p.name}</p>
                    {usage && (
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(usage.total_bytes)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          <FolderPagination
            page={page}
            perPage={PHOTOGRAPHERS_PER_PAGE}
            total={photographerTotal ?? 0}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
