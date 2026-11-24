/**
 * Module architecture and API reference for `src/components/academy/certificate-api.ts`.
 *
 * Exported symbols:
 * - `lookupCertificateById` (Function): lookup certificate by id definition.
 * - `formatShortIsoDate` (Function): format short iso date definition.
 * - `CERT_PREVIEW_COPY` (Const): cert preview copy definition.
 * - `VERIFY_CERT_COPY` (Const): verify cert copy definition.
 *
 * Internal dependencies:
 * - `@/lib/services/academy-service`
 * - `@/lib/db/types`
 *
 * @module components/academy/certificate-api
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Shared certificate lookup API and bilingual strings for preview and public verification pages.
 */

import { academyService } from '@/lib/services/academy-service';
import type { Certificate, SupportedLanguage } from '@/lib/db/types';

/** Fetches a certificate by ID or QR hash from `/api/academy`, falling back to `academyService`. */
export async function lookupCertificateById(
  certId: string
): Promise<{ certificate: Certificate | null; notFound: boolean }> {
  const trimmed = certId.trim();
  if (!trimmed) return { certificate: null, notFound: true };

  try {
    const apiRes = await fetch(
      `/api/academy?type=certificate&certificateId=${encodeURIComponent(trimmed)}`,
      { cache: 'no-store' }
    );
    if (apiRes.ok) {
      const apiJson = await apiRes.json();
      if (apiJson.ok && apiJson.data) {
        return { certificate: apiJson.data, notFound: false };
      }
    } else if (apiRes.status === 404) {
      return { certificate: null, notFound: true };
    }
  } catch {
    // Fall back to local academy service below
  }

  const res = await academyService.verifyCertificate(trimmed);
  if (res.ok && res.data) return { certificate: res.data, notFound: false };
  return { certificate: null, notFound: true };
}

/** Slices an ISO date string to YYYY-MM-DD, returning a dash when missing. */
export function formatShortIsoDate(value?: string | null): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

/**
 * Constant definition for cert preview copy.
 */
export const CERT_PREVIEW_COPY: Record<
  SupportedLanguage,
  {
    loading: string;
    notFoundTitle: string;
    notFoundPrefix: string;
    notFoundSuffix: string;
    returnRoadmap: string;
    publicVerifyBtn: string;
    downloadPdfBtn: string;
    revokedTitle: string;
    reasonLabel: string;
    defaultRevokeReason: string;
    platformHeader: string;
    academySub: string;
    certTitle: string;
    certifiesThat: string;
    dobLabel: string;
    nationalityLabel: string;
    certIdLabel: string;
    qrHashLabel: string;
    issueDateLabel: string;
    revokedBadge: string;
    validBadge: string;
    qrAlt: string;
    scanLabel: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    loading: 'Loading Official Certificate Preview…',
    notFoundTitle: 'Certificate Not Found',
    notFoundPrefix: 'No graduation certificate was found matching ID ',
    notFoundSuffix: '.',
    returnRoadmap: 'Return to Academy Roadmap',
    publicVerifyBtn: 'Public Verification Page',
    downloadPdfBtn: 'Download Official PDF (A4 Landscape)',
    revokedTitle: 'Certificate Revoked by Administrator',
    reasonLabel: 'Reason',
    defaultRevokeReason: 'Administrative revocation',
    platformHeader: "AL HIWAR DIGITAL DA'WAH & LEARNING PLATFORM",
    academySub: 'Al Hiwar Islamic Academy • Global Outreach & Learning',
    certTitle: 'OFFICIAL CERTIFICATE OF ISLAMIC FUNDAMENTALS & CONVERSION',
    certifiesThat:
      'This official academic and spiritual credential certifies that',
    dobLabel: 'Date of Birth:',
    nationalityLabel: 'Nationality:',
    certIdLabel: 'Certificate ID:',
    qrHashLabel: 'QR Hash:',
    issueDateLabel: 'Issue Date:',
    revokedBadge: 'REVOKED',
    validBadge: 'VALID & VERIFIED',
    qrAlt: 'Certificate verification QR code',
    scanLabel: 'SCAN TO VERIFY AUTHENTICITY',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    loading: 'Chargement de l’aperçu du certificat officiel…',
    notFoundTitle: 'Certificat introuvable',
    notFoundPrefix:
      'Aucun certificat de fin d’études ne correspond à l’identifiant ',
    notFoundSuffix: '.',
    returnRoadmap: 'Retour au programme de l’Académie',
    publicVerifyBtn: 'Page publique de vérification',
    downloadPdfBtn: 'Télécharger le PDF Officiel (A4 Paysage)',
    revokedTitle: 'Certificat révoqué par l’administration',
    reasonLabel: 'Motif',
    defaultRevokeReason: 'Révocation administrative',
    platformHeader:
      'PLATEFORME NUMÉRIQUE DE DA’WAH & D’ENSEIGNEMENT AL HIWAR',
    academySub:
      'Académie Islamique Al Hiwar • Enseignement & Accompagnement Mondial',
    certTitle: 'CERTIFICAT OFFICIEL D’ÉTUDES ISLAMIQUES & DE CONVERSION',
    certifiesThat:
      'Ce diplôme académique et spirituel officiel atteste que',
    dobLabel: 'Date de naissance :',
    nationalityLabel: 'Nationalité :',
    certIdLabel: 'ID du Certificat :',
    qrHashLabel: 'Empreinte QR :',
    issueDateLabel: 'Date d’émission :',
    revokedBadge: 'RÉVOQUÉ',
    validBadge: 'VALIDE & VÉRIFIÉ',
    qrAlt: 'Code QR de vérification du certificat',
    scanLabel: 'SCANNER POUR VÉRIFIER L’AUTHENTICITÉ',
  },
};

