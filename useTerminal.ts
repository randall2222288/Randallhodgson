import { useEffect, useState } from 'react';
import { TerminalState, terminalStore } from '../store/terminalStore';

export function useTerminal(): TerminalState {
  const [state, setState] = useState<TerminalState>(terminalStore.getState());

  useEffect(() => {
    const unsubscribe = terminalStore.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return state;
}
