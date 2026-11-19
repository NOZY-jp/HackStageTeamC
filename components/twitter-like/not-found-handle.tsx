"use client";

import { useParams } from "next/navigation";

/**
 * not-found では params を受け取れないので、URL から handle を拾って表示する小さな部品。
 */
export function NotFoundHandle() {
  const params = useParams<{ handle?: string | string[] }>();
  const handle = Array.isArray(params.handle) ? params.handle[0] : params.handle;
  if (!handle) {
    return null;
  }
  return <p className="tw-handle">@{handle}</p>;
}
