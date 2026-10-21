"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Clock, Star, ShieldCheck, ChevronRight,
  Stethoscope, AlertCircle, X, ExternalLink,
  Globe, Filter, Languages, Award, Wifi, MapPin, List, Phone, Navigation, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { cn } from "@/lib/utils";

// ─── Doctor data (Apollo 247 OB/GYN style) ─────────────────────────────────

interface Doctor {
  id: string;
  name: string;
  qual: string;
  exp: number;
  hospital: string;
  fee: number;
  originalFee: number;
  rating: number;
  reviews: number;
  waitMin: number;
  languages: string[];
  tags: string[];
  available: boolean;
  nextSlot: string;
  avatar: string;
  grad: string;
  profileUrl: string;
}

const DOCTORS: Doctor[] = [
  {
    id: "1", name: "Dr. Priya Sharma",
    qual: "MBBS, MS (Obs & Gynae)", exp: 18,
    hospital: "Apollo Spectra, New Delhi",
    fee: 799, originalFee: 1000, rating: 4.9, reviews: 1847, waitMin: 10,
    languages: ["English", "Hindi"],
    tags: ["PCOS", "Infertility", "Laparoscopy", "High Risk Pregnancy"],
    available: true, nextSlot: "Today, 2:30 PM",
    avatar: "PS", grad: "from-rose-500 to-pink-600",
    profileUrl: "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists",
  },
  {
    id: "2", name: "Dr. Kavitha Reddy",
    qual: "MBBS, DGO, FRCOG", exp: 22,
    hospital: "Motherhood Hospital, Bengaluru",
    fee: 999, originalFee: 1200, rating: 4.8, reviews: 2103, waitMin: 15,
    languages: ["English", "Hindi", "Kannada"],
    tags: ["Endometriosis", "Hormonal Disorders", "Menopause", "PCOS"],
    available: true, nextSlot: "Today, 3:00 PM",
    avatar: "KR", grad: "from-violet-500 to-purple-600",
    profileUrl: "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists",
  },
  {
    id: "3", name: "Dr. Meena Joshi",
    qual: "MBBS, MD (Obs & Gynae)", exp: 15,
    hospital: "Apollo Hospital, Mumbai",
    fee: 699, originalFee: 900, rating: 4.7, reviews: 1245, waitMin: 8,
    languages: ["English", "Hindi", "Marathi"],
    tags: ["PCOS", "Infertility", "Menstrual Disorders"],
    available: true, nextSlot: "Today, 1:45 PM",
    avatar: "MJ", grad: "from-fuchsia-500 to-pink-600",
    profileUrl: "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists",
  },
  {
    id: "4", name: "Dr. Sunita Agarwal",
    qual: "MBBS, DNB (Obs & Gynae)", exp: 12,
    hospital: "Max Healthcare, Gurgaon",
    fee: 549, originalFee: 700, rating: 4.9, reviews: 987, waitMin: 5,
    languages: ["English", "Hindi"],
    tags: ["Adolescent Gynaecology", "PCOS", "Contraception"],
    available: false, nextSlot: "Tomorrow, 10:00 AM",
    avatar: "SA", grad: "from-emerald-500 to-teal-600",
    profileUrl: "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists",
  },
  {
    id: "5", name: "Dr. Rashmi Gupta",
    qual: "MBBS, MS, Fellowship Reproductive Medicine", exp: 20,
    hospital: "Fortis Hospital, Noida",
    fee: 899, originalFee: 1100, rating: 4.8, reviews: 1678, waitMin: 20,
    languages: ["English", "Hindi"],
    tags: ["IVF", "Infertility", "PCOS", "Menstrual Disorders"],
    available: true, nextSlot: "Today, 4:00 PM",
    avatar: "RG", grad: "from-amber-500 to-orange-600",
    profileUrl: "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists",
  },
  {
    id: "6", name: "Dr. Ananya Singh",
    qual: "MBBS, DGO, FMAS", exp: 10,
    hospital: "Apollo Clinic, Chennai",
    fee: 499, originalFee: 600, rating: 4.6, reviews: 743, waitMin: 12,
    languages: ["English", "Hindi", "Tamil"],
    tags: ["PCOS", "Pregnancy Care", "Gynaecological Infections"],
    available: true, nextSlot: "Today, 5:30 PM",
    avatar: "AS", grad: "from-sky-500 to-blue-600",
    profileUrl: "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists",
  },
];

