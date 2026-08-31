import { lazy, type ComponentType } from "react";

type CrudViews = {
  list?: ComponentType<any>;
  create?: ComponentType<any>;
  edit?: ComponentType<any>;
  show?: ComponentType<any>;
};

/** Wraps a resource module's list/create/edit/show components in
 * React.lazy so Vite splits them into their own chunk, downloaded only
 * when that resource's route is actually visited instead of on every
 * page load. The existing Suspense boundary in Layout.tsx already
 * covers the loading fallback for every route -- no extra plumbing
 * needed here.
 *
 * `keys` must list only the views the target module actually exports --
 * lazy-wrapping a key it doesn't define (e.g. `edit` on a list-only
 * resource) would make react-admin think that view exists and route to
 * a component that resolves to undefined.
 *
 * Calling `importFn` multiple times (once per key) does not trigger
 * multiple network fetches: dynamic imports of the same module specifier
 * share one cached chunk request.
 */
export function lazyResource<T extends CrudViews>(
  importFn: () => Promise<{ default: T }>,
  keys: (keyof CrudViews)[],
): T {
  const result = {} as Record<string, ComponentType<any>>;
  for (const key of keys) {
    result[key] = lazy(() =>
      importFn().then((m) => ({
        default: m.default[key] as ComponentType<any>,
      })),
    );
  }
  return result as T;
}
