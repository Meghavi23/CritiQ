// vite.config.js
import { defineConfig } from "file:///F:/Git/Master-Dev-real/client/node_modules/vite/dist/node/index.js";
import react from "file:///F:/Git/Master-Dev-real/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "F:\\Git\\Master-Dev-real\\client";
function requireBackendPlugin() {
  const backendOrigin = process.env.BACKEND_ORIGIN || "http://localhost:5000";
  const healthPath = process.env.BACKEND_HEALTH_PATH || "/api/pingServer";
  const enabled = (process.env.REQUIRE_BACKEND ?? "true").toLowerCase() !== "false";
  function isHtmlRequest(req) {
    const url = req.url || "";
    if (url === "/" || url.startsWith("/?"))
      return true;
    const accept = req.headers?.accept || "";
    return typeof accept === "string" && accept.includes("text/html");
  }
  async function backendIsUp() {
    const healthUrl = new URL(healthPath, backendOrigin).toString();
    if (typeof fetch === "function") {
      const res = await fetch(healthUrl, { method: "GET" });
      return res.ok;
    }
    const { request } = await (healthUrl.startsWith("https:") ? import("https") : import("http"));
    return await new Promise((resolve) => {
      const req = request(healthUrl, { method: "GET" }, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
      req.on("error", () => resolve(false));
      req.end();
    });
  }
  return {
    name: "require-backend-for-frontend",
    apply: "serve",
    configureServer(server) {
      if (!enabled)
        return;
      server.middlewares.use(async (req, res, next) => {
        try {
          if (!isHtmlRequest(req))
            return next();
          const healthUrl = new URL(healthPath, backendOrigin).toString();
          const up = await backendIsUp();
          if (up)
            return next();
          res.statusCode = 503;
          res.setHeader("content-type", "text/html; charset=utf-8");
          res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Backend is not running</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 32px; }
      .card { max-width: 760px; margin: 0 auto; padding: 20px 22px; border: 1px solid rgba(127,127,127,.35); border-radius: 12px; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      h1 { margin: 0 0 10px; font-size: 20px; }
      p { margin: 8px 0; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Backend is not running</h1>
      <p>The frontend dev server is configured to require a running backend.</p>
      <p>Start the backend, then refresh this page.</p>
      <p><b>Health check</b>: <code>${healthUrl}</code></p>
    </div>
  </body>
</html>`);
        } catch (e) {
          return next(e);
        }
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), requireBackendPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxHaXRcXFxcTWFzdGVyLURldi1yZWFsXFxcXGNsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRjpcXFxcR2l0XFxcXE1hc3Rlci1EZXYtcmVhbFxcXFxjbGllbnRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Y6L0dpdC9NYXN0ZXItRGV2LXJlYWwvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiXHJcblxyXG5mdW5jdGlvbiByZXF1aXJlQmFja2VuZFBsdWdpbigpIHtcclxuICBjb25zdCBiYWNrZW5kT3JpZ2luID0gcHJvY2Vzcy5lbnYuQkFDS0VORF9PUklHSU4gfHwgXCJodHRwOi8vbG9jYWxob3N0OjUwMDBcIlxyXG4gIGNvbnN0IGhlYWx0aFBhdGggPSBwcm9jZXNzLmVudi5CQUNLRU5EX0hFQUxUSF9QQVRIIHx8IFwiL2FwaS9waW5nU2VydmVyXCJcclxuICBjb25zdCBlbmFibGVkID0gKHByb2Nlc3MuZW52LlJFUVVJUkVfQkFDS0VORCA/PyBcInRydWVcIikudG9Mb3dlckNhc2UoKSAhPT0gXCJmYWxzZVwiXHJcblxyXG4gIGZ1bmN0aW9uIGlzSHRtbFJlcXVlc3QocmVxKSB7XHJcbiAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8IFwiXCJcclxuICAgIGlmICh1cmwgPT09IFwiL1wiIHx8IHVybC5zdGFydHNXaXRoKFwiLz9cIikpIHJldHVybiB0cnVlXHJcbiAgICBjb25zdCBhY2NlcHQgPSByZXEuaGVhZGVycz8uYWNjZXB0IHx8IFwiXCJcclxuICAgIHJldHVybiB0eXBlb2YgYWNjZXB0ID09PSBcInN0cmluZ1wiICYmIGFjY2VwdC5pbmNsdWRlcyhcInRleHQvaHRtbFwiKVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgZnVuY3Rpb24gYmFja2VuZElzVXAoKSB7XHJcbiAgICBjb25zdCBoZWFsdGhVcmwgPSBuZXcgVVJMKGhlYWx0aFBhdGgsIGJhY2tlbmRPcmlnaW4pLnRvU3RyaW5nKClcclxuXHJcbiAgICAvLyBQcmVmZXIgZmV0Y2ggd2hlbiBhdmFpbGFibGUgKE5vZGUgMTgrKSwgb3RoZXJ3aXNlIGZhbGxiYWNrIHRvIGh0dHAvaHR0cHMuXHJcbiAgICBpZiAodHlwZW9mIGZldGNoID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goaGVhbHRoVXJsLCB7IG1ldGhvZDogXCJHRVRcIiB9KVxyXG4gICAgICByZXR1cm4gcmVzLm9rXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyByZXF1ZXN0IH0gPSBhd2FpdCBpbXBvcnQoaGVhbHRoVXJsLnN0YXJ0c1dpdGgoXCJodHRwczpcIikgPyBcImh0dHBzXCIgOiBcImh0dHBcIilcclxuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICBjb25zdCByZXEgPSByZXF1ZXN0KGhlYWx0aFVybCwgeyBtZXRob2Q6IFwiR0VUXCIgfSwgKHJlcykgPT4ge1xyXG4gICAgICAgIHJlcy5yZXN1bWUoKVxyXG4gICAgICAgIHJlc29sdmUocmVzLnN0YXR1c0NvZGUgPj0gMjAwICYmIHJlcy5zdGF0dXNDb2RlIDwgMzAwKVxyXG4gICAgICB9KVxyXG4gICAgICByZXEub24oXCJlcnJvclwiLCAoKSA9PiByZXNvbHZlKGZhbHNlKSlcclxuICAgICAgcmVxLmVuZCgpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwicmVxdWlyZS1iYWNrZW5kLWZvci1mcm9udGVuZFwiLFxyXG4gICAgYXBwbHk6IFwic2VydmVcIixcclxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcclxuICAgICAgaWYgKCFlbmFibGVkKSByZXR1cm5cclxuXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGlmICghaXNIdG1sUmVxdWVzdChyZXEpKSByZXR1cm4gbmV4dCgpXHJcblxyXG4gICAgICAgICAgY29uc3QgaGVhbHRoVXJsID0gbmV3IFVSTChoZWFsdGhQYXRoLCBiYWNrZW5kT3JpZ2luKS50b1N0cmluZygpXHJcbiAgICAgICAgICBjb25zdCB1cCA9IGF3YWl0IGJhY2tlbmRJc1VwKClcclxuICAgICAgICAgIGlmICh1cCkgcmV0dXJuIG5leHQoKVxyXG5cclxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAzXHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwidGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04XCIpXHJcbiAgICAgICAgICByZXMuZW5kKGA8IWRvY3R5cGUgaHRtbD5cclxuPGh0bWw+XHJcbiAgPGhlYWQ+XHJcbiAgICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIiAvPlxyXG4gICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xXCIgLz5cclxuICAgIDx0aXRsZT5CYWNrZW5kIGlzIG5vdCBydW5uaW5nPC90aXRsZT5cclxuICAgIDxzdHlsZT5cclxuICAgICAgOnJvb3QgeyBjb2xvci1zY2hlbWU6IGxpZ2h0IGRhcms7IH1cclxuICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiB1aS1zYW5zLXNlcmlmLCBzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIFNlZ29lIFVJLCBSb2JvdG8sIEFyaWFsLCBzYW5zLXNlcmlmOyBtYXJnaW46IDA7IHBhZGRpbmc6IDMycHg7IH1cclxuICAgICAgLmNhcmQgeyBtYXgtd2lkdGg6IDc2MHB4OyBtYXJnaW46IDAgYXV0bzsgcGFkZGluZzogMjBweCAyMnB4OyBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDEyNywxMjcsMTI3LC4zNSk7IGJvcmRlci1yYWRpdXM6IDEycHg7IH1cclxuICAgICAgY29kZSB7IGZvbnQtZmFtaWx5OiB1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgTW9uYWNvLCBDb25zb2xhcywgXCJMaWJlcmF0aW9uIE1vbm9cIiwgXCJDb3VyaWVyIE5ld1wiLCBtb25vc3BhY2U7IH1cclxuICAgICAgaDEgeyBtYXJnaW46IDAgMCAxMHB4OyBmb250LXNpemU6IDIwcHg7IH1cclxuICAgICAgcCB7IG1hcmdpbjogOHB4IDA7IGxpbmUtaGVpZ2h0OiAxLjU7IH1cclxuICAgIDwvc3R5bGU+XHJcbiAgPC9oZWFkPlxyXG4gIDxib2R5PlxyXG4gICAgPGRpdiBjbGFzcz1cImNhcmRcIj5cclxuICAgICAgPGgxPkJhY2tlbmQgaXMgbm90IHJ1bm5pbmc8L2gxPlxyXG4gICAgICA8cD5UaGUgZnJvbnRlbmQgZGV2IHNlcnZlciBpcyBjb25maWd1cmVkIHRvIHJlcXVpcmUgYSBydW5uaW5nIGJhY2tlbmQuPC9wPlxyXG4gICAgICA8cD5TdGFydCB0aGUgYmFja2VuZCwgdGhlbiByZWZyZXNoIHRoaXMgcGFnZS48L3A+XHJcbiAgICAgIDxwPjxiPkhlYWx0aCBjaGVjazwvYj46IDxjb2RlPiR7aGVhbHRoVXJsfTwvY29kZT48L3A+XHJcbiAgICA8L2Rpdj5cclxuICA8L2JvZHk+XHJcbjwvaHRtbD5gKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIHJldHVybiBuZXh0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSxcclxuICB9XHJcbn1cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgcmVxdWlyZUJhY2tlbmRQbHVnaW4oKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVIsU0FBUyxvQkFBb0I7QUFDOVMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxTQUFTLHVCQUF1QjtBQUM5QixRQUFNLGdCQUFnQixRQUFRLElBQUksa0JBQWtCO0FBQ3BELFFBQU0sYUFBYSxRQUFRLElBQUksdUJBQXVCO0FBQ3RELFFBQU0sV0FBVyxRQUFRLElBQUksbUJBQW1CLFFBQVEsWUFBWSxNQUFNO0FBRTFFLFdBQVMsY0FBYyxLQUFLO0FBQzFCLFVBQU0sTUFBTSxJQUFJLE9BQU87QUFDdkIsUUFBSSxRQUFRLE9BQU8sSUFBSSxXQUFXLElBQUk7QUFBRyxhQUFPO0FBQ2hELFVBQU0sU0FBUyxJQUFJLFNBQVMsVUFBVTtBQUN0QyxXQUFPLE9BQU8sV0FBVyxZQUFZLE9BQU8sU0FBUyxXQUFXO0FBQUEsRUFDbEU7QUFFQSxpQkFBZSxjQUFjO0FBQzNCLFVBQU0sWUFBWSxJQUFJLElBQUksWUFBWSxhQUFhLEVBQUUsU0FBUztBQUc5RCxRQUFJLE9BQU8sVUFBVSxZQUFZO0FBQy9CLFlBQU0sTUFBTSxNQUFNLE1BQU0sV0FBVyxFQUFFLFFBQVEsTUFBTSxDQUFDO0FBQ3BELGFBQU8sSUFBSTtBQUFBLElBQ2I7QUFFQSxVQUFNLEVBQUUsUUFBUSxJQUFJLE9BQWEsVUFBVSxXQUFXLFFBQVEsSUFBcEMsT0FBd0MsT0FBZ0IsSUFBeEQsT0FBa0QsTUFBTTtBQUNsRixXQUFPLE1BQU0sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUNwQyxZQUFNLE1BQU0sUUFBUSxXQUFXLEVBQUUsUUFBUSxNQUFNLEdBQUcsQ0FBQyxRQUFRO0FBQ3pELFlBQUksT0FBTztBQUNYLGdCQUFRLElBQUksY0FBYyxPQUFPLElBQUksYUFBYSxHQUFHO0FBQUEsTUFDdkQsQ0FBQztBQUNELFVBQUksR0FBRyxTQUFTLE1BQU0sUUFBUSxLQUFLLENBQUM7QUFDcEMsVUFBSSxJQUFJO0FBQUEsSUFDVixDQUFDO0FBQUEsRUFDSDtBQUVBLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLGdCQUFnQixRQUFRO0FBQ3RCLFVBQUksQ0FBQztBQUFTO0FBRWQsYUFBTyxZQUFZLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUztBQUMvQyxZQUFJO0FBQ0YsY0FBSSxDQUFDLGNBQWMsR0FBRztBQUFHLG1CQUFPLEtBQUs7QUFFckMsZ0JBQU0sWUFBWSxJQUFJLElBQUksWUFBWSxhQUFhLEVBQUUsU0FBUztBQUM5RCxnQkFBTSxLQUFLLE1BQU0sWUFBWTtBQUM3QixjQUFJO0FBQUksbUJBQU8sS0FBSztBQUVwQixjQUFJLGFBQWE7QUFDakIsY0FBSSxVQUFVLGdCQUFnQiwwQkFBMEI7QUFDeEQsY0FBSSxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQ0FvQm9CLFNBQVM7QUFBQTtBQUFBO0FBQUEsUUFHdkM7QUFBQSxRQUNBLFNBQVMsR0FBRztBQUNWLGlCQUFPLEtBQUssQ0FBQztBQUFBLFFBQ2Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQztBQUFBLEVBQ3pDLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
