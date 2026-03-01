import path from "node:path";
import fs from "node:fs";

// ─── JSON imports — TypeScript reads the exact keys from these files ──────────
import enCommon     from "./locales/en/common.json";
import enValidation from "./locales/en/validation.json";
import enResources  from "./locales/en/resources.json";

// ─── Types derived automatically from the JSON ────────────────────────────────

export type Locale           = "en" | "ar";
export type Namespace        = "common" | "validation" | "resources";
export type TranslationParams = Record<string, string | number>;

/**
 * Resource key constants — use instead of typing raw strings.
 *
 * Usage:
 *   import { R } from "@shared/i18n";
 *   super(repo, R.USER);
 *   throw new NotFoundError(R.USER);
 *   throw new ConflictError(R.USER, "email", data.email);
 *
 * Adding a new resource: add it to resources.json → R updates automatically.
 */
export const R = Object.fromEntries(
  Object.keys(enResources).map((key) => [
    key.toUpperCase(),
    `resources.${key}` as `resources.${string}`,
  ]),
) as { [K in Uppercase<keyof typeof enResources>]: `resources.${Lowercase<K>}` };

/**
 * Every valid key, derived from the English JSON files.
 * Add a key to the JSON → it appears here automatically. No extra steps.
 *
 * Examples: "common.created", "validation.required", "resources.user"
 */
export type TranslationKey =
  | `common.${keyof typeof enCommon}`
  | `validation.${keyof typeof enValidation}`
  | `resources.${keyof typeof enResources}`;

// ─── Catalogue ────────────────────────────────────────────────────────────────

type Catalogue = Record<Locale, Record<Namespace, Record<string, string>>>;

const LOCALES_DIR = path.join(__dirname, "locales");
export const SUPPORTED_LOCALES: Locale[] = ["en", "ar"];
const NAMESPACES: Namespace[] = ["common", "validation", "resources"];

const catalogue: Catalogue = loadCatalogue();

function loadCatalogue(): Catalogue {
  const result = {} as Catalogue;
  for (const locale of SUPPORTED_LOCALES) {
    result[locale] = {} as Record<Namespace, Record<string, string>>;
    for (const ns of NAMESPACES) {
      const filePath = path.join(LOCALES_DIR, locale, `${ns}.json`);
      try {
        result[locale][ns] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        console.warn(`[i18n] Missing or invalid translation file: ${filePath}`);
        result[locale][ns] = {};
      }
    }
  }
  return result;
}

// ─── Core translate function ──────────────────────────────────────────────────

/**
 * Translate a key into the requested locale with optional interpolation.
 *
 * Key:          "namespace.key"      e.g. "common.created", "resources.user"
 * Placeholders: {{name}}             e.g. { resource: "User", field: "email" }
 *
 * Falls back to "en" if the key is missing in the requested locale.
 *
 * Usage:
 *   t("common.created", "ar", { resource: t("resources.user", "ar") })
 *   // → "تم إنشاء المستخدم بنجاح"
 */
export function t(
  key: TranslationKey,
  locale: Locale,
  params?: TranslationParams,
): string {
  const [ns, ...rest] = key.split(".") as [Namespace, ...string[]];
  const leafKey = rest.join(".");

  const raw =
    catalogue[locale]?.[ns]?.[leafKey] ??
    catalogue["en"]?.[ns]?.[leafKey] ??
    key;

  return interpolate(raw, params);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    name in params ? String(params[name]) : `{{${name}}}`,
  );
}

// ─── Locale detection ─────────────────────────────────────────────────────────

/**
 * Resolves a locale from an Accept-Language header value.
 * Falls back to "en".
 *
 * Usage:
 *   resolveLocale(req.headers["accept-language"])  // → "ar"
 */
export function resolveLocale(header?: string): Locale {
  if (!header) return "en";

  const candidates = header
    .split(",")
    .map((part) => part.split(";")[0].trim().split("-")[0].toLowerCase());

  for (const candidate of candidates) {
    if (SUPPORTED_LOCALES.includes(candidate as Locale)) {
      return candidate as Locale;
    }
  }

  return "en";
}
