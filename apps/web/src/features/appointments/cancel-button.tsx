import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';

const DISARM_AFTER_MS = 3000;

export function CancelButton({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), DISARM_AFTER_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      variant={armed ? 'accent' : 'outline'}
      size="sm"
      disabled={disabled}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? 'Tap to confirm' : 'Cancel'}
    </Button>
  );
}
