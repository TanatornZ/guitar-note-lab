import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstallPrompt } from "./InstallPrompt";

function installEvent(prompt = vi.fn().mockResolvedValue({ outcome: "accepted" })) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.defineProperty(event, "prompt", { value: prompt });
  return { event, prompt };
}

describe("InstallPrompt", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("offers the native browser install flow when the PWA is installable", async () => {
    render(<InstallPrompt />);
    const { event, prompt } = installEvent();

    fireEvent(window, event);
    expect(event.defaultPrevented).toBe(true);
    expect(
      screen.getByRole("complementary", { name: "Install Chord Canvas" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Install app" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByText("Install Chord Canvas")).not.toBeInTheDocument(),
    );
  });

  it("stays hidden for the rest of the session after dismissal", () => {
    const { unmount } = render(<InstallPrompt />);
    fireEvent(window, installEvent().event);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    unmount();

    render(<InstallPrompt />);
    fireEvent(window, installEvent().event);
    expect(screen.queryByText("Install Chord Canvas")).not.toBeInTheDocument();
  });

  it("hides when installation finishes outside the custom button", () => {
    render(<InstallPrompt />);
    fireEvent(window, installEvent().event);
    expect(screen.getByText("Install Chord Canvas")).toBeInTheDocument();

    fireEvent(window, new Event("appinstalled"));
    expect(screen.queryByText("Install Chord Canvas")).not.toBeInTheDocument();
  });
});
