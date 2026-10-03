import { ArrowUp } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '../../components/ui/button';

export function Composer({
  onSend,
  disabled = false,
  autoFocus = false,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');
  const content = value.trim();

  const submit = () => {
    if (!content || disabled) return;
    onSend(content);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mx-auto w-full max-w-2xl rounded-3xl border border-line bg-raised p-2 shadow-[0_12px_40px_-24px_rgb(0_0_0/0.35)] transition focus-within:border-ink-faint"
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={1000}
        autoFocus={autoFocus}
        aria-label="Message the concierge"
        placeholder="Tell the concierge what you'd like to book…"
        className="field-sizing-content max-h-40 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-[15px] outline-none placeholder:text-ink-faint"
      />
      <div className="flex items-center justify-between gap-3 pl-3">
        <span className="hidden text-[11px] text-ink-faint sm:inline">
          Enter to send · Shift + Enter for a new line
        </span>
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={!content || disabled}
          className="ml-auto"
        >
          Send
          <ArrowUp className="size-3.5" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
