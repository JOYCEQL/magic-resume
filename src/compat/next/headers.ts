type CookieValue = {
  value: string;
};

export async function cookies() {
  return {
    get: (name: string): CookieValue | undefined => {
      if (typeof document === "undefined") {
        return undefined;
      }

      const cookieItem = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${name}=`));

      if (!cookieItem) {
        return undefined;
      }

      return {
        value: decodeURIComponent(cookieItem.slice(name.length + 1))
      };
    },
    set: (name: string, value: string) => {
      if (typeof document === "undefined") {
        return;
      }

      document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  };
}
