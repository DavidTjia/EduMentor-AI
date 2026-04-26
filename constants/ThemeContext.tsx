import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DarkColors, LightColors } from "./theme";

const STORAGE_KEY = "edumentor_dark_mode";

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    colors: typeof LightColors;
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    toggleTheme: () => { },
    colors: LightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
            if (val === "true") setIsDark(true);
            setLoaded(true);
        });
    }, []);

    const toggleTheme = () => {
        setIsDark((prev) => {
            const next = !prev;
            AsyncStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    };

    const colors = isDark ? DarkColors : LightColors;

    // Don't render until preference is loaded to avoid flash
    if (!loaded) return null;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

/** Get the current color palette (LightColors or DarkColors) */
export function useColors() {
    return useContext(ThemeContext).colors;
}

/** Get isDark boolean + toggleTheme function */
export function useTheme() {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    return { isDark, toggleTheme };
}
