"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getWorkerLocationStatus,
  saveWorkerProfile,
  saveWorkerServices,
  setWorkerAvailability,
  updateWorkerLocation,
} from "@/app/actions/worker";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  geolocationErrorMessage,
  getCurrentPosition,
  type GeolocationError,
} from "@/lib/geolocation";
import { cn, timeAgo } from "@/lib/utils";

type WorkerDashboardClientProps = {
  workerProfile: {
    description: string | null;
    experienceYears: number;
    serviceRadiusKm: number;
    isAvailable: boolean;
    locationUpdatedAt: string | null;
  };
  services: { id: string; name: string; slug: string }[];
  selectedServiceIds: string[];
};

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

function isLocationStale(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return false;
  return Date.now() - Date.parse(updatedAt) > STALE_AFTER_MS;
}

export function WorkerDashboardClient({
  workerProfile,
  services,
  selectedServiceIds,
}: WorkerDashboardClientProps) {
  const [isAvailable, setIsAvailable] = useState(workerProfile.isAvailable);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [location, setLocation] = useState<{
    updatedAt: string | null;
    coordsSet: boolean;
  } | null>(
    workerProfile.locationUpdatedAt
      ? { updatedAt: workerProfile.locationUpdatedAt, coordsSet: true }
      : null
  );
  const [locationLoading, setLocationLoading] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectedServiceIds)
  );
  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [description, setDescription] = useState(
    workerProfile.description ?? ""
  );
  const [experienceYears, setExperienceYears] = useState(
    String(workerProfile.experienceYears)
  );
  const [radius, setRadius] = useState(String(workerProfile.serviceRadiusKm));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWorkerLocationStatus()
      .then((res) => {
        if (cancelled || "error" in res) return;
        setLocation({
          updatedAt: res.locationUpdatedAt,
          coordsSet: res.lat != null && res.lng != null,
        });
      })
      .finally(() => {
        if (!cancelled) setLocationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const locationIsStale = isLocationStale(location?.updatedAt);

  const locate = useCallback(async () => {
    setActionError(null);
    setLocating(true);
    try {
      const { coords } = await getCurrentPosition();
      return coords;
    } catch (error) {
      setActionError(
        geolocationErrorMessage(error as GeolocationError)
      );
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  const goOnline = async () => {
    const coords = await locate();
    if (!coords) return;
    setBusy(true);
    const res = await setWorkerAvailability({ available: true, coords });
    setBusy(false);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    setIsAvailable(true);
    setLocation({ updatedAt: new Date().toISOString(), coordsSet: true });
  };

  const goOffline = async () => {
    setBusy(true);
    setActionError(null);
    const res = await setWorkerAvailability({ available: false });
    setBusy(false);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    setIsAvailable(false);
    setLocation(null);
  };

  const refreshLocation = async () => {
    const coords = await locate();
    if (!coords) return;
    setBusy(true);
    const res = await updateWorkerLocation(coords);
    setBusy(false);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    setLocation({ updatedAt: new Date().toISOString(), coordsSet: true });
  };

  const toggleService = (serviceId: string) => {
    setServicesSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const saveServices = async () => {
    setServicesSaving(true);
    setServicesError(null);
    const res = await saveWorkerServices({ serviceIds: [...selected] });
    setServicesSaving(false);
    if (!res.ok) {
      setServicesError(res.error);
      return;
    }
    setServicesSaved(true);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    const res = await saveWorkerProfile({
      description,
      experienceYears: Number(experienceYears),
      serviceRadiusKm: Number(radius),
    });
    setProfileSaving(false);
    if (!res.ok) {
      setProfileError(res.error);
      return;
    }
    setProfileSaved(true);
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Availability */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isAvailable ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                )}
              />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {isAvailable ? "Available" : "Offline"}
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isAvailable
                ? "You appear in nearby searches with a fresh location."
                : "Turn availability on to start receiving booking requests."}
            </p>

            {isAvailable && (
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-zinc-600 dark:text-zinc-400">
                  {locationLoading
                    ? "Loading location status…"
                    : location?.coordsSet && location.updatedAt
                      ? `Location last updated ${timeAgo(location.updatedAt)}`
                      : "Location not shared yet"}
                </p>
                {locationIsStale && (
                  <p className="text-amber-600 dark:text-amber-400">
                    Your location is stale — update it so customers can find
                    you.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isAvailable ? (
              <>
                <Button
                  variant="outline"
                  loading={locating || busy}
                  disabled={!location?.coordsSet}
                  onClick={() => void refreshLocation()}
                >
                  Update location
                </Button>
                <Button
                  variant="danger"
                  loading={busy && !locating}
                  onClick={() => void goOffline()}
                >
                  Go offline
                </Button>
              </>
            ) : (
              <Button
                loading={locating || busy}
                onClick={() => void goOnline()}
              >
                Go online
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Alert message={actionError} />
        </div>
      </section>

      {/* Services */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Your services
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Choose which service categories you offer.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {services.map((service) => {
            const checked = selected.has(service.id);
            return (
              <label
                key={service.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  checked
                    ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950"
                    : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleService(service.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {service.name}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button loading={servicesSaving} onClick={() => void saveServices()}>
            Save services
          </Button>
          {servicesSaved && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Saved
            </span>
          )}
        </div>
        <div className="mt-3">
          <Alert message={servicesError} />
        </div>
      </section>

      {/* Profile */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Public profile
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Shown to customers on your profile and search results.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="profile-description">About you</Label>
            <Textarea
              id="profile-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              placeholder="Describe your experience, qualifications and typical jobs."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="profile-experience">Years of experience</Label>
              <Input
                id="profile-experience"
                type="number"
                min={0}
                max={100}
                value={experienceYears}
                onChange={(event) => setExperienceYears(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="profile-radius">
                Service radius (km, max 500)
              </Label>
              <Input
                id="profile-radius"
                type="number"
                min={1}
                max={500}
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button loading={profileSaving} onClick={() => void saveProfile()}>
            Save profile
          </Button>
          {profileSaved && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Saved
            </span>
          )}
        </div>
        <div className="mt-3">
          <Alert message={profileError} />
        </div>
      </section>
    </div>
  );
}
