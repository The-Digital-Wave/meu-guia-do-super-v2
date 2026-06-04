import { Alert } from "react-native";
import { storage } from "@/services/storage";

export async function markOnboardingComplete(): Promise<boolean> {
  try {
    await storage.setItem("onboarding_complete", "true");
    return true;
  } catch {
    Alert.alert("Erro", "Não foi possível salvar o progresso. Tente novamente.");
    return false;
  }
}
