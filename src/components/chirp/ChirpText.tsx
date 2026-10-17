/**
 * ChirpText is a plain paragraph for now. Phase 4 adds link, mention and
 * hashtag tokenization; it will still render React nodes only.
 */
export function ChirpText({ body }: { body: string }) {
  return (
    <p
      dir="auto"
      className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed"
    >
      {body}
    </p>
  );
}
