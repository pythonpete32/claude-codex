import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing localStorage with React state synchronization
 * Handles SSR, parsing errors, and cross-tab synchronization
 */
export function useLocalStorage<T>(
	key: string,
	defaultValue: T,
	options?: {
		serialize?: (value: T) => string;
		deserialize?: (value: string) => T;
	},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
	// Use custom serializers or default to JSON
	const serialize = options?.serialize || JSON.stringify;
	const deserialize = options?.deserialize || JSON.parse;

	// Initialize state with a function to avoid SSR issues
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			return defaultValue;
		}

		try {
			const item = window.localStorage.getItem(key);
			return item ? deserialize(item) : defaultValue;
		} catch (error) {
			console.error(`Error reading localStorage key "${key}":`, error);
			return defaultValue;
		}
	});

	// Set value in both state and localStorage
	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				// Allow value to be a function (like useState)
				const valueToStore = value instanceof Function ? value(storedValue) : value;

				setStoredValue(valueToStore);

				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, serialize(valueToStore));

					// Dispatch storage event for cross-tab synchronization
					window.dispatchEvent(
						new StorageEvent("storage", {
							key,
							newValue: serialize(valueToStore),
							url: window.location.href,
						}),
					);
				}
			} catch (error) {
				console.error(`Error setting localStorage key "${key}":`, error);
			}
		},
		[key, serialize, storedValue],
	);

	// Remove value from localStorage
	const removeValue = useCallback(() => {
		try {
			setStoredValue(defaultValue);

			if (typeof window !== "undefined") {
				window.localStorage.removeItem(key);

				// Dispatch storage event for cross-tab synchronization
				window.dispatchEvent(
					new StorageEvent("storage", {
						key,
						newValue: null,
						url: window.location.href,
					}),
				);
			}
		} catch (error) {
			console.error(`Error removing localStorage key "${key}":`, error);
		}
	}, [key, defaultValue]);

	// Listen for changes in other tabs/windows
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === key && e.newValue !== null) {
				try {
					setStoredValue(deserialize(e.newValue));
				} catch (error) {
					console.error(`Error parsing localStorage value for key "${key}":`, error);
				}
			} else if (e.key === key && e.newValue === null) {
				setStoredValue(defaultValue);
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [key, defaultValue, deserialize]);

	return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing sessionStorage with React state synchronization
 * Similar to useLocalStorage but uses sessionStorage instead
 */
export function useSessionStorage<T>(
	key: string,
	defaultValue: T,
	options?: {
		serialize?: (value: T) => string;
		deserialize?: (value: string) => T;
	},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
	const serialize = options?.serialize || JSON.stringify;
	const deserialize = options?.deserialize || JSON.parse;

	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			return defaultValue;
		}

		try {
			const item = window.sessionStorage.getItem(key);
			return item ? deserialize(item) : defaultValue;
		} catch (error) {
			console.error(`Error reading sessionStorage key "${key}":`, error);
			return defaultValue;
		}
	});

	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				const valueToStore = value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);

				if (typeof window !== "undefined") {
					window.sessionStorage.setItem(key, serialize(valueToStore));
				}
			} catch (error) {
				console.error(`Error setting sessionStorage key "${key}":`, error);
			}
		},
		[key, serialize, storedValue],
	);

	const removeValue = useCallback(() => {
		try {
			setStoredValue(defaultValue);

			if (typeof window !== "undefined") {
				window.sessionStorage.removeItem(key);
			}
		} catch (error) {
			console.error(`Error removing sessionStorage key "${key}":`, error);
		}
	}, [key, defaultValue]);

	return [storedValue, setValue, removeValue];
}
