/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, redirect, Scripts } from "@tanstack/react-router";
import { getCredentialStatus } from "../server/credentials";
import { MotionProvider } from "@anything-questionnaire/ui/motion/index.tsx";
import { ToastProvider } from "@anything-questionnaire/ui/components/Toast/Toast.tsx";
import css from "@anything-questionnaire/ui/styles/global.css?url";

export const Route = createRootRoute({
  // Until there is a Credential, every screen leads to the setup wizard.
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/setup") return;
    if (!(await getCredentialStatus()).configured) throw redirect({ to: "/setup" });
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Anything Questionnaire" },
    ],
    links: [{ rel: "stylesheet", href: css }],
  }),
  component: () => (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <MotionProvider>
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </MotionProvider>
        <Scripts />
      </body>
    </html>
  ),
});
