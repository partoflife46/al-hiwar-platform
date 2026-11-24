'use client';

/**
 * UI presentation module for admin tab within the staff workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/staff/admin-tab
 * @exports AdminTab
 */

import * as React from "react";
import type { StaffPortalContext } from "@/hooks/use-staff-portal";
import { AdminStaffAndUpload } from "./admin-staff-and-upload";
import { AdminUserDirectory } from "./admin-user-directory";
import { AdminResourceCatalog } from "./admin-resource-catalog";

/**
 * Administrator governance console composed of staff/resource creation, user/certificate directory, and resource catalog.
 */
export function AdminTab({ ctx }: { ctx: StaffPortalContext }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <AdminStaffAndUpload ctx={ctx} />
      <AdminUserDirectory ctx={ctx} />
      <AdminResourceCatalog ctx={ctx} />
    </div>
  );
}
