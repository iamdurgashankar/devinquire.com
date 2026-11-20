import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Printer, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import SEO from "../components/SEO";

function formatMoney(amount, currency = "INR") {
  const num = Number(amount) || 0;
  if (currency === "USD") {
    return `$ ${num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function QuotationView() {
  const { slug } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(false);
  const [responseError, setResponseError] = useState(null);

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const dashboardPublicUrl =
    process.env.REACT_APP_DASHBOARD_API_URL ||
    (isLocal
      ? "http://localhost:8001/api/public"
      : "https://dashboard.devinquire.com/api/public");

  const handleDecision = async (decision) => {
    if (!slug || responding || quotation?.clientDecision) return;
    setResponding(true);
    setResponseError(null);
    try {
      const res = await fetch(`${dashboardPublicUrl}/quotation/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, decision }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== "success" || !json.data) {
        throw new Error(json?.message || "Could not save response.");
      }
      setQuotation(json.data);
    } catch (err) {
      setResponseError(err.message || "Failed to submit response.");
    } finally {
      setResponding(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${dashboardPublicUrl}/quotation?slug=${encodeURIComponent(slug || "")}`
        );
        const json = await res.json().catch(() => null);
        if (!res.ok || !json || json.status !== "success" || !json.data) {
          throw new Error(json?.message || "Quotation not found.");
        }
        if (active) setQuotation(json.data);
      } catch (err) {
        if (active) setError(err.message || "Unable to load quotation.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (slug) load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef1f6] flex items-center justify-center p-6">
        <div className="bg-white px-8 py-6 rounded-xl shadow-md text-[#172033] text-sm font-medium">
          Loading quotation…
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-[#eef1f6] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center text-[#172033]">
          <h1 className="text-xl font-bold mb-2">Quotation Not Found</h1>
          <p className="text-sm text-[#667085] mb-6">
            {error || "This quotation link may have expired or been removed."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4e45e1] text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to DevInquire</span>
          </Link>
        </div>
      </div>
    );
  }

  const items = Array.isArray(quotation.items) ? quotation.items : [];
  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const taxPercent = Number(quotation.taxPercent) || 0;
  const taxAmount = Math.round((subtotal * taxPercent) / 100);
  const total = subtotal + taxAmount;
  const currency = quotation.currency || "INR";

  return (
    <div className="min-h-screen bg-[#eef1f6] py-8 px-4 sm:px-8 print:bg-white print:p-0">
      <SEO
        title={`${quotation.quotationNo || "Quotation"} | ${quotation.clientName || "Client"}`}
        description={quotation.subtitle || "DevInquire Service Quotation"}
      />

      {/* Print Action Bar (hidden when printing) */}
      <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>devinquire.com</span>
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4e45e1] text-white text-xs font-semibold shadow-sm hover:opacity-95"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* A4 Quotation Sheet */}
      <main
        className="mx-auto bg-white text-[#172033] shadow-[0_12px_40px_rgba(20,30,55,0.10)] print:shadow-none print:max-w-none"
        style={{
          maxWidth: "850px",
          padding: "54px 60px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, "Segoe UI", sans-serif',
          fontSize: "14px",
          lineHeight: 1.55,
        }}
      >
        <header className="flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center border-b border-[#e5e9f0] pb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center text-white text-[13px] font-bold shrink-0"
              style={{
                background:
                  "linear-gradient(155deg,#7770ff 0%,#5b53ed 48%,#493fda 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,.38),0 5px 12px rgba(78,69,225,.22)",
              }}
            >
              <span className="text-white/75 text-[12px] font-semibold">{"{"}</span>
              <span>DI</span>
              <span className="text-white/75 text-[12px] font-semibold">{"}"}</span>
            </div>
            <div className="flex flex-col justify-center gap-1">
              <div className="text-[20px] font-semibold tracking-[-0.75px] leading-none text-[#171923]">
                {quotation.preparedByName || "DevInquire"}
              </div>
              <div className="text-[#778096] text-[9px] font-semibold tracking-[1.05px] uppercase leading-tight">
                Digital solutions &amp; technology services
              </div>
            </div>
          </div>

          <div className="sm:text-right text-[#667085] text-[12px] leading-[1.7]">
            <div>
              <strong className="text-[#172033] font-semibold">Quotation No:</strong>{" "}
              <span>{quotation.quotationNo}</span>
            </div>
            <div>
              <strong className="text-[#172033] font-semibold">Date:</strong>{" "}
              <span>{quotation.date}</span>
            </div>
            <div>
              <strong className="text-[#172033] font-semibold">Valid Until:</strong>{" "}
              <span>{quotation.validUntil}</span>
            </div>
          </div>
        </header>

        <h1 className="mt-7 mb-1 text-[30px] font-semibold tracking-[-0.9px] leading-[1.15] text-[#172033]">
          {quotation.title || "Quotation"}
        </h1>
        <p className="text-[#667085] m-0">{quotation.subtitle}</p>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-7 my-8">
          <div>
            <div className="text-[#667085] text-[11px] font-bold tracking-[1.2px] uppercase mb-2">
              Prepared by
            </div>
            <div className="p-[18px] bg-[#f4f6fb] rounded-[8px] min-h-[112px] text-[13.5px]">
              <strong className="text-[16px] text-[#172033]">
                {quotation.preparedByName || "DevInquire"}
              </strong>
              <br />
              {quotation.preparedByAddress}
              <br />
              {quotation.preparedByContact}
              <br />
              {quotation.preparedByGstin}
            </div>
          </div>
          <div>
            <div className="text-[#667085] text-[11px] font-bold tracking-[1.2px] uppercase mb-2">
              Quotation for
            </div>
            <div className="p-[18px] bg-[#f4f6fb] rounded-[8px] min-h-[112px] text-[13.5px]">
              <strong className="text-[16px] text-[#172033]">
                {quotation.clientName}
              </strong>
              <br />
              {quotation.clientWebsite && (
                <>
                  Website: {quotation.clientWebsite}
                  <br />
                </>
              )}
              {quotation.clientAddress}
            </div>
          </div>
        </section>

        <p className="mb-2">{quotation.salutation}</p>
        <p className="mb-5 text-[#172033]">{quotation.introText}</p>

        <table className="w-full border-collapse my-5">
          <thead>
            <tr>
              <th className="text-left bg-[#172033] text-white px-3.5 py-3 text-[12px] uppercase tracking-[0.6px] w-[7%]">
                #
              </th>
              <th className="text-left bg-[#172033] text-white px-3.5 py-3 text-[12px] uppercase tracking-[0.6px]">
                Service description
              </th>
              <th className="text-right bg-[#172033] text-white px-3.5 py-3 text-[12px] uppercase tracking-[0.6px] whitespace-nowrap">
                Period
              </th>
              <th className="text-right bg-[#172033] text-white px-3.5 py-3 text-[12px] uppercase tracking-[0.6px] whitespace-nowrap">
                Amount ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="px-3.5 py-4 border-b border-[#e5e9f0] align-top">
                  {String(idx + 1).padStart(2, "0")}
                </td>
                <td className="px-3.5 py-4 border-b border-[#e5e9f0] align-top">
                  <strong className="text-[#172033]">{item.title}</strong>
                  {item.description && (
                    <div className="text-[#667085] text-[13px] mt-1">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="px-3.5 py-4 border-b border-[#e5e9f0] align-top text-right whitespace-nowrap">
                  {item.period}
                </td>
                <td className="px-3.5 py-4 border-b border-[#e5e9f0] align-top text-right whitespace-nowrap font-medium">
                  {formatMoney(item.amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="w-full max-w-[340px] ml-auto mt-4">
          <div className="flex justify-between py-1.5 text-[#667085]">
            <span>Subtotal</span>
            <strong className="text-[#172033]">
              {formatMoney(subtotal, currency)}
            </strong>
          </div>
          <div className="flex justify-between py-1.5 text-[#667085]">
            <span>GST / applicable taxes ({taxPercent}%)</span>
            <strong className="text-[#172033]">
              {formatMoney(taxAmount, currency)}
            </strong>
          </div>
          <div className="flex justify-between border-t-2 border-[#172033] mt-1.5 pt-3 text-[#172033] font-extrabold text-[18px]">
            <span>Total payable</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
        </div>

        <h2 className="text-[15px] font-bold text-[#172033] mt-7 mb-2">
          Service period and terms
        </h2>
        <ul className="my-2 pl-5 list-disc text-[#667085] space-y-1">
          <li>
            <strong className="text-[#172033]">Service period:</strong> 12 months, from{" "}
            {quotation.servicePeriodStart} to {quotation.servicePeriodEnd}.
          </li>
          {(quotation.terms || []).map((term, idx) => {
            const colonIdx = term.indexOf(":");
            if (colonIdx > 0 && colonIdx < 32) {
              return (
                <li key={idx}>
                  <strong className="text-[#172033]">
                    {term.slice(0, colonIdx + 1)}
                  </strong>
                  {term.slice(colonIdx + 1)}
                </li>
              );
            }
            return <li key={idx}>{term}</li>;
          })}
        </ul>

        <div className="bg-[#f4f6fb] border-l-[3px] border-[#3157d5] px-4 py-3.5 text-[#667085] text-[13px] mt-6">
          <strong className="text-[#172033]">Note:</strong> {quotation.note}
        </div>

        <div className="grid grid-cols-2 gap-12 mt-12">
          <div className="border-t border-[#aeb6c5] pt-2.5 text-[#667085] text-[12px]">
            For {quotation.preparedByName || "DevInquire"}
            <br />
            <br />
            <strong className="text-[#172033]">{quotation.signatoryName}</strong>
          </div>
          <div className="border-t border-[#aeb6c5] pt-2.5 text-[#667085] text-[12px]">
            <div>Accepted by {quotation.clientName || "Client"}</div>

            {!quotation.clientDecision ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => handleDecision("agreed")}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border transition cursor-pointer disabled:opacity-60 bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Agreed
                </button>
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => handleDecision("rejected")}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border transition cursor-pointer disabled:opacity-60 bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rejected
                </button>
              </div>
            ) : (
              <div className="mt-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.4px] ${
                      quotation.clientDecision === "agreed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {quotation.clientDecision === "agreed" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {quotation.clientDecision === "agreed" ? "Agreed" : "Rejected"}
                  </span>
                  {quotation.clientDecisionAt && (
                    <span className="text-[11px] text-[#667085]">
                      on{" "}
                      {new Date(quotation.clientDecisionAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-[#667085] print:hidden">
                  Response locked. Please request a new quotation for any changes.
                </div>
              </div>
            )}

            {responseError && (
              <div className="mt-1.5 text-[11px] text-rose-600 print:hidden">
                {responseError}
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-[#e5e9f0] mt-11 pt-4 text-[#667085] text-[11px] text-center">
          Thank you for choosing {quotation.preparedByName || "DevInquire"}.
        </footer>
      </main>
    </div>
  );
}
