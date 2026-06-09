import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider, useAppLocale, useSetAppLocale } from "./locale-context";
import { LOCALE_COOKIE_NAME } from "./runtime";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useLocation: (opts?: { select?: (loc: { pathname: string }) => string }) => {
    const location = { pathname: "/app/dashboard" };
    return opts?.select ? opts.select(location) : location;
  },
  useNavigate: () => navigate,
}));

function LocaleConsumer() {
  const locale = useAppLocale();
  const setLocale = useSetAppLocale();

  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button type="button" onClick={() => setLocale("ru")}>
        Switch to Russian
      </button>
    </div>
  );
}

describe("LocaleProvider", () => {
  it("updates locale on app routes without navigation", async () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=en; path=/`;
    const user = userEvent.setup();

    render(
      <LocaleProvider>
        <LocaleConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");

    await user.click(screen.getByRole("button", { name: "Switch to Russian" }));

    expect(screen.getByTestId("locale")).toHaveTextContent("ru");
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=ru`);
    expect(navigate).not.toHaveBeenCalled();
  });
});
