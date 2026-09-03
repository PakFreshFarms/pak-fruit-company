import en from "@/lib/i18n/dictionaries/en.json";
import ur from "@/lib/i18n/dictionaries/ur.json";

type VocabKey = keyof typeof en.vocab;

/**
 * Always shows the client's own vocabulary term bilingually — English and
 * Urdu together — regardless of the active UI language, per spec section 8
 * ("English primary, with the Urdu term shown as secondary text"). This is
 * distinct from the full language toggle in the topbar, which switches every
 * other label in the interface.
 */
export function Vocab({ term, className }: { term: VocabKey; className?: string }) {
  return (
    <span className={className}>
      {en.vocab[term]} <span className="font-urdu text-muted-foreground" dir="rtl">({ur.vocab[term]})</span>
    </span>
  );
}
