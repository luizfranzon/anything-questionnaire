/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { MotionProvider } from "@anything-questionnaire/ui/motion/index.tsx";
import { ToastProvider } from "@anything-questionnaire/ui/components/Toast/Toast.tsx";
import css from "@anything-questionnaire/ui/styles/global.css?url";

export const Route = createRootRoute({
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
