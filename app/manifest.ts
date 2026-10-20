import type { MetadataRoute } from "next";

/** Web app manifest: name + council emblem icons (favicon.ico 16/32/48, icon.png 256, apple-icon 180, 192, 512). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "คณะกรรมการสภานักเรียน โรงเรียนอุตรดิตถ์",
    short_name: "สภานักเรียน UTD",
    start_url: "/th",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#0b1f4d",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
