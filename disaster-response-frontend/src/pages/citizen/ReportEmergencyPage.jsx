import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { DISASTER_TYPES, SEVERITY_LEVELS } from '../../constants/incidentConstants';
import incidentService from '../../services/incidentService';
import { getCitizenTrackingUrl, saveIncidentTrackingToken } from '../../services/trackingService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ErrorAlert from '../../components/common/ErrorAlert';
import { searchLocationSuggestions } from '../../utils/geocoding';

const ReportEmergencyPage = () => {
  const { showToast } = useNotification();
  const { session } = useAuth();

  const [formData, setFormData] = useState({
    disasterType: 'Fire',
    location: '',
    description: '',
    severity: 'Medium',
    contactInfo: session?.name ? `${session.name}@emergency.gov` : '',
    evidenceFile: null,
  });

  const [geoData, setGeoData] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    isLocating: false,
    geoError: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [submittedIncidentId, setSubmittedIncidentId] = useState(null);
  const [submittedTrackingToken, setSubmittedTrackingToken] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const locationRequestRef = useRef(null);

  useEffect(() => {
    const query = formData.location.trim();
    if (selectedLocation?.displayName === query) {
      setLocationSuggestions([]);
      setLocationSearchError(null);
      return undefined;
    }
    if (query.length < 3) {
      setLocationSuggestions([]);
      setLocationSearchError(null);
      setIsSearchingLocation(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      locationRequestRef.current?.abort();
      const controller = new AbortController();
      locationRequestRef.current = controller;
      setIsSearchingLocation(true);
      setLocationSearchError(null);
      try {
        const suggestions = await searchLocationSuggestions(query, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setLocationSuggestions(suggestions);
          setLocationSearchError(suggestions.length ? null : 'No matching place found. Refine the address or include a city/country.');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLocationSuggestions([]);
          setLocationSearchError(err.message || 'Location search is unavailable. Please refine the address or try again.');
        }
      } finally {
        if (!controller.signal.aborted) setIsSearchingLocation(false);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      locationRequestRef.current?.abort();
    };
  }, [formData.location, locationConfirmed, selectedLocation]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoData((prev) => ({
        ...prev,
        geoError: 'Browser geolocation is not supported on this device.',
      }));
      return;
    }

    setGeoData((prev) => ({ ...prev, isLocating: true, geoError: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const formattedCoords = `Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)}`;

        setGeoData({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: Math.round(accuracy),
          isLocating: false,
          geoError: null,
        });

        const locationText = formData.location ? `${formData.location} (${formattedCoords})` : formattedCoords;
        setSelectedLocation({ displayName: locationText, latitude, longitude, source: 'GPS' });
        setLocationConfirmed(true);

        setFormData((prev) => ({
          ...prev,
          location: locationText,
        }));

        setErrors((prev) => ({ ...prev, location: '' }));
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setGeoData((prev) => ({
          ...prev,
          isLocating: false,
          geoError: 'Location service denied or timed out. Please enter manual address.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validate = (data) => {
    const errs = {};
    if (!data.disasterType?.trim()) {
      errs.disasterType = 'Please select a disaster type.';
    }
    if (!data.location?.trim()) {
      errs.location = 'Incident location or address is required.';
    } else if (!selectedLocation || !locationConfirmed || geoData.latitude === null || geoData.longitude === null) {
      errs.location = 'Choose a location search result and confirm it before submitting. Unresolved addresses cannot be mapped.';
    }
    return errs;
  };

  const handleChange = (field, value) => {
    if (field === 'location') {
      setSelectedLocation(null);
      setLocationConfirmed(false);
      setGeoData((prev) => ({ ...prev, latitude: null, longitude: null, accuracy: null, geoError: null }));
    }
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (touched[field]) {
        const valErrors = validate(updated);
        setErrors((prevErr) => ({ ...prevErr, [field]: valErrors[field] || '' }));
      }
      return updated;
    });
  };

  const handleClear = () => {
    setFormData({
      disasterType: 'Fire',
      location: '',
      description: '',
      severity: 'Medium',
      contactInfo: '',
      evidenceFile: null,
    });
    setErrors({});
    setTouched({});
    setGeoData({
      latitude: null,
      longitude: null,
      accuracy: null,
      isLocating: false,
      geoError: null,
    });
    setLocationSuggestions([]);
    setLocationSearchError(null);
    setSelectedLocation(null);
    setLocationConfirmed(false);
  };

  const handleLocationSelect = (suggestion) => {
    const latitude = Number(suggestion.latitude);
    const longitude = Number(suggestion.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setFormData((prev) => ({ ...prev, location: suggestion.displayName }));
    setGeoData((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      accuracy: null,
      geoError: null,
    }));
    setSelectedLocation(suggestion);
    setLocationConfirmed(false);
    setLocationSuggestions([]);
    setLocationSearchError(null);
    setErrors((prev) => ({ ...prev, location: '' }));
  };

  const confirmSelectedLocation = () => {
    if (!selectedLocation || geoData.latitude === null || geoData.longitude === null) return;
    setLocationConfirmed(true);
    setErrors((prev) => ({ ...prev, location: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ disasterType: true, location: true });

    const valErrors = validate(formData);
    setErrors(valErrors);
    if (Object.keys(valErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        disasterType: formData.disasterType.trim(),
        location: formData.location.trim(),
        description: formData.description?.trim() || '',
        severity: formData.severity,
        source: 'CITIZEN',
        status: 'PENDING_VERIFICATION',
        contactInfo: formData.contactInfo?.trim() || null,
        imageUrl: formData.evidenceFile ? `evidence_${Date.now()}.jpg` : null,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
      };

      const result = await incidentService.createIncident(payload);
      const trackingToken = typeof result.trackingToken === 'string' ? result.trackingToken.trim() : '';
      if (!result.id || !trackingToken) {
        throw new Error('The incident was created, but the backend did not return its tracking token.');
      }
      setSubmittedIncidentId(result.id);
      setSubmittedTrackingToken(trackingToken);
      saveIncidentTrackingToken(result.id, trackingToken);
      showToast('Incident reported successfully to the emergency response system.', 'success');
    } catch (err) {
      console.error('Failed to submit emergency report:', err);
      setServerError(err.message || 'Failed to submit incident to server.');
      showToast(err.message || 'Submission error.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedIncidentId) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 font-sans">
        <div className="max-w-xl mx-auto rounded border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-50 text-[#059669]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#172033]">Incident Report Submitted</h1>
              <p className="text-xs text-[#64748B]">Official confirmation from disaster response system</p>
            </div>
          </div>

          <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Generated Incident ID:</span>
              <span className="font-mono font-bold text-[#172033]">#{submittedIncidentId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Status:</span>
              <span className="font-semibold text-amber-700">PENDING_VERIFICATION</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Disaster Type:</span>
              <span className="font-semibold text-[#172033]">{formData.disasterType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Location:</span>
              <span className="text-[#172033] truncate max-w-[240px]">{formData.location}</span>
            </div>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Your emergency report has been recorded. It will be verified by responding authorities.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={getCitizenTrackingUrl(submittedIncidentId, submittedTrackingToken)}
              className="rounded bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Track This Incident
            </Link>
            <Link
              to="/citizen/reports"
              className="rounded border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 transition"
            >
              View My Reports
            </Link>
            <button
              onClick={() => {
                setSubmittedIncidentId(null);
                setSubmittedTrackingToken(null);
                handleClear();
              }}
              className="rounded border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 transition"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 font-sans space-y-6">
      <div className="space-y-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#172033] transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
          Report an Incident
        </h1>
        <p className="text-xs text-[#64748B]">
          Provide details of the emergency. Required fields are marked with an asterisk (*).
        </p>
      </div>

      {serverError && (
        <ErrorAlert title="Submission Error" message={serverError} />
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl rounded border border-[#E2E8F0] bg-white p-5 sm:p-6 space-y-5">
        {/* Disaster Type */}
        <div className="space-y-1.5">
          <label htmlFor="disasterType" className="block text-xs font-semibold text-[#172033]">
            Disaster Type <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="disasterType"
            value={formData.disasterType}
            onChange={(e) => handleChange('disasterType', e.target.value)}
            className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
          >
            {DISASTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.disasterType && (
            <p className="text-xs text-[#DC2626]">{errors.disasterType}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="location" className="block text-xs font-semibold text-[#172033]">
              Location or Address <span className="text-[#DC2626]">*</span>
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={geoData.isLocating}
              className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline disabled:opacity-50"
            >
              <Navigation className="w-3 h-3" />
              <span>{geoData.isLocating ? 'Detecting GPS...' : 'Use Current Location'}</span>
            </button>
          </div>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Street address, building, or landmark"
            className={`w-full rounded border px-3 py-2 text-xs text-[#172033] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none ${
              errors.location ? 'border-[#DC2626]' : 'border-[#E2E8F0]'
            }`}
          />
          {isSearchingLocation && (
            <p className="flex items-center gap-1 text-[11px] text-[#64748B]"><Loader2 className="h-3 w-3 animate-spin" />Searching verified place names…</p>
          )}
          {!isSearchingLocation && locationSearchError && (
            <p className="text-[11px] text-amber-700">{locationSearchError}</p>
          )}
          {locationSuggestions.length > 0 && (
            <div className="relative z-20">
              <ul className="absolute left-0 right-0 max-h-56 overflow-auto rounded border border-[#CBD5E1] bg-white shadow-lg" aria-label="Location suggestions">
                {locationSuggestions.map((suggestion) => (
                  <li key={`${suggestion.placeId || suggestion.displayName}-${suggestion.latitude}-${suggestion.longitude}`}>
                    <button
                      type="button"
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full px-3 py-2 text-left text-xs text-[#172033] hover:bg-blue-50"
                    >
                      <span className="block font-semibold">{suggestion.name || suggestion.displayName}</span>
                      <span className="mt-0.5 block text-[11px] text-[#64748B]">{suggestion.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedLocation && !locationConfirmed && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-900">
              <span>Selected coordinates: {Number(geoData.latitude).toFixed(6)}, {Number(geoData.longitude).toFixed(6)}</span>
              <button type="button" onClick={confirmSelectedLocation} className="rounded bg-[#2563EB] px-2.5 py-1.5 font-semibold text-white hover:bg-blue-700">Confirm location</button>
            </div>
          )}
          {selectedLocation && locationConfirmed && (
            <p className="text-[11px] font-semibold text-[#059669]">Location confirmed and ready to map.</p>
          )}
          {geoData.latitude && (
            <p className="text-[11px] text-[#059669]">
              Coordinates: {geoData.latitude}, {geoData.longitude}
            </p>
          )}
          {geoData.geoError && (
            <p className="text-[11px] text-amber-700">{geoData.geoError}</p>
          )}
          {errors.location && (
            <p className="text-xs text-[#DC2626]">{errors.location}</p>
          )}
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <label htmlFor="severity" className="block text-xs font-semibold text-[#172033]">
            Estimated Severity <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="severity"
            value={formData.severity}
            onChange={(e) => handleChange('severity', e.target.value)}
            className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
          >
            {SEVERITY_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-xs font-semibold text-[#172033]">
            Description of Incident
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe what you see: visible flames, gas odor, injuries, or hazards."
            className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#172033] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        {/* Contact Info (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="contactInfo" className="block text-xs font-semibold text-[#172033]">
            Contact Information <span className="text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            id="contactInfo"
            value={formData.contactInfo}
            onChange={(e) => handleChange('contactInfo', e.target.value)}
            placeholder="Phone number or email address for follow-up"
            className="w-full rounded border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#172033] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        {/* Photograph Upload (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="evidenceFile" className="block text-xs font-semibold text-[#172033]">
            Photograph Attachment <span className="text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="file"
            id="evidenceFile"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                evidenceFile: e.target.files?.[0]?.name || null,
              }))
            }
            className="block w-full text-xs text-[#64748B] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[#E2E8F0] file:bg-[#F8FAFC] file:text-xs file:font-medium file:text-[#172033] hover:file:bg-slate-100"
          />
          <p className="text-[11px] text-[#64748B]">
            Note: The prototype records image metadata. Backend binary file upload service is optional.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting}
            className="rounded border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 transition"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Incident</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportEmergencyPage;
