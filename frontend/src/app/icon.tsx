import { BrandMarkSvg } from "@/components/brand/BrandLogo";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/svg+xml";

export default function Icon() {
  return <BrandMarkSvg className="h-full w-full" />;
}
