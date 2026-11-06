import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LetsChat",
    short_name: "LetsChat",
    description: "Private 1-on-1 Messenger",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f43f5e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ],
  };
}
