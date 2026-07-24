import { useState } from "react";

const COMPANY_DOMAINS: Record<string, string> = {
  google: "google.com",
  microsoft: "microsoft.com",
  amazon: "amazon.com",
  meta: "meta.com",
  apple: "apple.com",
  netflix: "netflix.com",
  tcs: "tcs.com",
  infosys: "infosys.com",
  accenture: "accenture.com",
  wipro: "wipro.com",
  capgemini: "capgemini.com",
  deloitte: "deloitte.com",
  startup: "",
};

interface CompanyLogoProps {
  companyId: string;
  companyName: string;
  logo: string;
  color: string;
  size?: number;
  className?: string;
}

export default function CompanyLogo({ companyId, companyName, logo, color, size = 40, className = "" }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const domain = COMPANY_DOMAINS[companyId];

  if (domain && !imgError) {
    return (
      <div
        className={`rounded-xl flex items-center justify-center mb-2 overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
          background: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={`${companyName} logo`}
          width={size - 12}
          height={size - 12}
          style={{ objectFit: "contain" }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl flex items-center justify-center mb-2 text-sm font-extrabold ${className}`}
      style={{
        width: size,
        height: size,
        background: `${color}20`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {logo || companyName.charAt(0)}
    </div>
  );
}
