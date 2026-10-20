// The school's public facts for the footer and structured data — the ONE place to change them.
// Visible wording (TH / EN) lives in messages/<locale>.json under footer.school; this file holds what does not change
// with the language (numbers, links) and the schema.org data. No e-mail: the council's addresses are sign-in accounts.

export const SCHOOL_INFO = {
  phone: { display: "0 5504 9665", tel: "055049665", intl: "+66-55-049-665" },
  fax: { display: "055 504 9605" },
} as const;

/** schema.org EducationalOrganization: name, address and telephone only. */
export function schoolJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "โรงเรียนอุตรดิตถ์",
    alternateName: "Uttaradit School",
    url: siteUrl,
    telephone: SCHOOL_INFO.phone.intl,
    address: {
      "@type": "PostalAddress",
      streetAddress: "15 ถนนอินใจมี ตำบลท่าอิฐ",
      addressLocality: "อำเภอเมืองอุตรดิตถ์",
      addressRegion: "อุตรดิตถ์",
      postalCode: "53000",
      addressCountry: "TH",
    },
  };
}
