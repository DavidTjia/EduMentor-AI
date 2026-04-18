import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const AUTH_KEY = "edumentor_user_id";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((id) => {
      setUserId(id);
      setIsLoaded(true);
    });
  }, []);

  const login = async (id: string) => {
    await AsyncStorage.setItem(AUTH_KEY, id);
    setUserId(id);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUserId(null);
  };

  return { userId, isLoaded, login, logout };
}