/**
 * Constant definition for verify cert copy.
 */
export const VERIFY_CERT_COPY: Record<
  SupportedLanguage,
  {
    verifying: string;
    unverifiedBadge: string;
    notFoundTitle: string;
    notFoundPrefix: string;
    notFoundSuffix: string;
    searchPlaceholder: string;
    verifyBtn: string;
    returnHomeBtn: string;
    registryTag: string;
    registryHeading: string;
    registrySub: string;
    statusRevoked: string;
    statusValid: string;
    revocationHeading: string;
    revocationPrefix: string;
    defaultRevokeReason: string;
    fullNameLabel: string;
    nationalityLabel: string;
    dobLabel: string;
    issueDateLabel: string;
    attestationTitle: string;
    attestationBody: string;
    qrHashLabel: string;
    viewFullBtn: string;
    downloadPdfBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    verifying: 'Verifying Credential with Al Hiwar Platform Registry…',
    unverifiedBadge: 'UNVERIFIED CREDENTIAL',
    notFoundTitle: 'Certificate Record Not Found',
    notFoundPrefix: 'The verification identifier ',
    notFoundSuffix:
      " does not match any official certificate issued by the Al Hiwar Digital Da'wah Platform.",
    searchPlaceholder: 'Enter certificate ID or QR hash',
    verifyBtn: 'Verify',
    returnHomeBtn: 'Return to Al Hiwar Homepage',
    registryTag: 'Official Credential Registry',
    registryHeading: 'Public Credential Verification Registry',
    registrySub: 'Al Hiwar Digital Da’wah & Foundational Academy',
    statusRevoked: 'STATUS: REVOKED',
    statusValid: 'STATUS: VALID',
    revocationHeading: 'Official Revocation Notice',
    revocationPrefix:
      'This credential was revoked by platform administration. Reason: ',
    defaultRevokeReason: 'Administrative governance action',
    fullNameLabel: 'Graduate Full Name',
    nationalityLabel: 'Nationality',
    dobLabel: 'Date of Birth',
    issueDateLabel: 'Issue Date',
    attestationTitle: 'Academic & Conversion Attestation',
    attestationBody:
      'Confirms that the holder has pronounced the Shahadah before an accredited Dialogist and passed all 7 Foundational Learning Modules and the 100-Question Final Examination at ≥ 80%.',
    qrHashLabel: 'QR Hash:',
    viewFullBtn: 'View Full Certificate',
    downloadPdfBtn: 'Download Official PDF',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    verifying:
      'Vérification du diplôme auprès du registre officiel Al Hiwar…',
    unverifiedBadge: 'DOCUMENT NON VÉRIFIÉ',
    notFoundTitle: 'Enregistrement du certificat introuvable',
    notFoundPrefix: 'L’identifiant de vérification ',
    notFoundSuffix:
      ' ne correspond à aucun certificat officiel actif émis par la plateforme Al Hiwar.',
    searchPlaceholder: 'Entrer un identifiant (ex: cert-graduate-1)',
    verifyBtn: 'Vérifier',
    returnHomeBtn: 'Retour à l’accueil Al Hiwar',
    registryTag: 'Registre Officiel des Diplômes',
    registryHeading: 'Registre Public de Vérification des Certificats',
    registrySub: 'Plateforme Al Hiwar & Académie Islamique Fondamentale',
    statusRevoked: 'STATUT : RÉVOQUÉ',
    statusValid: 'STATUT : VALIDE',
    revocationHeading: 'Avis Officiel de Révocation',
    revocationPrefix:
      'Ce certificat a été révoqué par l’administration de la plateforme. Motif : ',
    defaultRevokeReason: 'Décision administrative',
    fullNameLabel: 'Nom complet du diplômé',
    nationalityLabel: 'Nationalité',
    dobLabel: 'Date de naissance',
    issueDateLabel: 'Date d’émission',
    attestationTitle: 'Attestation Académique et de Conversion',
    attestationBody:
      'Confirme que le titulaire a prononcé la Chahada devant un spécialiste accrédité et a réussi l’ensemble des 7 modules d’apprentissage ainsi que l’Examen Final de 100 questions à ≥ 80 %.',
    qrHashLabel: 'Empreinte QR :',
    viewFullBtn: 'Voir le certificat complet',
    downloadPdfBtn: 'Télécharger le PDF Officiel',
  },
};
