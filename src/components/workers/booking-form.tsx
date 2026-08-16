"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { createBooking } from "@/app/actions/bookings";
import { reverseGeocode } from "@/app/actions/geo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  geolocationErrorMessage,
  getCurrentPosition,
  type Coordinates,
} from "@/lib/geolocation";

const MIN_PREFERRED_TIME = new Date(Date.now() + 60 * 60 * 1000)
  .toISOString()
  .slice(0, 16);

type BookingFormProps = {
  workerId: string;
  services: { id: string; name: string }[];
};

export function BookingForm({ workerId, services }: BookingFormProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success"
  >("idle");
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const attachLocation = async () => {
    if (coords) {
      setCoords(null);
      setLocationLabel(null);
      return;
    }
    setLocating(true);
    setLocationError(null);
    try {
      const result = await getCurrentPosition();
      setCoords(result.coords);
      const label = await reverseGeocode(result.coords.lat, result.coords.lng);
      setLocationLabel(label);
    } catch (e) {
      setLocationError(geolocationErrorMessage(e as Parameters<typeof geolocationErrorMessage>[0]));
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!selectedServiceId) {
      setError("Please pick a service before sending your request.");
      return;
    }

    const preferredRaw = String(formData.get("preferredTime") ?? "");
    if (Number.isNaN(Date.parse(preferredRaw))) {
      setError("Choose a preferred date and time.");
      return;
    }

    setStatus("submitting");
    setError(null);

    const result = await createBooking({
      workerId,
      serviceId: selectedServiceId,
      jobDescription: String(formData.get("jobDescription") ?? ""),
      preferredTime: new Date(preferredRaw).toISOString(),
      address: String(formData.get("address") ?? ""),
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    });

    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      return;
    }

    setStatus("success");
    setCreatedBookingId(result.bookingId);
    form.reset();
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
        <p className="font-medium text-emerald-800 dark:text-emerald-300">
          Booking request sent!
        </p>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
          The worker has received your request and will confirm shortly. Your
          booking status is{" "}
          <span className="font-medium">Pending</span>.
        </p>
        {createdBookingId && (
          <p className="mt-1 break-all font-mono text-xs text-emerald-700 dark:text-emerald-400">
            Reference: {createdBookingId}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/bookings/${createdBookingId}`}
            className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            View booking
          </Link>
          <Link
            href="/customer/dashboard"
            className="inline-flex h-9 items-center rounded-lg border border-emerald-600 px-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          This worker hasn&apos;t added any services yet
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          They can&apos;t receive booking requests until they add a service to
          their profile.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="booking-service">Pick a service</Label>
        <select
          id="booking-service"
          name="serviceId"
          required
          value={selectedServiceId}
          onChange={(event) => setSelectedServiceId(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all focus:border-emerald-500 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-emerald-900"
        >
          <option value="" disabled>
            Select a service…
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {services.length} service{services.length === 1 ? "" : "s"} available
          from this worker
        </p>
      </div>

      <div>
        <Label htmlFor="booking-time">Preferred date & time</Label>
        <Input
          id="booking-time"
          name="preferredTime"
          type="datetime-local"
          required
          min={MIN_PREFERRED_TIME}
        />
      </div>

      <div>
        <Label htmlFor="booking-description">What do you need done?</Label>
        <Textarea
          id="booking-description"
          name="jobDescription"
          required
          rows={4}
          minLength={10}
          placeholder="Describe the job, location details, and anything the worker should know."
        />
      </div>

      <div>
        <Label htmlFor="booking-address">Job address</Label>
        <Input
          id="booking-address"
          name="address"
          type="text"
          required
          placeholder="123 Main St, Springfield"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => void attachLocation()}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {locating ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Getting location…
            </>
          ) : coords ? (
            <>
              <span className="text-emerald-600">✓</span> Location attached (
              {locationLabel ?? "Location detected"}) — tap to remove
            </>
          ) : (
            "Attach my current location for the worker"
          )}
        </button>
        {locationError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {locationError}
          </p>
        )}
      </div>

      <Alert message={error} />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={status === "submitting"}
      >
        Send booking request
      </Button>
    </form>
  );
}
