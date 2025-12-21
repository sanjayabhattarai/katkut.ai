// hooks/useHistory.ts
import { useState, useCallback } from 'react';

// Generic hook that can work with any data type (T)
export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // Function to update state and save history
  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const computedNewState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(currentState) 
        : newState;

      // Save current state to "Past" before updating
      setPast((prev) => {
        const newPast = [...prev, currentState];
        // Limit history to 20 steps to save memory
        return newPast.length > 20 ? newPast.slice(1) : newPast;
      });
      
      // Clear "Future" because we made a new change
      setFuture([]);
      
      return computedNewState;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev; // Nothing to undo

      const newPast = [...prev];
      const previousState = newPast.pop(); // Get last state

      setFuture((prevFuture) => [state, ...prevFuture]); // Move current to future
      setState(previousState as T); // Restore old state
      
      return newPast;
    });
  }, [state]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev; // Nothing to redo

      const newFuture = [...prev];
      const nextState = newFuture.shift(); // Get next state

      setPast((prevPast) => [...prevPast, state]); // Move current to past
      setState(nextState as T); // Restore future state
      
      return newFuture;
    });
  }, [state]);

  return { 
    state, 
    set, 
    undo, 
    redo, 
    canUndo: past.length > 0, 
    canRedo: future.length > 0 
  };
}