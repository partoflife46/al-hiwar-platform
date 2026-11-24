/**
 * Module architecture and API reference for `src/hooks/use-profile-page.ts`.
 *
 * Exported symbols:
 * - `ProfileData` (Interface): profile data definition.
 * - `useProfilePage` (Function): use profile page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/services/auth-service`
 * - `@/lib/security/password-policy`
 * - `@/lib/context/language-context`
 *
 * @module hooks/use-profile-page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Client state and side-effect hook module for use profile page.
 * Coordinates API requests, live state synchronization, and UI callback handlers.
 * @module hooks/use-profile-page
 * @exports ProfileData, useProfilePage
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SupportedLanguage, Gender, UserRole } from "@/lib/db/types";
import { calculateAge } from "@/lib/services/auth-service";
import { evaluatePassword } from "@/lib/security/password-policy";
import { useLanguage } from "@/lib/context/language-context";

/**
 * Type contract defining profile data.
 */
export interface ProfileData {
  /** id property. */
  id: string;
  /** Optional user id property. */
  userId?: string;
  /** email property. */
  email: string;
  /** first name property. */
  firstName: string;
  /** surname property. */
  surname: string;
  /** role property. */
  role: UserRole;
  /** status property. */
  status: string;
  /** preferred language property. */
  preferredLanguage: SupportedLanguage;
  /** date of birth property. */
  dateOfBirth: string;
  /** nationality property. */
  nationality: string | null;
  /** gender property. */
  gender: Gender | null;
  /** phone number property. */
  phoneNumber: string | null;
  /** Optional conversion date property. */
  conversionDate?: string | null;
  /** Optional has validated shahadah property. */
  hasValidatedShahadah?: boolean;
  /** Optional title property. */
  title?: string | null;
}

/**
 * Manages authenticated user profile editing, language sync, and account summary state.
 */
export function useProfilePage() {
  const router = useRouter();
  const { language, setLanguage, isFr } = useLanguage();

  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [firstName, setFirstName] = React.useState('');
  const [surname, setSurname] = React.useState('');
  const [profilePreferredLanguage, setProfilePreferredLanguage] =
    React.useState<SupportedLanguage>('en');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [nationality, setNationality] = React.useState('');
  const [gender, setGender] = React.useState<Gender>('MALE');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  /**
   * Memoized handler/selector for load profile.
   */
  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/profile', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          const d: ProfileData = json.data;
          setProfile(d);
          setFirstName(d.firstName || '');
          setSurname(d.surname || '');
          setProfilePreferredLanguage(d.preferredLanguage || 'en');
          setDateOfBirth(d.dateOfBirth || '');
          setNationality(d.nationality || '');
          setGender(d.gender || 'MALE');
          setPhoneNumber(d.phoneNumber || '');
          return;
        }
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const liveAge = React.useMemo(() => {
    if (!dateOfBirth) return -1;
    return calculateAge(dateOfBirth);
  }, [dateOfBirth]);

  const isUnderage = liveAge >= 0 && liveAge < 18;

  /**
   * Asynchronously executes handle submit logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!firstName.trim() || !surname.trim()) {
      setErrorMsg(isFr ? 'Le prénom et le nom sont requis.' : 'First name and surname are required.');
      return;
    }

    if (isUnderage) {
      setErrorMsg(
        isFr
          ? 'Vous devez avoir 18 ans ou plus.'
          : 'You must be 18 years or older.'
      );
      return;
    }

    if (newPassword) {
      const evalPw = evaluatePassword(newPassword);
      if (!evalPw.isValid) {
        setErrorMsg(
          isFr
            ? evalPw.errorMessageFr || 'Le mot de passe doit comporter au moins 8 caractères et combiner lettres et chiffres.'
            : evalPw.errorMessageEn || 'Password must be at least 8 characters long and contain letters and numbers.'
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg(
          isFr
            ? 'Les mots de passe ne correspondent pas.'
            : 'Passwords do not match.'
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          surname: surname.trim(),
          preferredLanguage: profilePreferredLanguage,
          dateOfBirth,
          nationality: nationality.trim() || null,
          gender,
          phoneNumber: phoneNumber.trim() || null,
          ...(newPassword ? { password: newPassword.trim() } : {}),
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setProfile(json.data);
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg(
          json.data?.rolePromoted
            ? isFr
              ? 'Mabrouk ! Votre profil est complet et votre accès à l’Académie Islamique Al Hiwar est débloqué.'
              : 'Mabrooq! Your profile is complete and access to Al Hiwar Islamic Academy is now unlocked.'
            : isFr
            ? 'Votre profil a été mis à jour avec succès.'
            : 'Your profile has been updated successfully.'
        );
        window.dispatchEvent(
          new CustomEvent('alhiwar:role-changed', {
            detail: {
              ...json.data,
              userId: json.data.userId || json.data.id,
            },
          })
        );
      } else {
        setErrorMsg(
          json.message ||
            json.error ||
            (isFr ? 'Échec de mise à jour du profil.' : 'Failed to update profile.')
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || (isFr ? 'Erreur réseau lors de la mise à jour.' : 'Network error updating profile.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    language,
    setLanguage,
    isFr,
    profile,
    setProfile,
    firstName,
    setFirstName,
    surname,
    setSurname,
    profilePreferredLanguage,
    setProfilePreferredLanguage,
    dateOfBirth,
    setDateOfBirth,
    nationality,
    setNationality,
    gender,
    setGender,
    phoneNumber,
    setPhoneNumber,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    router,
    loadProfile,
    liveAge,
    isUnderage,
    handleSubmit,
  };
}