type Filter = "all" | "available" | "under500" | "under800";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",       label: "All Doctors" },
  { id: "available", label: "Available Now" },
  { id: "under500",  label: "Under Rs. 500" },
  { id: "under800",  label: "Under Rs. 800" },
];

type NearbyFacility = {
  id: number | string;
  name: string;
  phone: string;
  lat: number;
  lon: number;
  kind: "Hospital" | "Clinic" | "Doctor";
  distanceKm: number;
  website: string | undefined;
};

type NearbyCareResponse = {
  facilities?: NearbyFacility[];
  location?: {
    latitude: number;
    longitude: number;
    label: string;
  };
  error?: string;
};

// ─── Live Browse overlay ─────────────────────────────────────────────────────

function LiveBrowseOverlay({ onClose }: { onClose: () => void }) {
  const url = "https://www.apollo247.com/specialties/obstetrician-and-gynaecologists";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#0d0d0f]"
    >
      {/* Browser chrome bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1a1a1c] border-b border-black/10 dark:border-white/[0.08]">
        <button
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/10 text-[rgb(var(--fg))] hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
        >
          <X size={15} />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/10 dark:border-white/[0.08] px-3 py-1.5">
          <Globe size={12} className="text-ink/50 dark:text-white/50 shrink-0" />
          <span className="text-xs text-ink/60 dark:text-white/60 truncate flex-1">apollo247.com</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/10 text-[rgb(var(--fg))] hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Iframe attempt */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title="Apollo 247 - OB/GYN Specialists"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Fallback overlay, visible when the external site blocks embedding. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream dark:bg-[#131315] px-6 pointer-events-none">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.08] dark:text-[rgb(var(--acc-200))]">
            <ShieldCheck size={30} />
          </div>
          <h3 className="font-display text-xl font-bold text-ink dark:text-white text-center mb-2">
            Apollo 247 blocks embedding
          </h3>
          <p className="text-sm text-ink/70 dark:text-white/60 text-center leading-relaxed mb-6 max-w-xs">
            For user security, Apollo 247 prevents its pages from being embedded in other apps. Tap below to open their full booking experience in your browser.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#d75b91,#a386ff)] px-8 py-4 text-base font-bold text-white shadow-[0_12px_32px_-8px_rgba(215,91,145,0.6)] hover:brightness-110 transition-all"
          >
            <ExternalLink size={18} /> Open Apollo 247
          </a>
          <p className="mt-4 text-xs text-ink/50 dark:text-white/50 text-center">
            You'll be taken to their OB/GYN specialist listing
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Doctor Card ─────────────────────────────────────────────────────────────

function DoctorCard({ doc }: { doc: Doctor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-panel overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_24px_62px_-44px_rgba(89,52,84,0.55)]"
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${doc.grad} font-display text-lg font-bold text-white shadow-[0_18px_42px_-28px_var(--acc-glow)]`}>
            {doc.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-base leading-tight">{doc.name}</p>
                <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5 leading-snug">{doc.qual}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/20 px-2 py-0.5">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400">{doc.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] text-ink/50 dark:text-white/50">{doc.exp} yrs exp</span>
              <span className="h-1 w-1 rounded-full bg-black/20 dark:bg-white/20" />
              <span className="text-[11px] text-ink/50 dark:text-white/50">{doc.reviews.toLocaleString()} reviews</span>
            </div>
          </div>
        </div>

        {/* Hospital */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Award size={11} className="text-ink/40 dark:text-white/40 shrink-0" />
          <span className="text-xs text-ink/60 dark:text-white/60 truncate">{doc.hospital}</span>
        </div>

        {/* Languages */}
        <div className="flex items-center gap-1.5 mb-3">
          <Languages size={11} className="text-ink/40 dark:text-white/40 shrink-0" />
          <span className="text-xs text-ink/60 dark:text-white/60">{doc.languages.join(" - ")}</span>
        </div>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {doc.tags.map(t => (
            <span key={t} className="rounded-full bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] px-2.5 py-0.5 text-[10px] text-ink/70 dark:text-white/70">
              {t}
            </span>
          ))}
        </div>

        {/* Fee + availability row */}
        <div className="flex items-center justify-between mb-3 rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] px-4 py-2.5">
          <div>
            <p className="text-[10px] text-ink/50 dark:text-white/50 uppercase tracking-wider">Video Consult</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-display text-lg font-bold text-[rgb(var(--fg))]">Rs. {doc.fee}</span>
              <span className="text-xs text-ink/40 dark:text-white/40 line-through">Rs. {doc.originalFee}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 mb-0.5">
              <span className={cn("h-2 w-2 rounded-full", doc.available ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
              <span className={cn("text-[11px] font-semibold", doc.available ? "text-emerald-400" : "text-ink/50 dark:text-white/50")}>
                {doc.available ? "Available" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-ink/50 dark:text-white/50">
              <Clock size={10} />
              {doc.available ? `~${doc.waitMin} min wait` : doc.nextSlot}
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2">
          <a
            href={doc.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all",
              doc.available
                ? "bg-brand-gradient text-white shadow-[0_18px_42px_-28px_var(--acc-glow)] hover:-translate-y-0.5"
                : "bg-[rgb(var(--card)/0.78)] border border-[rgb(var(--border)/0.76)] text-[rgb(var(--muted))] dark:bg-white/[0.07] dark:border-white/[0.08]",
            )}
          >
            <Video size={14} />
            {doc.available ? "Book Video Call" : "Schedule"}
          </a>
          <a
            href={doc.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.66)] px-4 py-2.5 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--acc-200))] hover:text-[rgb(var(--fg))] dark:bg-white/[0.07] dark:border-white/[0.08] dark:hover:border-white/15 transition-all"
          >
            Profile <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctorPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [showLiveBrowse, setShowLiveBrowse] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [locationQuery, setLocationQuery] = useState("Hospitals and gynecologists near me");
  const [manualLocation, setManualLocation] = useState("");
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hasSearchedNearby, setHasSearchedNearby] = useState(false);

  const fetchNearbyFacilities = useCallback(async (latitude: number, longitude: number) => {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
    });
    const res = await fetch(`/api/nearby-care?${params.toString()}`);
    const data = (await res.json()) as NearbyCareResponse;

    if (!res.ok) throw new Error(data.error || "Nearby care search failed");
    setNearbyFacilities(data.facilities ?? []);
  }, []);

  const searchManualLocation = useCallback(async () => {
    const query = manualLocation.trim();
    if (!query) {
      setLocationError("Enter a city, area, or landmark to search nearby care.");
      return;
    }

    setHasSearchedNearby(true);
    setIsLoadingHospitals(true);
    setLocationError("");
    setNearbyFacilities([]);
    setLocationQuery(`gynecologist hospital clinic near ${query}`);

    try {
      const params = new URLSearchParams({ q: query });
      const res = await fetch(`/api/nearby-care?${params.toString()}`);
      const data = (await res.json()) as NearbyCareResponse;

      if (!res.ok) throw new Error(data.error || "Nearby care search failed");
      setNearbyFacilities(data.facilities ?? []);
      if (data.location?.label) {
        setLocationQuery(`gynecologist hospital clinic near ${data.location.label}`);
      }
      if (!data.facilities?.length) {
        setLocationError("No named hospitals, clinics, or doctors were found for that area. The map search is still available.");
      }
    } catch (err) {
      console.error("Failed to fetch nearby care by location", err);
      setLocationError(err instanceof Error ? err.message : "Nearby listings are temporarily unavailable.");
    } finally {
      setIsLoadingHospitals(false);
    }
  }, [manualLocation]);

  const findNearbyCare = useCallback(() => {
    setHasSearchedNearby(true);
    setLocationError("");
    setNearbyFacilities([]);

    if (!("geolocation" in navigator)) {
      setLocationError("Your browser does not support location access. Enter your city or area to search nearby care.");
      return;
    }

    setIsLoadingHospitals(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationQuery(`gynecologist hospital clinic near ${latitude},${longitude}`);

        try {
          await fetchNearbyFacilities(latitude, longitude);
        } catch (err) {
          console.error("Failed to fetch nearby care", err);
          setLocationError(err instanceof Error ? err.message : "Nearby listings are temporarily unavailable. The map search still works.");
        } finally {
          setIsLoadingHospitals(false);
        }
      },
      (err) => {
        console.warn("Location access denied or unavailable. Using default query.", err);
        setLocationError("Location access was blocked or unavailable. Enter your city or area to search nearby care.");
        setIsLoadingHospitals(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }, [fetchNearbyFacilities]);

  useEffect(() => {
    if (viewMode === "map" && !hasSearchedNearby) {
      findNearbyCare();
    }
  }, [viewMode, hasSearchedNearby, findNearbyCare]);

  const filtered = DOCTORS.filter(d => {
    if (activeFilter === "available") return d.available;
    if (activeFilter === "under500") return d.fee < 500;
    if (activeFilter === "under800") return d.fee < 800;
    return true;
  });

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;

  return (
    <>
      <AnimatePresence>
        {showLiveBrowse && <LiveBrowseOverlay onClose={() => setShowLiveBrowse(false)} />}
      </AnimatePresence>

      <div className="pb-4">
        <Topbar title="Talk to Doctor" />

        <section className="section-panel mb-5 overflow-hidden p-0">
          <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-7">
            <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <Badge tone="rose">
                  <Stethoscope size={13} />
                  Care finder
                </Badge>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                  Find trusted period care, online or near you.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
                  Book video consults with OB/GYN specialists, or use the map to locate nearby hospitals, clinics, and doctors.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {["MBBS verified", "Video consults", "Nearby hospitals", "Doctor practices"].map((item) => (
                    <Badge key={item} tone="lavender">{item}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button onClick={() => setShowLiveBrowse(true)}>
                    <Globe size={16} /> Browse live site
                  </Button>
                  <a
                    href="https://www.apollo247.com/specialties/obstetrician-and-gynaecologists"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pastel-button inline-flex h-11 items-center justify-center gap-2 rounded-[18px] px-5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <ExternalLink size={16} /> Open Apollo 247
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { icon: Star,         label: "Top Rated",     sub: "4.8+ avg rating" },
            { icon: Video,        label: "Video Call",    sub: "HD consultation" },
            { icon: Clock,        label: "Quick Connect", sub: "Avg. ~10 min wait" },
            { icon: ShieldCheck,  label: "Verified",      sub: "Board-certified" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-black/5 dark:border-white/[0.08] bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07] p-2.5 text-center">
              <Icon size={14} className="text-[#d75b91]" />
              <p className="text-[10px] font-semibold text-ink/80 dark:text-white/80 leading-tight">{label}</p>
              <p className="text-[9px] text-ink/50 dark:text-white/50 leading-tight hidden sm:block">{sub}</p>
            </div>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl bg-white/40 dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              viewMode === "list"
                ? "bg-white dark:bg-white/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-none text-ink dark:text-white"
                : "text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <List size={16} /> List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              viewMode === "map"
                ? "bg-white dark:bg-white/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-none text-ink dark:text-white"
                : "text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <MapPin size={16} /> Map View
          </button>
        </div>

        {viewMode === "list" ? (
          <>
            {/* Filter pills */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all",
                    activeFilter === f.id
                      ? "bg-[linear-gradient(135deg,#d75b91,#a386ff)] border-transparent text-white shadow-[0_4px_14px_-4px_rgba(215,91,145,0.5)]"
                      : "border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.07] text-ink/70 dark:text-white/70 hover:text-ink dark:hover:text-white hover:border-black/15 dark:hover:border-white/15",
                  )}
                >
                  {f.label}
                </button>
              ))}
              <div className="shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 border border-black/5 dark:border-white/[0.08] bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] text-ink dark:text-white">
                <Filter size={11} />
                <span className="text-xs">Filter</span>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm font-semibold">{filtered.length} doctors found</p>
              <span className="text-xs text-ink/50 dark:text-white/50 flex items-center gap-1">
                <Wifi size={11} /> Powered by Apollo 247
              </span>
            </div>

            {/* Doctor cards */}
            <div className="space-y-4 mb-6">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-ink dark:text-white">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                    <Stethoscope size={22} />
                  </div>
                  <p className="font-semibold">No doctors match this filter</p>
                  <p className="text-sm mt-1">Try a different filter above</p>
                </div>
              ) : (
                filtered.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <DoctorCard doc={doc} />
                  </motion.div>
                ))
              )}
            </div>

            {/* View all on Apollo 247 */}
            <a
              href="https://www.apollo247.com/specialties/obstetrician-and-gynaecologists"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-black/5 dark:border-white/[0.08] bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07] py-4 text-sm font-semibold text-ink dark:text-white hover:border-black/10 dark:hover:border-white/15 hover:text-ink hover:bg-black/5 dark:hover:bg-white/[0.08] transition-all mb-4"
            >
              View all 200+ doctors on Apollo 247 <ExternalLink size={14} />
            </a>
          </>
        ) : (
          <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <motion.section
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="section-panel overflow-hidden p-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <div>
                  <Badge tone="green">
                    <MapPin size={13} />
                    Nearby care
                  </Badge>
                  <h3 className="mt-2 font-display text-xl font-semibold text-[rgb(var(--fg))]">Hospitals, clinics, and doctors near you</h3>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">The map opens a local search and the list uses OpenStreetMap care listings when location access is allowed.</p>
                </div>
                <Button type="button" variant="outline" onClick={findNearbyCare} disabled={isLoadingHospitals}>
                  <Search size={16} />
                  {isLoadingHospitals ? "Finding..." : "Find nearby"}
                </Button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  searchManualLocation();
                }}
                className="flex flex-col gap-2 border-t border-[rgb(var(--border)/0.72)] px-4 py-3 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="relative flex-1">
                  <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
                  <input
                    value={manualLocation}
                    onChange={(event) => setManualLocation(event.target.value)}
                    placeholder="Search by city, area, or landmark"
                    className="h-11 w-full rounded-[16px] border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.68)] pl-9 pr-3 text-sm font-semibold text-[rgb(var(--fg))] outline-none transition focus:border-[rgb(var(--acc-300))] focus:ring-2 focus:ring-[rgb(var(--acc-200)/0.45)] dark:bg-white/[0.07]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="soft" disabled={isLoadingHospitals} className="flex-1 sm:flex-none">
                    <Search size={16} />
                    Search area
                  </Button>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pastel-button inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[18px] px-4 text-sm font-extrabold transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <ExternalLink size={16} />
                    Maps
                  </a>
                </div>
              </form>

              <div className="relative h-[380px] overflow-hidden border-t border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface-2)/0.5)]">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  className="absolute inset-0 h-full w-full border-0 filter transition-all duration-300 dark:invert-[0.9] dark:hue-rotate-180 dark:contrast-125 dark:opacity-80"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute left-4 top-4 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#1a1a1c]/90">
                  <MapPin size={16} className="text-[rgb(var(--acc-600))]" />
                  <span className="truncate text-sm font-bold text-[rgb(var(--fg))]">{locationQuery}</span>
                </div>
              </div>
            </motion.section>

            <aside className="section-panel p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Nearby contacts</h3>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Call first when a number is listed, or open directions to confirm hours.</p>
                </div>
                {isLoadingHospitals && <span className="text-xs font-semibold text-[rgb(var(--muted))]">Searching</span>}
              </div>

              {locationError && (
                <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-5 text-[rgb(var(--muted))]">
                  {locationError}
                </div>
              )}

              {!isLoadingHospitals && nearbyFacilities.length === 0 ? (
                <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-5 text-sm leading-6 text-[rgb(var(--muted))]">
                  Use "Find nearby" and allow location access, or search by city/area to list care options with distance and contact details.
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-[14px] bg-brand-gradient px-3 text-sm font-bold text-white shadow-[0_16px_34px_-24px_var(--acc-glow)]"
                  >
                    <ExternalLink size={14} /> Open in Google Maps
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {nearbyFacilities.map((facility, index) => (
                    <motion.div
                      key={facility.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-38px_rgba(89,52,84,0.55)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-display text-base font-semibold text-[rgb(var(--fg))]">{facility.name}</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone={facility.kind === "Doctor" ? "lavender" : facility.kind === "Clinic" ? "green" : "rose"}>{facility.kind}</Badge>
                            <Badge tone="slate">{facility.distanceKm.toFixed(1)} km</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {facility.phone ? (
                          <a
                            href={`tel:${facility.phone.replace(/[^0-9+]/g, "")}`}
                            className="pastel-button inline-flex h-9 items-center gap-2 rounded-[14px] px-3 text-sm font-bold"
                          >
                            <Phone size={14} /> {facility.phone}
                          </a>
                        ) : (
                          <span className="inline-flex h-9 items-center gap-2 rounded-[14px] bg-[rgb(var(--surface-2)/0.72)] px-3 text-sm font-semibold text-[rgb(var(--muted))]">
                            <Phone size={14} /> No number listed
                          </span>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-2 rounded-[14px] bg-brand-gradient px-3 text-sm font-bold text-white shadow-[0_16px_34px_-24px_var(--acc-glow)]"
                        >
                          <Navigation size={14} /> Directions
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 flex items-start gap-3">
          <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
            <span className="font-semibold text-amber-400 block mb-0.5">Medical Disclaimer</span>
            Doctor listings and booking are facilitated through Apollo 247, an independent platform. Lotus Phase is not a medical service. Always seek professional advice for health concerns. In emergency, call your local emergency services immediately.
          </p>
        </div>
      </div>
    </>
  );
}
