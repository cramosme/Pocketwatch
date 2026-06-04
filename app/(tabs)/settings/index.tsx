// Bare-bones settings stub — just the "Connect Bank" flow for now.
// Fetches a link token on mount, preloads Plaid Link via create(), then
// opens the native modal on tap. On success, sends the public token +
// institution to the exchange endpoint, which triggers initial sync.

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { create, open } from "react-native-plaid-link-sdk";
import type { LinkSuccess, LinkExit } from "react-native-plaid-link-sdk";
import { api } from "@/lib/api";

type Status = "loading" | "ready" | "linking" | "exchanging" | "success" | "error";

export default function SettingsScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  // Fetch a link token and preload Plaid Link on mount. create() starts the
  // native SDK preload so the modal opens instantly when the user taps.
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        const { linkToken } = await api("/plaid/link-token", { method: "POST" });
        if (cancelled) return;
        create({ token: linkToken });
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message ?? "Could not fetch link token");
        setStatus("error");
      }
    }

    prepare();
    return () => { cancelled = true; };
  }, []);

  function handleConnectBank() {
    setStatus("linking");
    setError(null);

    open({
      onSuccess: async (success: LinkSuccess) => {
        try {
          setStatus("exchanging");
          // Exchange endpoint expects { publicToken, institution: { id, name } }
          await api("/plaid/exchange-public-token", {
            method: "POST",
            body: JSON.stringify({
              publicToken: success.publicToken,
              institution: {
                id: success.metadata.institution?.id,
                name: success.metadata.institution?.name,
              },
            }),
          });
          setStatus("success");
        } catch (err: any) {
          setError(err.message ?? "Exchange failed");
          setStatus("error");
        }
      },
      onExit: (exit: LinkExit) => {
        // User closed Link without connecting, or Link errored during init
        if (exit.error) {
          setError(exit.error.displayMessage ?? exit.error.errorMessage);
          setStatus("error");
        } else {
          setStatus("ready"); // just dismissed, no error
        }
      },
    });
  }

  return (
    <View className="flex-1 bg-[#0E1D2D] justify-center items-center p-6">
      <Text className="text-white text-xl font-semibold mb-8">Settings</Text>

      <TouchableOpacity
        className={`px-6 py-3 rounded-lg ${
          status === "ready" ? "bg-[#D4AF37]" : "bg-gray-600"
        }`}
        onPress={handleConnectBank}
        disabled={status !== "ready"}
      >
        {status === "loading" || status === "exchanging" ? (
          <ActivityIndicator color="#0E1D2D" />
        ) : (
          <Text className="text-[#0E1D2D] font-semibold text-base">
            {status === "success" ? "Connected!" : "Connect Bank"}
          </Text>
        )}
      </TouchableOpacity>

      {status === "error" && (
        <Text className="text-red-400 mt-4 text-center">{error}</Text>
      )}
      {status === "success" && (
        <Text className="text-[#22C55E] mt-4">
          Bank connected — initial sync running on the backend.
        </Text>
      )}
      {status === "exchanging" && (
        <Text className="text-gray-400 mt-4">Connecting and syncing...</Text>
      )}
    </View>
  );
}