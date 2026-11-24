/**
 * Composite staff workflow hook merging Dialogist consultation actions with
 * Instructor, Supervisor, and Administrator governance mutations.
 */

import {
  useStaffDialogueActions,
  type UseStaffDialogueActionsOptions,
} from './use-staff-dialogue-actions';
import { useStaffGovernanceActions } from './use-staff-governance-actions';

/**
 * Composes dialogue and governance workflow sub-hooks into the unified action bag
 * expected by `useStaffPortal`.
 * @param options - Shared portal state setters and snapshot refresh callback.
 * @returns Combined workflow form state and mutation handlers.
 */
export function useStaffWorkflowActions(options: UseStaffDialogueActionsOptions) {
  const dialogue = useStaffDialogueActions(options);
  const governance = useStaffGovernanceActions({
    isFr: options.isFr,
    currentUser: options.currentUser,
    setStatusBanner: options.setStatusBanner,
    refreshData: options.refreshData,
  });

  return {
    ...dialogue,
    ...governance,
  };
}
