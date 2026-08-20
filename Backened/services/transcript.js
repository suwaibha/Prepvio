import { fetchTranscript } from "youtube-transcript";

export async function getTranscript(input) {
    try {
        if (typeof input === "string") {
            const trimmed = input.trim();
            if (!trimmed) {
                throw new Error("Transcript not available");
            }

            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                const transcript = await fetchTranscript(trimmed);
                if (!transcript?.length) {
                    throw new Error("Transcript not available");
                }

                return transcript.map((item) => ({
                    ...item,
                    text: item.text?.trim() || "",
                }));
            }

            return trimmed
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, index) => ({
                    text: line,
                    duration: 1000,
                    offset: index * 1000,
                    lang: "unknown",
                }));
        }

        if (Array.isArray(input)) {
            return input.map((item) => ({ ...item, text: item.text?.trim() || "" }));
        }

        if (input?.text) {
            return [{ ...input, text: input.text?.trim() || "" }];
        }

        throw new Error("Transcript not available");
    } catch (error) {
        throw new Error(error.message);
    }
}