import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "../page";
import {
  LANDING_PAGES,
  getLandingConfig,
  metadataForLanding,
} from "@/lib/landing-config";

export const dynamicParams = false;

type Props = {
  params: {
    landing: string;
  };
};

export function generateStaticParams() {
  return Object.keys(LANDING_PAGES).map((landing) => ({ landing }));
}

export function generateMetadata({ params }: Props): Metadata {
  const config = getLandingConfig(params.landing);
  if (!config) return {};
  return metadataForLanding(config);
}

export default function LandingPage({ params }: Props) {
  const config = getLandingConfig(params.landing);
  if (!config) notFound();

  return <HomePage />;
}
